import os
import sys
import time
import json
from google import genai
from google.genai.errors import APIError

api_key = os.environ.get("GEMINI_API_KEY")

if not api_key:
    print("خطا: GEMINI_API_KEY در متغیرهای مخفی یافت نشد.")
    sys.exit(1)

client = genai.Client(api_key=api_key)

# بررسی وجود فایل لاگ خطا
log_file_path = "test_output.log"
if os.path.exists(log_file_path):
    with open(log_file_path, "r", encoding="utf-8", errors="ignore") as f:
        # خواندن حداکثر ۱۰۰ خط آخر برای سبک ماندن پرامپت و جلوگیری از سرریز کانتکست
        lines = f.readlines()
        error_context = "".join(lines[-100:])
else:
    error_context = "فایل لاگ یافت نشد یا خطا مربوط به گیت‌های استاتیک است."

prompt = f"""
تو یک سیستم ۱ تریاژ سریع خطا (Fast CI Triage Gate) هستی.
وظیفه تو این است که خطای زیر را بررسی کنی و بدون توضیحات اضافه، صرفاً یک آبجکت JSON معتبر با کلیدهای زیر برگردانی:

{{
  "is_transient": true/false,       // آیا خطا موقت، ناشی از کش یا تست متزلزل (Flaky) است؟
  "category": "string",             // یکی از مقادیر: "dependency", "syntax", "business_logic", "network", "unknown"
  "confidence": 0.0-1.0,            // میزان اطمینان از تشخیص
  "escalate_to_jules": true/false,  // آیا نیاز به استدلال عمیق و بازنویسی کد توسط جولز دارد؟
  "summary": "string"               // یک خلاصه تک‌‌خطی به فارسی از علت خطا
}}

متن لاگ خطا:
{error_context}
"""

models_to_try = [
    "gemini-3.8-flash",
    "gemini-3.1-pro-preview",
]

delays = [3, 7, 15]
success = False
triage_result = None

for model_name in models_to_try:
    print(f"در حال ارزیابی لاگ با مدل: {model_name}...")
    for attempt, wait_time in enumerate(delays, start=1):
        try:
            chat = client.chats.create(model=model_name)
            response = chat.send_message(prompt)
            raw_text = response.text.strip()
            
            # تمیزکاری احتمالی Markdown codeblock
            if raw_text.startswith("```json"):
                raw_text = raw_text.split("```json")[1].split("```")[0].strip()
            elif raw_text.startswith("```"):
                raw_text = raw_text.split("```")[1].split("```")[0].strip()
                
            triage_result = json.loads(raw_text)
            success = True
            break
        except APIError as e:
            if e.code == 503:
                print(f"سرور {model_name} شلوغ است. تلاش مجدد {attempt}/{len(delays)} پس از {wait_time} ثانیه...")
                time.sleep(wait_time)
            else:
                print(f"خطای مدل {model_name}: {e.message}")
                break
        except Exception as e:
            print(f"خطا در پردازش JSON یا فراخوانی: {e}")
            break
    
    if success:
        break

if not success or not triage_result:
    print("خطا: ارزیابی با شکست مواجه شد. به صورت پیش‌فرض ارجاع به بررسی دستی تنظیم می‌شود.")
    triage_result = {
        "is_transient": False,
        "category": "unknown",
        "confidence": 0.0,
        "escalate_to_jules": True,
        "summary": "ارزیابی خودکار سیستم ۱ شکست خورد."
    }

print("\n--- نتیجه تریاژ خطای CI ---")
print(json.dumps(triage_result, indent=2, ensure_ascii=False))

# نوشتن خروجی‌ها در متغیرهای اکشن گیت‌هاب (GITHUB_OUTPUT)
github_output = os.environ.get("GITHUB_OUTPUT")
if github_output:
    with open(github_output, "a", encoding="utf-8") as f:
        f.write(f"is_transient={str(triage_result.get('is_transient', False)).lower()}\n")
        f.write(f"category={triage_result.get('category', 'unknown')}\n")
        f.write(f"confidence={triage_result.get('confidence', 0.0)}\n")
        f.write(f"escalate_to_jules={str(triage_result.get('escalate_to_jules', True)).lower()}\n")
        f.write(f"summary={triage_result.get('summary', '')}\n")

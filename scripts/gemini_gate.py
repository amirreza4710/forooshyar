import os
import sys
import time
from google import genai
from google.genai.errors import APIError

api_key = os.environ.get("GEMINI_API_KEY")

if not api_key:
    print("خطا: GEMINI_API_KEY در متغیرهای مخفی یافت نشد.")
    sys.exit(1)

client = genai.Client(api_key=api_key)

# لیست مدل‌ها با اولویت برای پشتیبان‌‌گیری در زمان شلوغی سرور
models_to_try = ["gemini-3.8-flash", "gemini-2.5-pro", "gemini-2.0-flash"]
prompt = "پایپ‌لاین CI ریپازیتوری فعال شد. یک تاییدیه سیستم ۱ ساختاریافته تک‌خطی بنویس."

success = False

for model_name in models_to_try:
    print(f"در حال تلاش برای اتصال به مدل: {model_name}...")
    for attempt in range(1, 4):
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
            )
            print("پاسخ مدل جیمینای:")
            print(response.text)
            success = True
            break
        except APIError as e:
            if e.code == 503:
                print(f"سرور مدل {model_name} شلوغ است (۵۰۳). تلاش مجدد {attempt}/3 پس از ۳ ثانیه...")
                time.sleep(3)
            else:
                print(f"خطای مدل {model_name}: {e.message}")
                break
        except Exception as e:
            print(f"خطای پیش‌بینی نشده: {e}")
            break
    
    if success:
        break

if not success:
    print("خطا: تمامی تلاش‌ها برای اتصال به مدل‌های در دسترس با شکست مواجه شد.")
    sys.exit(1)

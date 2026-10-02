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

# مدل‌های فعال و معتبر طبق لاگ پلتفرم
models_to_try = [
    "gemini-3.8-flash",
    "gemini-3.1-pro-preview",
]

prompt = "پایپ‌لاین CI ریپازیتوری فعال شد. یک تاییدیه سیستم ۱ ساختاریافته تک‌خطی بنویس."
delays = [3, 7, 15]
success = False

for model_name in models_to_try:
    print(f"در حال تلاش برای اتصال به مدل: {model_name}...")
    for attempt, wait_time in enumerate(delays, start=1):
        try:
            # استفاده از چت برای جلوگیری از اخطار AFC
            chat = client.chats.create(model=model_name)
            response = chat.send_message(prompt)
            
            print("پاسخ مدل جیمینای:")
            print(response.text)
            success = True
            break
        except APIError as e:
            if e.code == 503:
                print(f"سرور مدل {model_name} موقتاً شلوغ است (۵۰۳). تلاش مجدد {attempt}/{len(delays)} پس از {wait_time} ثانیه...")
                time.sleep(wait_time)
            else:
                print(f"خطای مدل {model_name}: {e.message}")
                break
        except Exception as e:
            print(f"خطای پیش‌بینی نشده در {model_name}: {e}")
            break
    
    if success:
        break

if not success:
    print("خطا: تمامی تلاش‌ها برای اتصال به مدل‌های فعال با شکست مواجه شد.")
    sys.exit(1)

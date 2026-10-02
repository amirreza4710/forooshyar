import os
import sys
from google import genai

# دریافت کلید از متغیرهای محیطی
api_key = os.environ.get("GEMINI_API_KEY")

if not api_key:
    print("خطا: GEMINI_API_KEY در متغیرهای مخفی یافت نشد.")
    sys.exit(1)

# مقداردهی کلاینت رسمی google-genai
client = genai.Client(api_key=api_key)

try:
    response = client.models.generate_content(
        model="gemini-3.8-flash",
        contents="پایپ‌لاین CI ریپازیتوری فعال شد. یک تاییدیه سیستم ۱ ساختاریافته تک‌خطی بنویس.",
    )
    print("پاسخ مدل جیمینای:")
    print(response.text)
except Exception as e:
    print(f"خطا در فراخوانی مدل: {e}")
    sys.exit(1)

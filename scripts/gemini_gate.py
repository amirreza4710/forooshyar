import os
import sys
from google import genai

# دریافت کلید از سکرت گیت‌هاب
api_key = os.environ.get("GEMINI_API_KEY")

if not api_key:
    print("خطا: GEMINI_API_KEY در متغیرهای مخفی یافت نشد.")
    sys.exit(1)

# کلاینت رسمی SDK جدید
client = genai.Client(api_key=api_key)

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="پایپ‌لاین CI ریپازیتوری فعال شد. یک تاییدیه سیستم ۱ ساختاریافته تک‌خطی بنویس.",
)

print("پاسخ مدل جیمینای:")
print(response.text)

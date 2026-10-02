import os
import sys
import google.generativeai as genai

# دریافت کلید از Secrets تعریف‌شده در گیت‌هاب
api_key = os.environ.get("GEMINI_API_KEY")

if not api_key:
    print("خطا: GEMINI_API_KEY در متغیرهای مخفی یافت نشد.")
    sys.exit(1)

genai.configure(api_key=api_key)

# استفاده از مدل سبک و فوق سریع برای مسیر سریع (Fast-Path)
model = genai.GenerativeModel("gemini-1.5-flash")

prompt = "پایپ‌لاین CI ریپازیتوری فعال شد. یک تاییدیه سیستم ۱ ساختاریافته تک‌خطی چاپ کن."

response = model.generate_content(prompt)
print("پاسخ مدل جیمینای:")
print(response.text)

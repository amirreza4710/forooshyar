import os
import sys
import google.generativeai as genai

api_key = os.environ.get("GEMINI_API_KEY")

if not api_key:
    print("خطا: GEMINI_API_KEY در متغیرهای مخفی یافت نشد.")
    sys.exit(1)

genai.configure(api_key=api_key)

# مدل سریع برای بررسی Fast-Path
model = genai.GenerativeModel("gemini-1.5-flash")

response = model.generate_content("پایپ‌لاین CI ریپازیتوری فعال شد. یک تاییدیه سیستم ۱ ساختاریافته تک‌خطی بنویس.")
print("پاسخ مدل جیمینای:")
print(response.text)

export function parseRial(value: string): number | null {
  const digits = value.trim().replace(/[۰-۹]/g, d => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[٠-٩]/g, d => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
  if (!/^(?:[0-9]+|[0-9]{1,3}(?:[,٬][0-9]{3})+)$/.test(digits)) return null;
  const amount = Number(digits.replace(/[,٬]/g, ""));
  return Number.isSafeInteger(amount) && amount >= 0 ? amount : null;
}

import { Input } from "@/components/ui/input";
import { parseRial } from "@/lib/currency";
import { useId, type ComponentProps } from "react";
export function CurrencyInput({ value, onChange, ...props }: Omit<ComponentProps<typeof Input>, "value" | "onChange" | "type"> & { value: string | number; onChange: (value: string) => void }) {
  const errorId = useId();
  const describedBy = [props["aria-describedby"], ...(String(value).trim() !== "" && parseRial(String(value)) === null ? [errorId] : [])].filter(Boolean).join(" ") || undefined;
  const invalid = String(value).trim() !== "" && parseRial(String(value)) === null;
  return <div className="space-y-1"><div className="flex items-center gap-2"><Input {...props} type="text" inputMode="numeric" dir="ltr" value={value} aria-invalid={invalid || undefined} aria-describedby={describedBy} onChange={e => onChange(e.target.value.replace(/[۰-۹]/g, d => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[٠-٩]/g, d => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))))} /><span className="text-sm text-muted-foreground">ریال</span></div>{invalid && <p id={errorId} role="alert" className="text-sm text-destructive">مبلغ باید عدد صحیح و نامنفی باشد.</p>}</div>;
}

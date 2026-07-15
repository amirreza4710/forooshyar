/**
 * Export data as a UTF-8 CSV file (BOM-prefixed for Excel compatibility)
 */
export function exportCSV(filename: string, headers: string[], rows: (string | number)[][][]) {
  const bom = "\uFEFF";
  const escape = (v: string | number) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csvRows = [headers, ...rows.map(r => r.flat())].map(row => row.map(escape).join(","));
  const csv = bom + csvRows.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function todayStr() {
  return new Date().toLocaleDateString("fa-IR").replace(/\//g, "-");
}

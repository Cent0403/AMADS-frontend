/** Exporta datos a CSV (compatible con Excel) */
export function exportCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => {
      const v = row[h];
      const s = v == null ? '' : String(v);
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(',')
  );
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Prepara la ventana para imprimir (PDF) */
export function printToPDF(title: string, elementId: string) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    window.print();
    return;
  }
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head><title>${title}</title>
    <style>
      body{font-family:sans-serif;padding:16px;font-size:12px}
      table{border-collapse:collapse;width:100%}
      th,td{border:1px solid #ddd;padding:6px;text-align:left}
      th{background:#f5f5f5}
      .text-right{text-align:right}
      .text-amber{color:#b45309}
    </style>
    </head>
    <body><h1>${title}</h1>${el.outerHTML}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.print();
    printWindow.close();
  };
}

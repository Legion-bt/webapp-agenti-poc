/**
 * Utility for exporting data to CSV/Excel format directly in the browser
 */
export function exportToCSV(filename: string, rows: Record<string, any>[]): void {
  if (!rows || rows.length === 0) return;

  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(';'),
    ...rows.map((row) =>
      headers
        .map((fieldName) => {
          let val = row[fieldName];
          if (val === null || val === undefined) val = '';
          const str = String(val).replace(/"/g, '""');
          return `"${str}"`;
        })
        .join(';')
    ),
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

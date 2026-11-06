type Cell = string | number;

export async function exportPdf(title: string, headers: string[], rows: Cell[][]) {
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const doc = new jsPDF({ orientation: headers.length > 5 ? "landscape" : "portrait" });
  doc.setFontSize(14);
  doc.text(`TUCASA Nyerere Campus — ${title}`, 14, 16);
  doc.setFontSize(9);
  doc.text(`Generated ${new Date().toLocaleString()} · ${rows.length} records`, 14, 22);
  autoTable(doc, { head: [headers], body: rows.map((r) => r.map(String)), startY: 27, styles: { fontSize: 9 }, headStyles: { fillColor: [17, 50, 99] } });
  doc.save(`${slug(title)}.pdf`);
}

export async function exportExcel(title: string, headers: string[], rows: Cell[][]) {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 31).replace(/[\\/?*[\]:]/g, " "));
  XLSX.writeFile(wb, `${slug(title)}.xlsx`);
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

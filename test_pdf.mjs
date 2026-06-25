import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

console.log('jsPDF type:', typeof jsPDF);
console.log('autoTable type:', typeof autoTable);

try {
  const doc = new jsPDF();
  console.log('doc created:', typeof doc);
  
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Test Report', 14, 20);

  const result = autoTable(doc, {
    startY: 30,
    head: [['Name', 'Value']],
    body: [['Test', '₹1,234']],
    theme: 'striped',
    headStyles: { fillColor: [20, 184, 166] },
  });
  
  console.log('autoTable result type:', typeof result);
  console.log('autoTable result keys:', result ? Object.keys(result) : 'null');
  console.log('finalY:', result?.finalY);

  const output = doc.output('arraybuffer');
  console.log('PDF size:', output.byteLength, 'bytes');
  console.log('SUCCESS - PDF generation works');
} catch (err) {
  console.error('ERROR:', err.message);
  console.error('Stack:', err.stack);
}

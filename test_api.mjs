import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

try {
  const doc = new jsPDF();
  
  if (typeof doc.autoTable === 'function') {
    doc.autoTable({
      startY: 30,
      head: [['Name', 'Value']],
      body: [['Test', '1,234']],
    });
    console.log('SUCCESS - doc.autoTable works!');
    console.log('finalY:', doc.lastAutoTable.finalY);
  } else {
    console.log('ERROR: doc.autoTable is not a function');
  }
} catch (err) {
  console.log('ERROR:', err.message);
}

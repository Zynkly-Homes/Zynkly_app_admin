import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

try {
  const doc = new jsPDF();
  const rupeeText = '₹1,234.00';
  doc.text(rupeeText, 14, 20);
  console.log('SUCCESS - no error thrown on rupees');
} catch (err) {
  console.log('ERROR:', err.message);
}

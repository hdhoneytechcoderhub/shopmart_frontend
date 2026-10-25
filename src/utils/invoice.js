import { jsPDF } from 'jspdf';

const rs = (n) => `Rs. ${Number(n || 0).toLocaleString('en-IN')}`;
const fmtDate = (v) => {
  try { return new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return ''; }
};

// Generates and downloads a simple, clean PDF invoice for an order.
export function downloadInvoice(order) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const M = 48;
  let y = 56;

  const items = order.items || [];
  const subtotal = items.reduce((s, it) => s + (it.price || 0) * (it.quantity || 1), 0);
  const shipping = order.shipping || 0;
  const discount = order.discount || 0;
  const total = order.total ?? Math.max(0, subtotal + shipping - discount);

  // Brand header
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(79, 70, 229);
  doc.setFontSize(22);
  doc.text('ShopMart', M, y);
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(20);
  doc.text('INVOICE', W - M, y, { align: 'right' });

  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('ShopMart Retail Pvt. Ltd.', M, y);
  doc.text(`Invoice #: ${order.id}`, W - M, y, { align: 'right' });
  y += 13;
  doc.text('SG Highway, Ahmedabad, Gujarat 380015', M, y);
  doc.text(`Date: ${fmtDate(order.createdAt || Date.now())}`, W - M, y, { align: 'right' });
  y += 13;
  doc.text('support@shopmart.com', M, y);
  doc.text(`Payment: ${order.paymentMethod || '—'} (${order.paymentStatus || 'Paid'})`, W - M, y, { align: 'right' });

  // Divider
  y += 22;
  doc.setDrawColor(226, 232, 240);
  doc.line(M, y, W - M, y);

  // Billing
  y += 24;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Billed to', M, y);
  y += 15;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  const a = order.address || {};
  const lines = [a.name, a.line1, [a.city, a.state, a.pincode].filter(Boolean).join(', '), a.phone ? `Phone: ${a.phone}` : '']
    .filter(Boolean);
  lines.forEach((ln) => { doc.text(String(ln), M, y); y += 14; });

  // Items table header
  y += 12;
  const cols = { name: M, qty: W - M - 200, price: W - M - 110, amt: W - M };
  doc.setFillColor(241, 245, 249);
  doc.rect(M - 8, y - 14, W - 2 * M + 16, 24, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('ITEM', cols.name, y);
  doc.text('QTY', cols.qty, y, { align: 'right' });
  doc.text('PRICE', cols.price, y, { align: 'right' });
  doc.text('AMOUNT', cols.amt, y, { align: 'right' });
  y += 22;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  items.forEach((it) => {
    const nm = (it.name || 'Item').slice(0, 46);
    const variant = [it.size, it.color].filter(Boolean).join(' / ');
    doc.text(nm, cols.name, y);
    if (variant) { doc.setFontSize(8); doc.setTextColor(100, 116, 139); doc.text(variant, cols.name, y + 12); doc.setFontSize(10); doc.setTextColor(15, 23, 42); }
    doc.text(String(it.quantity || 1), cols.qty, y, { align: 'right' });
    doc.text(rs(it.price), cols.price, y, { align: 'right' });
    doc.text(rs((it.price || 0) * (it.quantity || 1)), cols.amt, y, { align: 'right' });
    y += variant ? 30 : 20;
  });

  // Totals
  y += 6;
  doc.setDrawColor(226, 232, 240);
  doc.line(cols.qty - 20, y, W - M, y);
  y += 18;
  const totalRow = (label, value, bold) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(bold ? 12 : 10);
    doc.setTextColor(bold ? 15 : 100, bold ? 23 : 116, bold ? 42 : 139);
    doc.text(label, cols.price, y, { align: 'right' });
    doc.setTextColor(15, 23, 42);
    doc.text(value, cols.amt, y, { align: 'right' });
    y += bold ? 22 : 17;
  };
  totalRow('Subtotal', rs(subtotal));
  totalRow('Shipping', shipping === 0 ? 'FREE' : rs(shipping));
  if (discount > 0) totalRow('Discount', `- ${rs(discount)}`);
  totalRow('Total', rs(total), true);

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text('Thank you for shopping with ShopMart!', M, doc.internal.pageSize.getHeight() - 48);
  doc.text('This is a computer-generated invoice and does not require a signature.', M, doc.internal.pageSize.getHeight() - 34);

  doc.save(`ShopMart-Invoice-${order.id}.pdf`);
}

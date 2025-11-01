import PDFDocument from "pdfkit";

interface InvoiceData {
  transactionId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  productName: string;
  packageName: string;
  amount: number;
  unit: string;
  userId: string;
  gameId: string;
  username?: string;
  price: number;
  fee: number;
  total: number;
  paymentMethod: string;
  status: string;
  createdAt: Date;
  uniplayOrderId?: string;
}

export const generateInvoicePDF = async (data: InvoiceData): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(amount);
    };

    const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat("id-ID", {
        dateStyle: "long",
        timeStyle: "short",
      }).format(date);
    };

    doc.fontSize(24).font("Helvetica-Bold").text("TopAsli", { align: "center" });
    doc.fontSize(12).font("Helvetica").text("Gaming Top-Up Platform", { align: "center" });
    doc.moveDown();
    
    doc.fontSize(10).text("Jl. Contoh No. 123, Jakarta", { align: "center" });
    doc.text("Email: support@topasli.com | Phone: +62 812-3456-7890", { align: "center" });
    doc.moveDown(2);

    doc.strokeColor("#000000").lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown();

    doc.fontSize(18).font("Helvetica-Bold").text("INVOICE", { align: "center" });
    doc.moveDown(1.5);

    doc.fontSize(10).font("Helvetica-Bold").text(`Invoice Number: ${data.transactionId}`, 50);
    doc.font("Helvetica").text(`Date: ${formatDate(data.createdAt)}`, 50);
    doc.text(`Status: ${data.status.toUpperCase()}`, 50);
    doc.moveDown(1.5);

    doc.fontSize(12).font("Helvetica-Bold").text("CUSTOMER INFORMATION", 50);
    doc.moveDown(0.5);
    doc.fontSize(10).font("Helvetica");
    doc.text(`Name: ${data.customerName}`, 50);
    doc.text(`Email: ${data.customerEmail}`, 50);
    if (data.customerPhone) {
      doc.text(`Phone: ${data.customerPhone}`, 50);
    }
    doc.moveDown(1.5);

    doc.fontSize(12).font("Helvetica-Bold").text("GAME ACCOUNT INFORMATION", 50);
    doc.moveDown(0.5);
    doc.fontSize(10).font("Helvetica");
    if (data.username) {
      doc.text(`Username: ${data.username}`, 50);
    }
    doc.text(`User ID: ${data.userId}`, 50);
    if (data.gameId) {
      doc.text(`Game ID / Zone ID: ${data.gameId}`, 50);
    }
    if (data.uniplayOrderId) {
      doc.text(`UniPlay Order ID: ${data.uniplayOrderId}`, 50);
    }
    doc.moveDown(1.5);

    doc.fontSize(12).font("Helvetica-Bold").text("PURCHASE DETAILS", 50);
    doc.moveDown(0.5);

    const tableTop = doc.y;
    const col1 = 50;
    const col2 = 200;
    const col3 = 350;
    const col4 = 470;

    doc.fontSize(10).font("Helvetica-Bold");
    doc.text("Item", col1, tableTop);
    doc.text("Description", col2, tableTop);
    doc.text("Qty", col3, tableTop);
    doc.text("Amount", col4, tableTop);

    doc.moveDown(0.5);
    const lineY = doc.y;
    doc.strokeColor("#cccccc").lineWidth(0.5).moveTo(50, lineY).lineTo(545, lineY).stroke();
    
    doc.moveDown(0.5);
    doc.font("Helvetica");
    const itemY = doc.y;
    doc.text(data.productName, col1, itemY, { width: 140 });
    doc.text(data.packageName, col2, itemY, { width: 140 });
    doc.text(data.amount.toString(), col3, itemY);
    doc.text(formatCurrency(data.price), col4, itemY, { width: 75, align: "right" });

    doc.moveDown(2);
    const line2Y = doc.y;
    doc.strokeColor("#cccccc").lineWidth(0.5).moveTo(50, line2Y).lineTo(545, line2Y).stroke();

    doc.moveDown(0.5);
    const summaryX = 350;
    const amountX = 470;

    doc.font("Helvetica");
    doc.text("Subtotal:", summaryX, doc.y);
    doc.text(formatCurrency(data.price), amountX, doc.y, { width: 75, align: "right" });
    doc.moveDown(0.5);

    doc.text("Service Fee:", summaryX, doc.y);
    doc.text(formatCurrency(data.fee), amountX, doc.y, { width: 75, align: "right" });
    doc.moveDown(0.5);

    const totalY = doc.y;
    doc.strokeColor("#000000").lineWidth(1).moveTo(summaryX, totalY).lineTo(545, totalY).stroke();
    doc.moveDown(0.5);

    doc.fontSize(12).font("Helvetica-Bold");
    doc.text("TOTAL:", summaryX, doc.y);
    doc.text(formatCurrency(data.total), amountX, doc.y, { width: 75, align: "right" });
    doc.moveDown(1.5);

    doc.fontSize(10).font("Helvetica-Bold").text("PAYMENT METHOD", 50);
    doc.moveDown(0.5);
    doc.font("Helvetica").text(data.paymentMethod, 50);
    doc.moveDown(2);

    doc.fontSize(9).font("Helvetica-Oblique").fillColor("#666666");
    doc.text("Thank you for your purchase!", { align: "center" });
    doc.text("Items will be delivered to your game account within 5 minutes.", { align: "center" });
    doc.moveDown();
    doc.text("For support, please contact us at support@topasli.com", { align: "center" });

    doc.end();
  });
};

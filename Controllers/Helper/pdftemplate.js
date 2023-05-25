const fs = require("fs");
const moment = require("moment");
const formatePrice = require("../../commonFunction/formatedamount");
const PDFDocument = require("pdfkit");
let fontBold = "Helvetica-Bold";
function createPDF(GetReports, curr_month_year) {
  let doc = new PDFDocument({
    size: "A4",
    margin: 50,
    orientation: "portrait",
  });
  const headerArray = [
    "ID",
    "R-ID",
    "INV-ID",
    "Cust. ID",
    "Payment Method",
    "Payment date",
    "Tranaction Id",
    "Amount",
  ];
  //doc
  // .image("./uploads/svgicon.png", 25, 25, { width: 150 })
  // .fillColor("#444444")
  doc
    .fontSize(20)
    .text("Qatar International School", 40, 40, { align: "left" })
    .fontSize(11)
    .text("United Nations St, West Bay, P.O. Box: 5697", 41, 65, {
      align: "left",
    })
    .text("Doha, Qatar", 41, 83, { align: "left" })
    .moveDown();
  doc
    .fontSize(11)
    .text("Telephone : 44833456", 200, 40, { align: "right" })
    .text("Website : www.qis.org", 200, 55, { align: "right" })
    .text("Email : qisfinance@qis.org", 200, 72, { align: "right" })
    .moveDown();

  doc.fontSize(20);
  doc.text(`Sales Reports of ${curr_month_year}`, 5, 120, {
    align: "center",
    width: 600,
  });
  doc.fontSize(9);
  generateHeader(doc, headerArray);
  doc
    .rect(36, 172 + 10, 505, 0.2)
    .fillColor("#000")
    .stroke("#000");
  let productNo = 1;
  let amt = 0;
  GetReports.forEach((element) => {
    let y = 170 + productNo * 20;
    doc.fillColor("#000").text(productNo, 40, y, { width: 90 });
    doc.text(element.refrenceId, 60, y, { width: 190 });
    doc.text(element.amex_order_Id, 150, y, { width: 100 });
    doc.text(element.customerId, 200, y, { width: 100 });
    doc.text(element.paymentMethod, 250, y, { width: 100 });
    doc.text(
      moment(element.transactionDate, "YYYY MM DD").format("MMM DD, YYYY"),
      335,
      y,
      { width: 100 }
    );
    doc.text(element.transactionId, 410, y, { width: 100 });
    doc.text(formatePrice(element.paidAmount), 480, y, { width: 100 });
    productNo++;
    amt += element.paidAmount;
    doc
      .rect(36, 162 + productNo * 20, 505, 0.01)
      .stroke("#808080")
      .stroke("#808080");
  });
  doc.font(fontBold).text("Total Amount : ", 400, 210 + productNo * 20);
  doc.font(fontBold).text(` ${formatePrice(amt)}`, 476, 210 + productNo * 20);
  doc.end();
  doc.pipe(fs.createWriteStream("./document.pdf"));
}
function generateHeader(doc, headerArray) {
  doc
    .fontSize(10)
    .text(headerArray[0], 40, 170, { font: "Poppins,sans-serif" })
    .text(headerArray[1], 60, 170, { align: "left" })
    .text(headerArray[2], 150, 170, { align: "left" })
    .text(headerArray[3], 200, 170, { align: "left" })
    .text(headerArray[4], 250, 170, { align: "left" })
    .text(headerArray[5], 335, 170, { align: "left" })
    .text(headerArray[6], 410, 170, { align: "left" })
    .text(headerArray[7], 480, 170, { align: "left" })
    .moveDown();
}
module.exports = {
  createPDF,
};

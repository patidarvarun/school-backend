const fs = require("fs");
const moment = require("moment");
const formatePrice = require("../../commonFunction/formatedamount");
const PDFDocument = require("pdfkit");
let fontBold = "Helvetica-Bold";
//generate admin side receipt
function GenerateAdminSideReceipt(InvoiceTrxDet, invoice_items, parent_det) {
  //calculate wallet ballance
  let walletballance = 0;
  if (InvoiceTrxDet[0]?.creditAmount) {
    walletballance = InvoiceTrxDet[0].creditAmount;
  }
  let doc = new PDFDocument({
    size: "A4",
    margin: 50,
    orientation: "portrait",
  });
  doc
    .image("./uploads/Qatar_International_School_logo.jpg", 80, 50, {
      width: 80,
    })
    .fillColor("#444444");
  doc
    .fontSize(16)
    .font(fontBold)
    .text("Qatar International School", 170, 60, { align: "left" });
  doc
    .fontSize(10)
    .text("Qatar International School W.L.L", 171, 76, {
      align: "left",
    })
    .text("United Nations st, West Bay, P.O. Box: 5697", 171, 90, {
      align: "left",
    })
    .text("Doha, QATAR", 171, 106, { align: "left" })
    .moveDown();
  doc
    .fontSize(10)
    .text("Tel : 44833456", 85, 135, { align: "left" })
    .text("Website : www.qis.org", 200, 135, { align: "left" })
    .text("Email : qisfinance@qis.org", 350, 135, { align: "left" })
    .moveDown();
  doc.fontSize(18).text(`RECEIPT CONFIRMATION`, 5, 200, {
    align: "center",
    width: 600,
  });
  doc
    .fontSize(10)
    .text("Amount Received ", 90, 250, { align: "left" })
    .text(`${formatePrice(InvoiceTrxDet[0].amount)}` + "(QAR)", 200, 250, {
      align: "right",
    })
    .moveDown();
  {
    InvoiceTrxDet[0].status === "Partially paid"
      ? doc.image("./uploads/partialpaid.jpg", 270, 245, {
          width: 180,
          height: 35,
          align: "right",
        })
      : doc.image("./uploads/qispaid.png", 350, 240, {
          width: 100,
          height: 40,
          align: "right",
        });
  }
  doc
    .fontSize(9)
    .text("Pay. M. :  ", 90, 280, { align: "left" })
    .text(`${InvoiceTrxDet[0].paymentMethod}`, 135, 280, { align: "left" })
    .text("CHECK/RECEIPT NO. : ", 180, 280, { align: "left" })
    .text(`${InvoiceTrxDet[0].rct_number}`, 295, 280, { align: "left" })
    .text("Date Received : ", 405, 280, { align: "left" })
    .text(
      `${moment(InvoiceTrxDet[0].transaction_date, "YYYY MM DD").format(
        "MMM DD, YYYY"
      )}`,
      485,
      280,
      { align: "left" }
    )
    .moveDown();
  doc.fontSize(8);
  doc.text(
    ` Family ID       :  ${
      InvoiceTrxDet[0].parentId
        ? InvoiceTrxDet[0].parentId
        : parent_det[0]?.parent_id
    }`,
    92,
    305,
    {
      width: 410,
      align: "left",
    }
  );
  doc.moveDown();
  // doc.text(` Account No   : 12345`, 92, 320, {
  //   width: 410,
  //   align: "left",
  // });
  doc.text(
    ` Name            :  ${
      parent_det == null
        ? InvoiceTrxDet[0]?.name.toUpperCase()
        : parent_det[0]?.parent_name.toUpperCase()
    } `,
    92,
    320,
    {
      width: 410,
      align: "left",
    }
  );
  // draw bounding rectangle
  doc.rect(90, 300, 225, 80).stroke();
  doc.fontSize(8);
  doc.text(` DOCUMENT NO.       :  ${InvoiceTrxDet[0]?.invoice_id}`, 315, 305, {
    width: 410,
    align: "left",
  });
  doc.moveDown();
  doc.text(
    ` Date               :  ${moment(
      InvoiceTrxDet[0].invoice_due_date,
      "YYYY MM DD"
    ).format("MMM DD, YYYY")}`,
    315,
    320,
    {
      width: 410,
      align: "left",
    }
  );
  // Fit the image within the dimensions
  doc.rect(315, 300, 225, 40).stroke();
  doc.rect(315, 300, 225, 80).stroke();
  // Fit the image in the dimensions, and center it both horizontally and vertically
  doc.rect(90, 400, 450, 20).stroke();
  doc.text(` DOCUMENTS PAID`, 90, 408, {
    width: 300,
    align: "center",
  });
  doc.rect(405, 400, 0, 20).stroke();
  doc.text(` Amount (QAR)`, 420, 408, {
    width: 150,
    align: "center",
  });
  let productNo = 1;
  invoice_items.forEach((element) => {
    let y = 400 + productNo * 20;
    let ydown = 400 + productNo * 22.5;
    doc.rect(90, y, 450, 20).stroke();
    doc.text(`${element.item_name}`, 93, ydown, {
      width: 300,
      align: "left",
    });
    doc.rect(405, y, 0, 20).stroke();
    doc.text(`${formatePrice(element.item_total_price)}`, 405, ydown, {
      width: 120,
      align: "right",
    });
    productNo++;
  });
  doc.rect(90, 400 + productNo * 20, 450, 32).stroke();
  doc.text(
    ` ${InvoiceTrxDet[0].name.toUpperCase() + "  - "} ${
      InvoiceTrxDet[0]?.customerId == null
        ? InvoiceTrxDet[0].parentId
        : InvoiceTrxDet[0]?.customerId
    }`,
    90,
    427 + productNo * 15,
    {
      width: 300,
      align: "left",
    }
  );
  doc.rect(405, 400 + productNo * 20, 0, 32).stroke();
  doc.text(
    `${formatePrice(InvoiceTrxDet[0].paidAmount)}`,
    405,
    410 + productNo * 20,
    {
      width: 120,
      align: "right",
    }
  );
  doc.rect(90, 432 + productNo * 20, 450, 15).stroke();
  doc.text(`DEDUCT FROM WALLET :`, 90, 437 + productNo * 20, {
    width: 310,
    align: "right",
  });
  doc.rect(405, 432 + productNo * 20, 0, 15).stroke();
  doc.text(`${formatePrice(walletballance)}`, 405, 437 + productNo * 20, {
    width: 120,
    align: "right",
  });
  doc.rect(90, 447 + productNo * 20, 450, 15).stroke();
  doc.text(`UNAPPLIED AMOUNT :`, 90, 451 + productNo * 20, {
    width: 310,
    align: "right",
  });
  doc.rect(405, 447 + productNo * 20, 0, 15).stroke();
  doc.text(
    `${formatePrice(
      InvoiceTrxDet[0]?.amount_due == InvoiceTrxDet[0]?.paidAmount
        ? 0
        : InvoiceTrxDet[0]?.amount_due
    )}`,
    405,
    451 + productNo * 20,
    {
      width: 120,
      align: "right",
    }
  );
  doc.rect(90, 447 + productNo * 20, 450, 150).stroke();
  doc.text(`TOTAL AMOUNT RECEIVED :`, 90, 467 + productNo * 20, {
    width: 310,
    align: "right",
  });
  doc.rect(405, 447 + productNo * 20, 0, 150).stroke();
  doc.text(
    `${formatePrice(InvoiceTrxDet[0].paidAmount + walletballance)}`,
    405,
    467 + productNo * 20,
    {
      width: 120,
      align: "right",
    }
  );
  // doc
  //   .image("./uploads/qisstamp.png", 150, 487 + productNo * 20, {
  //     width: 200,
  //     height: 70,
  //     align: "right",
  //   })
  //   .fillColor("#444444");
  doc.text(
    `  Note : These fees are for tuition only and do not include transport, meals, books,
  or uniform.`,
    90,
    575 + productNo * 20,
    {
      width: 350,
      align: "left",
    }
  );
  doc.end();
  doc.pipe(
    fs.createWriteStream(
      `./receiptspdf/${"admin-"}${InvoiceTrxDet[0].rct_number}.pdf`
    )
  );
}
//generate  customer side receipt
function GenerateCustomerSideReceipt(InvoiceTrxDet, invoice_items, parent_det) {
  //calculate wallet ballance
  let walletballance = 0;
  if (InvoiceTrxDet[0]?.creditAmount) {
    walletballance = InvoiceTrxDet[0].creditAmount;
  }
  let doc = new PDFDocument({
    size: "A4",
    margin: 50,
    orientation: "portrait",
  });
  doc
    .image("./uploads/Qatar_International_School_logo.jpg", 80, 50, {
      width: 80,
    })
    .fillColor("#444444");
  doc
    .fontSize(16)
    .font(fontBold)
    .text("Qatar International School", 170, 60, { align: "left" });
  doc
    .fontSize(10)
    .text("Qatar International School W.L.L", 171, 76, {
      align: "left",
    })
    .text("United Nations st, West Bay, P.O. Box: 5697", 171, 90, {
      align: "left",
    })
    .text("Doha, QATAR", 171, 106, { align: "left" })
    .moveDown();

  doc
    .fontSize(10)
    .text("Tel : 44833456", 85, 135, { align: "left" })
    .text("Website : www.qis.org", 200, 135, { align: "left" })
    .text("Email : qisfinance@qis.org", 350, 135, { align: "left" })
    .moveDown();

  doc.fontSize(18).text(`RECEIPT CONFIRMATION`, 5, 200, {
    align: "center",
    width: 600,
  });
  doc
    .fontSize(10)
    .text("Amount Received ", 90, 250, { align: "left" })
    .text(`${formatePrice(InvoiceTrxDet[0]?.amount)}` + "(QAR)", 200, 250, {
      align: "right",
    })
    .moveDown();

  {
    InvoiceTrxDet[0].status === "Partially paid"
      ? doc.image("./uploads/partialpaid.jpg", 270, 245, {
          width: 180,
          height: 35,
          align: "right",
        })
      : doc.image("./uploads/qispaid.png", 350, 240, {
          width: 100,
          height: 40,
          align: "right",
        });
  }

  doc
    .fontSize(9)
    .text("Pay. M. :  ", 90, 280, { align: "left" })
    .text(`${InvoiceTrxDet[0].paymentMethod}`, 135, 280, { align: "left" })
    .text("CHECK/RECEIPT NO. : ", 180, 280, { align: "left" })
    .text(`${InvoiceTrxDet[0].rct_number}`, 295, 280, { align: "left" })
    .text("Date Received : ", 405, 280, { align: "left" })
    .text(
      `${moment(InvoiceTrxDet[0].transaction_date, "YYYY MM DD").format(
        "MMM DD, YYYY"
      )}`,
      485,
      280,
      { align: "left" }
    )
    .moveDown();
  doc.fontSize(8);
  doc.text(
    ` Family ID       :  ${
      InvoiceTrxDet[0].parentId
        ? InvoiceTrxDet[0].parentId
        : parent_det[0]?.parent_id
    }`,
    92,
    305,
    {
      width: 410,
      align: "left",
    }
  );
  doc.moveDown();
  // doc.text(` Account No   : 12345`, 92, 320, {
  //   width: 410,
  //   align: "left",
  // });
  doc.text(
    ` Name            :  ${
      parent_det == null
        ? InvoiceTrxDet[0]?.name.toUpperCase()
        : parent_det[0]?.parent_name.toUpperCase()
    } `,
    92,
    320,
    {
      width: 410,
      align: "left",
    }
  );
  // draw bounding rectangle
  doc.rect(90, 300, 225, 80).stroke();
  doc.fontSize(8);
  doc.text(` DOCUMENT NO.       :  ${InvoiceTrxDet[0]?.invoice_id}`, 315, 305, {
    width: 410,
    align: "left",
  });
  doc.moveDown();
  doc.text(
    ` Date               :  ${moment(
      InvoiceTrxDet[0].invoice_due_date,
      "YYYY MM DD"
    ).format("MMM DD, YYYY")}`,
    315,
    320,
    {
      width: 410,
      align: "left",
    }
  );
  // Fit the image within the dimensions
  doc.rect(315, 300, 225, 40).stroke();
  doc.rect(315, 300, 225, 80).stroke();
  // Fit the image in the dimensions, and center it both horizontally and vertically
  doc.rect(90, 400, 450, 20).stroke();
  doc.text(` DOCUMENTS PAID`, 90, 408, {
    width: 300,
    align: "center",
  });
  doc.rect(405, 400, 0, 20).stroke();
  doc.text(` Amount (QAR)`, 420, 408, {
    width: 150,
    align: "center",
  });
  let productNo = 1;
  invoice_items.forEach((element) => {
    let y = 400 + productNo * 20;
    let ydown = 400 + productNo * 22.5;
    doc.rect(90, y, 450, 20).stroke();
    doc.text(`${element.item_name}`, 93, ydown, {
      width: 300,
      align: "left",
    });
    doc.rect(405, y, 0, 20).stroke();
    doc.text(`${formatePrice(element.item_total_price)}`, 405, ydown, {
      width: 120,
      align: "right",
    });
    productNo++;
  });
  doc.rect(90, 400 + productNo * 20, 450, 32).stroke();
  doc.text(
    ` ${InvoiceTrxDet[0].name.toUpperCase() + "  - "} ${
      InvoiceTrxDet[0]?.customerId == null
        ? InvoiceTrxDet[0].parentId
        : InvoiceTrxDet[0]?.customerId
    }`,
    90,
    427 + productNo * 15,
    {
      width: 300,
      align: "left",
    }
  );
  doc.rect(405, 400 + productNo * 20, 0, 32).stroke();
  doc.text(
    `${formatePrice(InvoiceTrxDet[0].paidAmount)}`,
    405,
    410 + productNo * 20,
    {
      width: 120,
      align: "right",
    }
  );
  doc.rect(90, 432 + productNo * 20, 450, 15).stroke();
  doc.text(`DEDUCT FROM WALLET :`, 90, 437 + productNo * 20, {
    width: 310,
    align: "right",
  });
  doc.rect(405, 432 + productNo * 20, 0, 15).stroke();
  doc.text(`${formatePrice(walletballance)}`, 405, 437 + productNo * 20, {
    width: 120,
    align: "right",
  });
  doc.rect(90, 447 + productNo * 20, 450, 15).stroke();
  doc.text(`UNAPPLIED AMOUNT :`, 90, 451 + productNo * 20, {
    width: 310,
    align: "right",
  });
  doc.rect(405, 447 + productNo * 20, 0, 15).stroke();
  doc.text(
    `${formatePrice(
      InvoiceTrxDet[0]?.amount_due == InvoiceTrxDet[0]?.paidAmount
        ? 0
        : InvoiceTrxDet[0]?.amount_due
    )}`,
    405,
    451 + productNo * 20,
    {
      width: 120,
      align: "right",
    }
  );
  doc.rect(90, 447 + productNo * 20, 450, 150).stroke();
  doc.text(`TOTAL AMOUNT RECEIVED :`, 90, 467 + productNo * 20, {
    width: 310,
    align: "right",
  });
  doc.rect(405, 447 + productNo * 20, 0, 150).stroke();
  doc.text(
    `${formatePrice(InvoiceTrxDet[0].paidAmount + walletballance)}`,
    405,
    467 + productNo * 20,
    {
      width: 120,
      align: "right",
    }
  );
  doc
    .image("./uploads/qisstamp.png", 150, 487 + productNo * 20, {
      width: 200,
      height: 70,
      align: "right",
    })
    .fillColor("#444444");
  doc.text(
    `  Note : These fees are for tuition only and do not include transport, meals, books,
  or uniform.`,
    90,
    575 + productNo * 20,
    {
      width: 350,
      align: "left",
    }
  );
  doc.end();
  doc.pipe(
    fs.createWriteStream(
      `./receiptspdf/${"customer-"}${InvoiceTrxDet[0].rct_number}.pdf`
    )
  );
  doc.pipe(fs.createWriteStream("./invoicereceipt.pdf"));
}
module.exports = {
  GenerateAdminSideReceipt,
  GenerateCustomerSideReceipt,
};

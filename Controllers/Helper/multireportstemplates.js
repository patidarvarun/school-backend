const fs = require("fs");
const moment = require("moment");
const formatePrice = require("../../commonFunction/formatedamount");
const PDFDocument = require("pdfkit");
let fontBold = "Helvetica-Bold";
//generate admin side receipt
function GenerateAdminSideReceiptStatemets(
  InvoiceTrxDet,
  invoice_items,
  parent_det
) {
  //calculate paid amount
  var paidamount = 0;
  for (let d of InvoiceTrxDet) {
    paidamount = paidamount + Number(d.paidAmount);
  }
  let doc = new PDFDocument({
    size: "A4",
    margin: 80,
    orientation: "portrait",
  });
  /////////########## header part ##################################
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
    .text("Date Received : ", 90, 280, { align: "left" })
    .text(
      `${moment(InvoiceTrxDet[0].transaction_date, "YYYY MM DD").format(
        "MMM DD, YYYY"
      )}`,
      165,
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
  doc.text(
    ` Customer ID      :  ${
      InvoiceTrxDet[0]?.customerId == null
        ? InvoiceTrxDet[0].parentId
        : InvoiceTrxDet[0]?.customerId
    }`,
    92,
    340,
    {
      width: 410,
      align: "left",
    }
  );
  doc.moveDown();
  doc.text(
    ` Name        :  ${InvoiceTrxDet[0]?.name.toUpperCase()} `,
    92,
    355,
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
  doc.rect(315, 300, 225, 40).stroke();
  doc.rect(315, 300, 225, 80).stroke();

  /////////########## Invoice Items Details part ##################################
  doc.rect(90, 400, 200, 20).stroke();
  doc.text(`INVOICE ITEM NAME`, 95, 408, {
    width: 300,
    align: "left",
  });
  doc.rect(90, 400, 280, 20).stroke();
  doc.text(`QUANTITY`, 175, 408, {
    width: 300,
    align: "center",
  });

  doc.rect(370, 400, 80, 20).stroke();
  doc.text(`PRICE (QAR)`, 357, 408, {
    width: 100,
    align: "center",
  });

  doc.rect(450, 400, 90, 20).stroke();
  doc.text(`TOTAL PRICE (QAR)`, 420, 408, {
    width: 150,
    align: "center",
  });

  let productNo = 1;
  invoice_items.forEach((element) => {
    let y = 400 + productNo * 20;
    let ydown = 400 + productNo * 22.5;
    doc.rect(90, y, 200, 20).stroke();
    doc.text(`${element.item_name}`, 95, ydown, {
      width: 300,
      align: "left",
    });
    doc.rect(370, y, 0, 20).stroke();
    doc.text(`${formatePrice(element.quantity)}`, 210, ydown, {
      width: 120,
      align: "right",
    });
    doc.rect(450, y, 0, 20).stroke();
    doc.text(`${formatePrice(element.item_price)}`, 310, ydown, {
      width: 120,
      align: "right",
    });
    doc.rect(540, y, 0, 20).stroke();
    doc.text(`${formatePrice(element.item_total_price)}`, 406, ydown, {
      width: 120,
      align: "right",
    });
    productNo++;
  });

  doc.rect(90, 400 + productNo * 20, 450, 25).stroke();
  doc.text(`TOTAL AMOUNT`, 90, 410 + productNo * 20, {
    width: 300,
    align: "right",
  });
  doc.rect(405, 400 + productNo * 20, 0, 25).stroke();
  doc.text(
    `${formatePrice(
      InvoiceTrxDet[0].amount == paidamount
        ? paidamount
        : InvoiceTrxDet[0].amount
    )}`,
    405,
    410 + productNo * 20,
    {
      width: 120,
      align: "right",
    }
  );
  //Fit the image within the dimensions
  doc.rect(315, 300, 225, 40).stroke();
  doc.rect(315, 300, 225, 80).stroke();

  ////############ receipt1 ###########################3
  doc.text(`PAID RECEOPT - 1  (${InvoiceTrxDet[0]?.rct_number})`, 90, 528, {
    width: 300,
    align: "left",
  });
  doc
    .text("Payment Method :  ", 265, 528, { align: "left" })
    .text(`${InvoiceTrxDet[0].paymentMethod}`, 340, 528, { align: "left" })
    .text("Date Received : ", 400, 528, { align: "left" })
    .text(
      ` ${moment(InvoiceTrxDet[0].transaction_date, "YYYY MM DD").format(
        "MMM DD, YYYY"
      )}`,
      462,
      528,
      { align: "left" }
    );

  doc.rect(90, 540, 450, 20).stroke();
  doc.text(
    ` DOCUMENTS PAID RECEIPT - ${InvoiceTrxDet[0]?.rct_number}`,
    90,
    548,
    {
      width: 300,
      align: "center",
    }
  );
  doc.rect(405, 540, 0, 20).stroke();
  doc.text(` Amount (QAR)`, 422, 548, {
    width: 150,
    align: "center",
  });

  doc.rect(90, 560, 450, 20).stroke();
  doc.text(`Received Amount:`, 90, 565, {
    width: 310,
    align: "right",
  });
  doc.rect(405, 560, 0, 20).stroke();
  doc.text(`${formatePrice(InvoiceTrxDet[0]?.paidAmount)}`, 405, 565, {
    width: 120,
    align: "right",
  });

  doc.rect(90, 580, 450, 20).stroke();
  doc.text(`Received From Cash:`, 90, 585, {
    width: 310,
    align: "right",
  });
  doc.rect(405, 580, 0, 20).stroke();
  doc.text(`${formatePrice(InvoiceTrxDet[0]?.paidAmount)}`, 405, 585, {
    width: 120,
    align: "right",
  });
  doc.rect(90, 600, 450, 20).stroke();
  doc.text(`Received From Wallet:`, 90, 605, {
    width: 310,
    align: "right",
  });
  doc.rect(405, 600, 0, 20).stroke();
  doc.text(
    `${formatePrice(
      InvoiceTrxDet[0]?.creditAmount === null
        ? 0
        : InvoiceTrxDet[0]?.creditAmount
    )}`,
    405,
    605,
    {
      width: 120,
      align: "right",
    }
  );
  doc.rect(90, 620, 450, 20).stroke();
  doc.text(`TOTAL RECEIVED:`, 90, 625, {
    width: 310,
    align: "right",
  });
  doc.rect(405, 620, 0, 20).stroke();
  doc.text(
    `${formatePrice(
      InvoiceTrxDet[0].paidAmount + InvoiceTrxDet[0].creditAmount
    )}`,
    405,
    625,
    {
      width: 120,
      align: "right",
    }
  );

  //// #################### receipt 2 #####################
  doc.text(`PAID RECEOPT - 2  (${InvoiceTrxDet[1]?.rct_number})`, 90, 655, {
    width: 300,
    align: "left",
  });
  doc
    .text("Payment Method :  ", 265, 655, { align: "left" })
    .text(`${InvoiceTrxDet[1]?.paymentMethod}`, 340, 655, { align: "left" })
    .text("Date Received : ", 400, 655, { align: "left" })
    .text(
      ` ${moment(InvoiceTrxDet[1]?.transaction_date, "YYYY MM DD").format(
        "MMM DD, YYYY"
      )}`,
      462,
      655,
      { align: "left" }
    );

  doc.rect(90, 665, 450, 20).stroke();
  doc.text(
    ` DOCUMENTS PAID RECEIPT - ${InvoiceTrxDet[1]?.rct_number}`,
    90,
    670,
    {
      width: 300,
      align: "center",
    }
  );
  doc.rect(405, 665, 0, 20).stroke();
  doc.text(` Amount (QAR)`, 422, 670, {
    width: 150,
    align: "center",
  });

  doc.rect(90, 685, 450, 20).stroke();
  doc.text(`Received Amount:`, 90, 690, {
    width: 310,
    align: "right",
  });
  doc.rect(405, 685, 0, 20).stroke();
  doc.text(`${formatePrice(InvoiceTrxDet[1]?.paidAmount)}`, 405, 690, {
    width: 120,
    align: "right",
  });

  doc.rect(90, 705, 450, 20).stroke();
  doc.text(`Received From Cash:`, 90, 710, {
    width: 310,
    align: "right",
  });
  doc.rect(405, 705, 0, 20).stroke();
  doc.text(`${formatePrice(InvoiceTrxDet[1]?.paidAmount)}`, 405, 710, {
    width: 120,
    align: "right",
  });

  doc.rect(90, 725, 450, 20).stroke();
  doc.text(`Received From Wallet:`, 90, 730, {
    width: 310,
    align: "right",
  });
  doc.rect(405, 725, 0, 20).stroke();
  doc.text(
    `${formatePrice(
      InvoiceTrxDet[1]?.creditAmount === null
        ? 0
        : InvoiceTrxDet[1]?.creditAmount
    )}`,
    405,
    730,
    {
      width: 120,
      align: "right",
    }
  );

  doc.rect(90, 745, 450, 20).stroke();
  doc.text(`TOTAL RECEIVED:`, 90, 750, {
    width: 310,
    align: "right",
  });
  doc.rect(405, 745, 0, 20).stroke();
  doc.text(
    `${formatePrice(
      InvoiceTrxDet[1].paidAmount + InvoiceTrxDet[1]?.creditAmount
    )}`,
    405,
    750,
    {
      width: 120,
      align: "right",
    }
  );

  // start new page
  //// #################### receipt 3 #####################
  if (InvoiceTrxDet.length > 2) {
    doc.addPage();
    doc.fontSize(9);
    doc.text(`PAID RECEOPT - 3  (${InvoiceTrxDet[2]?.rct_number})`, 90, 40, {
      width: 250,
      align: "left",
    });
    doc
      .text("Payment Method :  ", 270, 40, { align: "left" })
      .text(`${InvoiceTrxDet[2].paymentMethod}`, 350, 40, { align: "left" })
      .text("Date Received : ", 390, 40, { align: "left" })
      .text(
        ` ${moment(InvoiceTrxDet[2].transaction_date, "YYYY MM DD").format(
          "MMM DD, YYYY"
        )}`,
        450,
        40,
        { align: "right" }
      );

    doc.rect(90, 55, 450, 20).stroke();
    doc.text(
      ` DOCUMENTS PAID RECEIPT - ${InvoiceTrxDet[2]?.rct_number}`,
      90,
      60,
      {
        width: 300,
        align: "center",
      }
    );
    doc.rect(405, 55, 0, 20).stroke();
    doc.text(` Amount (QAR)`, 422, 60, {
      width: 150,
      align: "center",
    });

    doc.rect(90, 75, 450, 20).stroke();
    doc.text(`Received Amount:`, 90, 80, {
      width: 310,
      align: "right",
    });
    doc.rect(405, 75, 0, 20).stroke();
    doc.text(`${formatePrice(InvoiceTrxDet[2]?.paidAmount)}`, 405, 80, {
      width: 120,
      align: "right",
    });

    doc.rect(90, 95, 450, 20).stroke();
    doc.text(`Received From Cash:`, 90, 100, {
      width: 310,
      align: "right",
    });
    doc.rect(405, 95, 0, 20).stroke();
    doc.text(`${formatePrice(InvoiceTrxDet[2]?.paidAmount)}`, 405, 100, {
      width: 120,
      align: "right",
    });
    doc.rect(90, 115, 450, 20).stroke();
    doc.text(`Received From Wallet:`, 90, 120, {
      width: 310,
      align: "right",
    });
    doc.rect(405, 115, 0, 20).stroke();
    doc.text(
      `${formatePrice(
        InvoiceTrxDet[2]?.creditAmount === null
          ? 0
          : InvoiceTrxDet[2]?.creditAmount
      )}`,
      405,
      120,
      {
        width: 120,
        align: "right",
      }
    );
    doc.rect(90, 135, 450, 20).stroke();
    doc.text(`TOTAL RECEIVED:`, 90, 140, {
      width: 310,
      align: "right",
    });
    doc.rect(405, 135, 0, 20).stroke();
    doc.text(
      `${formatePrice(
        InvoiceTrxDet[2]?.paidAmount + InvoiceTrxDet[2]?.creditAmount
      )}`,
      405,
      140,
      {
        width: 120,
        align: "right",
      }
    );
    //calculate total
    if (InvoiceTrxDet.length == 3) {
      doc.rect(90, 220, 450, 150).stroke();
      doc.text(`TOTAL AMOUNT RECEIVED :`, 90, 230, {
        width: 310,
        align: "right",
      });
      doc.rect(405, 220, 0, 150).stroke();
      doc.text(`${formatePrice(paidamount)}`, 405, 230, {
        width: 120,
        align: "right",
      });
      doc.text(
        `  Note : These fees are for tuition only and do not include transport,
      meals, books, or uniform.`,
        90,
        348,
        {
          width: 350,
          align: "left",
        }
      );
    }
  }
  //// #################### receipt 4 #####################
  if (InvoiceTrxDet.length > 3) {
    doc.fontSize(9);
    doc.text(`PAID RECEOPT - 4  (${InvoiceTrxDet[3]?.rct_number})`, 90, 180, {
      width: 250,
      align: "left",
    });
    doc
      .text("Payment Method :  ", 270, 180, { align: "left" })
      .text(`${InvoiceTrxDet[3].paymentMethod}`, 350, 180, { align: "left" })
      .text("Date Received : ", 390, 180, { align: "left" })
      .text(
        ` ${moment(InvoiceTrxDet[3].transaction_date, "YYYY MM DD").format(
          "MMM DD, YYYY"
        )}`,
        450,
        180,
        { align: "right" }
      );

    doc.rect(90, 195, 450, 20).stroke();
    doc.text(
      ` DOCUMENTS PAID RECEIPT - ${InvoiceTrxDet[3]?.rct_number}`,
      90,
      200,
      {
        width: 300,
        align: "center",
      }
    );
    doc.rect(405, 195, 0, 20).stroke();
    doc.text(` Amount (QAR)`, 422, 200, {
      width: 150,
      align: "center",
    });

    doc.rect(90, 215, 450, 20).stroke();
    doc.text(`Received Amount:`, 90, 220, {
      width: 310,
      align: "right",
    });
    doc.rect(405, 215, 0, 20).stroke();
    doc.text(`${formatePrice(InvoiceTrxDet[3]?.paidAmount)}`, 405, 220, {
      width: 120,
      align: "right",
    });

    doc.rect(90, 235, 450, 20).stroke();
    doc.text(`Received From Cash:`, 90, 240, {
      width: 310,
      align: "right",
    });
    doc.rect(405, 235, 0, 20).stroke();
    doc.text(`${formatePrice(InvoiceTrxDet[3]?.paidAmount)}`, 405, 240, {
      width: 120,
      align: "right",
    });
    doc.rect(90, 255, 450, 20).stroke();
    doc.text(`Received From Wallet:`, 90, 260, {
      width: 310,
      align: "right",
    });
    doc.rect(405, 255, 0, 20).stroke();
    doc.text(
      `${formatePrice(
        InvoiceTrxDet[3]?.creditAmount === null
          ? 0
          : InvoiceTrxDet[3]?.creditAmount
      )}`,
      405,
      260,
      {
        width: 120,
        align: "right",
      }
    );
    doc.rect(90, 275, 450, 20).stroke();
    doc.text(`TOTAL RECEIVED:`, 90, 280, {
      width: 310,
      align: "right",
    });
    doc.rect(405, 275, 0, 20).stroke();
    doc.text(
      `${formatePrice(
        InvoiceTrxDet[3]?.paidAmount + InvoiceTrxDet[3]?.creditAmount
      )}`,
      405,
      280,
      {
        width: 120,
        align: "right",
      }
    );
    //calculate total amount
    if (InvoiceTrxDet.length == 4) {
      doc.rect(90, 330, 450, 150).stroke();
      doc.rect(405, 330, 0, 150).stroke();
      doc.text(`TOTAL AMOUNT RECEIVED :`, 90, 340, {
        width: 310,
        align: "right",
      });

      doc.text(`${formatePrice(paidamount)}`, 405, 340, {
        width: 120,
        align: "right",
      });
      doc.text(
        `  Note : These fees are for tuition only and do not include transport,
      meals, books, or uniform.`,
        90,
        455,
        {
          width: 352,
          align: "left",
        }
      );
    }
  }
  //// #################### receipt 5 #####################
  if (InvoiceTrxDet.length > 4) {
    doc.fontSize(9);
    doc.text(`PAID RECEOPT - 5  (${InvoiceTrxDet[4]?.rct_number})`, 90, 320, {
      width: 250,
      align: "left",
    });
    doc
      .text("Payment Method :  ", 270, 320, { align: "left" })
      .text(`${InvoiceTrxDet[4].paymentMethod}`, 350, 40, { align: "left" })
      .text("Date Received : ", 390, 320, { align: "left" })
      .text(
        ` ${moment(InvoiceTrxDet[4].transaction_date, "YYYY MM DD").format(
          "MMM DD, YYYY"
        )}`,
        450,
        320,
        { align: "right" }
      );
    doc.rect(90, 330, 450, 20).stroke();
    doc.text(
      ` DOCUMENTS PAID RECEIPT - ${InvoiceTrxDet[4]?.rct_number}`,
      90,
      335,
      {
        width: 300,
        align: "center",
      }
    );
    doc.rect(405, 330, 0, 20).stroke();
    doc.text(` Amount (QAR)`, 422, 335, {
      width: 150,
      align: "center",
    });
    doc.rect(90, 350, 450, 20).stroke();
    doc.text(`Received Amount:`, 90, 355, {
      width: 310,
      align: "right",
    });
    doc.rect(405, 350, 0, 20).stroke();
    doc.text(`${formatePrice(InvoiceTrxDet[4]?.paidAmount)}`, 405, 355, {
      width: 120,
      align: "right",
    });
    doc.rect(90, 370, 450, 20).stroke();
    doc.text(`Received From Cash:`, 90, 375, {
      width: 310,
      align: "right",
    });
    doc.rect(405, 370, 0, 20).stroke();
    doc.text(`${formatePrice(InvoiceTrxDet[4]?.paidAmount)}`, 405, 375, {
      width: 120,
      align: "right",
    });
    doc.rect(90, 390, 450, 20).stroke();
    doc.text(`Received From Wallet:`, 90, 395, {
      width: 310,
      align: "right",
    });
    doc.rect(405, 390, 0, 20).stroke();
    doc.text(
      `${formatePrice(
        InvoiceTrxDet[3]?.creditAmount === null
          ? 0
          : InvoiceTrxDet[4]?.creditAmount
      )}`,
      405,
      395,
      {
        width: 120,
        align: "right",
      }
    );
    doc.rect(90, 410, 450, 20).stroke();
    doc.text(`TOTAL RECEIVED:`, 90, 415, {
      width: 310,
      align: "right",
    });
    doc.rect(405, 410, 0, 20).stroke();
    doc.text(
      `${formatePrice(
        InvoiceTrxDet[4]?.paidAmount + InvoiceTrxDet[4]?.creditAmount
      )}`,
      405,
      415,
      {
        width: 120,
        align: "right",
      }
    );
    //calculate total amount
    if (InvoiceTrxDet.length == 5) {
      doc.rect(90, 460, 450, 150).stroke();
      doc.text(`TOTAL AMOUNT RECEIVED :`, 90, 465, {
        width: 310,
        align: "right",
      });
      doc.rect(405, 460, 0, 150).stroke();
      doc.text(`${formatePrice(paidamount)}`, 405, 465, {
        width: 120,
        align: "right",
      });
      doc.text(
        `  Note : These fees are for tuition only and do not include transport,
          meals, books, or uniform.`,
        90,
        580,
        {
          width: 350,
          align: "left",
        }
      );
    }
  }
  // if (InvoiceTrxDet.length > 5) {
  //   doc.fontSize(9);
  //   doc.text(`PAID RECEOPT - 5  (${InvoiceTrxDet[4]?.rct_number})`, 90, 320, {
  //     width: 250,
  //     align: "left",
  //   });
  //   doc
  //     .text("Payment Method :  ", 270, 320, { align: "left" })
  //     .text(`${InvoiceTrxDet[4].paymentMethod}`, 350, 40, { align: "left" })
  //     .text("Date Received : ", 390, 320, { align: "left" })
  //     .text(
  //       ` ${moment(InvoiceTrxDet[4].transaction_date, "YYYY MM DD").format(
  //         "MMM DD, YYYY"
  //       )}`,
  //       450,
  //       320,
  //       { align: "right" }
  //     );
  //   doc.rect(90, 330, 450, 20).stroke();
  //   doc.text(
  //     ` DOCUMENTS PAID RECEIPT - ${InvoiceTrxDet[4]?.rct_number}`,
  //     90,
  //     335,
  //     {
  //       width: 300,
  //       align: "center",
  //     }
  //   );
  //   doc.rect(405, 330, 0, 20).stroke();
  //   doc.text(` Amount (QAR)`, 422, 335, {
  //     width: 150,
  //     align: "center",
  //   });
  //   doc.rect(90, 350, 450, 20).stroke();
  //   doc.text(`Received Amount:`, 90, 355, {
  //     width: 310,
  //     align: "right",
  //   });
  //   doc.rect(405, 350, 0, 20).stroke();
  //   doc.text(`${formatePrice(InvoiceTrxDet[4]?.paidAmount)}`, 405, 355, {
  //     width: 120,
  //     align: "right",
  //   });
  //   doc.rect(90, 370, 450, 20).stroke();
  //   doc.text(`Received From Cash:`, 90, 375, {
  //     width: 310,
  //     align: "right",
  //   });
  //   doc.rect(405, 370, 0, 20).stroke();
  //   doc.text(`${formatePrice(InvoiceTrxDet[4]?.paidAmount)}`, 405, 375, {
  //     width: 120,
  //     align: "right",
  //   });
  //   doc.rect(90, 390, 450, 20).stroke();
  //   doc.text(`Received From Wallet:`, 90, 395, {
  //     width: 310,
  //     align: "right",
  //   });
  //   doc.rect(405, 390, 0, 20).stroke();
  //   doc.text(
  //     `${formatePrice(
  //       InvoiceTrxDet[3]?.creditAmount === null
  //         ? 0
  //         : InvoiceTrxDet[4]?.creditAmount
  //     )}`,
  //     405,
  //     395,
  //     {
  //       width: 120,
  //       align: "right",
  //     }
  //   );
  //   doc.rect(90, 410, 450, 20).stroke();
  //   doc.text(`TOTAL RECEIVED:`, 90, 415, {
  //     width: 310,
  //     align: "right",
  //   });
  //   doc.rect(405, 410, 0, 20).stroke();
  //   doc.text(
  //     `${formatePrice(
  //       InvoiceTrxDet[4]?.paidAmount + InvoiceTrxDet[4]?.creditAmount
  //     )}`,
  //     405,
  //     415,
  //     {
  //       width: 120,
  //       align: "right",
  //     }
  //   );
  //   //calculate total amount
  //   if (InvoiceTrxDet.length == 6) {
  //     doc.rect(90, 460, 450, 150).stroke();
  //     doc.text(`TOTAL AMOUNT RECEIVED :`, 90, 465, {
  //       width: 310,
  //       align: "right",
  //     });
  //     doc.rect(405, 460, 0, 150).stroke();
  //     doc.text(`${formatePrice(paidamount)}`, 405, 465, {
  //       width: 120,
  //       align: "right",
  //     });
  //     doc.text(
  //       `  Note : These fees are for tuition only and do not include transport,
  //         meals, books, or uniform.`,
  //       90,
  //       580,
  //       {
  //         width: 350,
  //         align: "left",
  //       }
  //     );
  //   }
  // }

  doc.end();
  doc.pipe(
    fs.createWriteStream(
      `./receiptspdf/${"admin-"}${InvoiceTrxDet[0].rct_number}.pdf`
    )
  );
}
//generate  customer side receipt
function GenerateCustomerSideReceiptStatements(
  InvoiceTrxDet,
  invoice_items,
  parent_det
) {
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
    .text("Date Received : ", 90, 280, { align: "left" })
    .text(
      `${moment(InvoiceTrxDet[0].transaction_date, "YYYY MM DD").format(
        "MMM DD, YYYY"
      )}`,
      165,
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
  doc.text(
    ` Customer ID      :  ${
      InvoiceTrxDet[0]?.customerId == null
        ? InvoiceTrxDet[0].parentId
        : InvoiceTrxDet[0]?.customerId
    }`,
    92,
    340,
    {
      width: 410,
      align: "left",
    }
  );
  doc.moveDown();
  doc.text(
    ` Name        :  ${InvoiceTrxDet[0]?.name.toUpperCase()} `,
    92,
    355,
    {
      width: 410,
      align: "left",
    }
  );

  // draw bounding rectangle
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
  doc.rect(315, 300, 225, 40).stroke();
  doc.rect(315, 300, 225, 80).stroke();

  //Fit the image in the dimensions, and center it both horizontally and vertically
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
    `${formatePrice(
      InvoiceTrxDet[0].paidAmount + InvoiceTrxDet[0].creditAmount != null
        ? InvoiceTrxDet[0].creditAmount
        : 0
    )}`,
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
  GenerateAdminSideReceiptStatemets,
  GenerateCustomerSideReceiptStatements,
};

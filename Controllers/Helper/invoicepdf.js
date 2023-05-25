const fs = require("fs");
const moment = require("moment");
const PDFDocument = require("pdfkit");
let fontBold = "Helvetica-Bold";
const formatePrice = require("../../commonFunction/formatedamount");

//generate admin Side invoice pdf
function GenerateAdminSideInvoicePdf(Getinvoice, invoice_items, parent_det) {
  //console.log(Getinvoice,"Getinvoice",invoice_items,"invoice_items",parent_det,"parent_det")
  let doc = new PDFDocument({
    size: "A4",
    margin: 50,
    orientation: "portrait",
  });
  doc
    .image("./uploads/Qatar_International_School_logo.jpg", 60, 40, {
      width: 83,
      height: 83,
    })
    .fillColor("#444444");
  doc
    .fontSize(16)
    .font(fontBold)
    .text("Qatar International School", 150, 50, { align: "left" });
  doc
    .fontSize(10)
    .text("Qatar International School W.L.L", 151.5, 70, {
      align: "left",
    })
    .text("United Nations st, West Bay, P.O. Box: 5697", 151.5, 85, {
      align: "left",
    })
    .text("Doha, QATAR", 151.5, 100, { align: "left" })
    .moveDown();

  doc.fontSize(9).text("Tel : 44833456", 120, 135, { align: "left" });
  doc
    .fontSize(9)
    .fillColor("#668cff")
    .text("www.qis.org", 121, 147, {
      align: "left",
      link: "www.qis.org",
      underline: true,
    })
    .text("billing@qis.org", 121, 160, {
      align: "left",
      link: "billing@qis.org",
      underline: true,
    })
    .moveDown();
  doc.rect(215, 190, 170, 30).fillAndStroke("#2d6fb9").fill("#FFFFFF").stroke();
  doc.fontSize(20).text(`INVOICE `, 5, 197, {
    align: "center",
    width: 600,
  });
  doc
    .fontSize(10)
    .fillColor("#1a1a1a")
    .text(
      `Date  :  ${moment(
        Getinvoice[0]?.invoice_created_date,
        "DD/MM/YYYY"
      ).format("MMM DD, YYYY")}`,
      80,
      235,
      {
        align: "left",
      }
    );

  doc
    .fillColor("#365F91")
    .text(
      `Due Date  :  ${moment(
        Getinvoice[0]?.invoice_due_date,
        "DD/MM/YYYY"
      ).format("MMM DD, YYYY")}`,
      240,
      234,
      {
        align: "left",
      }
    );

  doc
    .fillColor("black")
    .text(
      `Invoice Id  :  ${
        Getinvoice[0]?.invoiceId || Getinvoice[0]?.tuition_invoice_id
      }`,
      80,
      249,
      { align: "left" }
    )
    .moveDown();
  doc
    .fontSize(9)
    .text(`Bill to :`, 80, 275, {
      align: "left",
    })
    .moveDown();
  // doc
  //   .fontSize(9)
  //   .text(
  //     `Id  :  ${Getinvoice[0]?.sageCustomerId || Getinvoice[0]?.sageParentId} `,
  //     80,
  //     285,
  //     {
  //       align: "left",
  //     }
  //   )
  // .moveDown();
  doc
    .fontSize(9)
    .text(
      `Account ID : ${
        Getinvoice[0]?.sageCustomerId || Getinvoice[0]?.sageParentId
      }`,
      80,
      301,
      { align: "left" }
    );
  if (parent_det !== null) {
    doc.text(`Family ID  : ${parent_det[0]?.parent_id}`, 80, 313, {
      align: "left",
    });
  }
  doc
    .text(
      `Name  :  ${
        parent_det !== null
          ? parent_det[0]?.parent_name.toUpperCase()
          : Getinvoice[0]?.name.toUpperCase()
      }`,
      80,
      326,
      {
        align: "left",
      }
    )
    .moveDown();
  // doc
  //   .rect(65, 400, 100, 17)
  //   .fillAndStroke("#bfd0e3", "black")
  //   .fill("#03356c")
  //   .stroke();
  // doc.fontSize(8).text(`ITEM NAME`, 69, 405, {
  //   width: 200,
  //   align: "left",
  // });
  // doc.rect(165, 400, 100, 17).fillAndStroke("#bfd0e3", "black").fill("#03356c");
  // doc.text(`DESCRIPTION`, 167, 405, {
  //   width: 200,
  //   align: "left",
  // });
  doc.rect(65, 400, 200, 17).fillAndStroke("#bfd0e3", "black").fill("#03356c");
  doc.text(`DESCRIPTION`, 69, 405, {
    width: 200,
    align: "left",
  });

  doc.rect(265, 400, 80, 17).fillAndStroke("#bfd0e3", "black").fill("#03356c");
  doc.text(`QTY`, 263, 405, {
    width: 80,
    align: "center",
  });
  doc.rect(345, 400, 100, 17).fillAndStroke("#bfd0e3", "black").fill("#03356c");
  doc.text(`UNIT PRICE (QAR) `, 340, 405, {
    width: 100,
    align: "center",
  });
  doc.rect(445, 400, 100, 17).fillAndStroke("#bfd0e3", "black").fill("#03356c");
  doc.text(`LINE TOTAL (QAR) `, 440, 405, {
    width: 100,
    align: "center",
  });
  let productNo = 1;
  invoice_items.forEach((element) => {
    let y = 400 + productNo * 17;
    let ydown = 400 + productNo * 19;
    doc.rect(65, y, 200, 17).fillAndStroke("white", "#1a1a1a").fill("#1a1a1a");
    // doc.text(`${element?.item_name}`, 69, ydown, {
    //   width: 200,
    //   align: "left",
    // });
    // doc.rect(165, y, 100, 17).stroke();
    // doc.text(`${element?.item_description}`, 167, ydown, {
    //   width: 200,
    //   align: "left",
    // });

    doc.text(`${element?.item_description}`, 69, ydown, {
      width: 200,
      align: "left",
    });

    doc.rect(265, y, 80, 17).stroke();
    doc.text(`${element?.quantity}`, 263, ydown, {
      width: 80,
      align: "center",
    });
    doc.rect(345, y, 100, 17).stroke();
    doc.text(`${formatePrice(element?.item_price)}`, 345, ydown, {
      width: 100,
      align: "center",
    });
    doc.rect(445, y, 100, 17).stroke();
    doc.text(`${formatePrice(element.item_total_price)}`, 445, ydown, {
      width: 100,
      align: "center",
    });
    productNo++;
  });

  doc.rect(345, 400 + productNo * 17, 100, 25).stroke();
  doc.text(`Total Amount`, 318, 400 + productNo * 20, {
    width: 100,
    align: "right",
  });
  //doc.rect(445, 400 + productNo * 17, 100, 22).stroke();
  doc.rect(445, 400 + productNo * 17, 100, 25).stroke();
  doc.text(
    `${formatePrice(Getinvoice[0]?.amount)}`,
    400,
    400 + productNo * 20,
    {
      width: 108,
      align: "right",
    }
  );

  // doc
  //   .image("./uploads/qisstamp.png", 100, 400 + productNo * 20, {
  //     width: 200,
  //     height: 60,
  //     align: "right",
  //   })
  //   .fillColor("#444444");

  doc
    .fontSize(8)
    .fillColor("#668cff")
    .text(
      "Note : These fees are for tution only and do not include transport, meals, books or uniforms.",
      65,
      doc.page.height - 75,
      {
        lineBreak: false,
      }
    );
  doc.text(
    "Payment Method : Cash, Credit Card, or Bank Transfer to Commercial Bank of Qatar.",
    65,
    doc.page.height - 55,
    {
      lineBreak: false,
    }
  );

  doc.text(
    "Please Mention Invoice No. or Account in the trnasfer.",
    65,
    doc.page.height - 45,
    {
      lineBreak: false,
    }
  );

  doc.text(
    "Shwift Code : CBAQAQA.-IBAN QA51 CBQA 0000 0000 7090719971001.",
    65,
    doc.page.height - 35,
    {
      lineBreak: false,
    }
  );

  doc.text(
    "Bank Address : Salwa Road Branch. Doha QATAR",
    65,
    doc.page.height - 25,
    {
      lineBreak: false,
    }
  );
  doc.end();
  doc.pipe(
    fs.createWriteStream(
      `./invoicespdf/${"admin-"}${
        Getinvoice[0]?.invoiceId || Getinvoice[0]?.tuition_invoice_id
      }.pdf`
    )
  );
}

//create admin Side invoice pdf
function GenerateUserSideInvoicePdf(
  Getinvoice,
  invoice_items,
  parent_det,
  identifier
) {
  //console.log(Getinvoice,"Getinvoice",invoice_items,"invoice_items",parent_det,"parent_det", identifier)

  let doc = new PDFDocument({
    size: "A4",
    margin: 50,
    orientation: "portrait",
  });
  doc
    .image("./uploads/Qatar_International_School_logo.jpg", 60, 40, {
      width: 83,
      height: 83,
    })
    .fillColor("#444444");
  doc
    .fontSize(16)
    .font(fontBold)
    .text("Qatar International School", 150, 50, { align: "left" });
  doc
    .fontSize(10)
    .text("Qatar International School W.L.L", 151.5, 70, {
      align: "left",
    })
    .text("United Nations st, West Bay, P.O. Box: 5697", 151.5, 85, {
      align: "left",
    })
    .text("Doha, QATAR", 151.5, 100, { align: "left" })
    .moveDown();

  doc.fontSize(9).text("Tel : 44833456", 120, 135, { align: "left" });
  doc
    .fontSize(9)
    .fillColor("#668cff")
    .text("www.qis.org", 121, 147, {
      align: "left",
      link: "www.qis.org",
      underline: true,
    })
    .text("billing@qis.org", 121, 160, {
      align: "left",
      link: "billing@qis.org",
      underline: true,
    })
    .moveDown();
  doc.rect(215, 190, 170, 30).fillAndStroke("#2d6fb9").fill("#FFFFFF").stroke();
  doc.fontSize(20).text(`INVOICE `, 5, 197, {
    align: "center",
    width: 600,
  });

  doc
    .fontSize(10)
    .fillColor("#1a1a1a")
    .text(
      `Date  :  ${moment(
        Getinvoice[0]?.invoice_created_date,
        "DD/MM/YYYY"
      ).format("MMM DD, YYYY")}`,
      80,
      235,
      {
        align: "left",
      }
    );

  doc
    .fillColor("#365F91")
    .text(
      `Due Date  :  ${moment(
        Getinvoice[0]?.invoice_due_date,
        "DD/MM/YYYY"
      ).format("MMM DD, YYYY")}`,
      240,
      234,
      {
        align: "left",
      }
    );

  doc
    .fillColor("black")
    .text(
      `Invoice Id  :  ${
        Getinvoice[0]?.invoiceId || Getinvoice[0]?.tuition_invoice_id
      }`,
      80,
      249,
      { align: "left" }
    )
    .moveDown();
  doc
    .fontSize(9)
    .text(`Bill to :`, 80, 275, {
      align: "left",
    })
    .moveDown();
  // doc
  //   .fontSize(9)
  //   .text(
  //     `Id  :  ${Getinvoice[0]?.sageCustomerId || Getinvoice[0]?.sageParentId} `,
  //     80,
  //     285,
  //     {
  //       align: "left",
  //     }
  //   )
  // .moveDown();
  doc
    .fontSize(9)
    .text(
      `Account ID : ${
        Getinvoice[0]?.sageCustomerId || Getinvoice[0]?.sageParentId
      }`,
      80,
      301,
      { align: "left" }
    );
  if (parent_det !== null) {
    doc.text(`Family ID  : ${parent_det[0]?.parent_id}`, 80, 313, {
      align: "left",
    });
  }
  doc
    .text(
      `Name  :  ${
        parent_det !== null
          ? parent_det[0]?.parent_name.toUpperCase()
          : Getinvoice[0]?.name.toUpperCase()
      }`,
      80,
      326,
      {
        align: "left",
      }
    )
    .moveDown();

  // doc
  //   .rect(65, 400, 100, 17)
  //   .fillAndStroke("#bfd0e3", "black")
  //   .fill("#03356c")
  //   .stroke();
  // doc.fontSize(8).text(`ITEM NAME`, 69, 405, {
  //   width: 200,
  //   align: "left",
  // });

  // doc.rect(165, 400, 100, 17).fillAndStroke("#bfd0e3", "black").fill("#03356c");
  // doc.text(`DESCRIPTION`, 167, 405, {
  //   width: 200,
  //   align: "left",
  // });

  doc.rect(65, 400, 200, 17).fillAndStroke("#bfd0e3", "black").fill("#03356c");
  doc.text(`DESCRIPTION`, 69, 405, {
    width: 200,
    align: "left",
  });

  doc.rect(265, 400, 80, 17).fillAndStroke("#bfd0e3", "black").fill("#03356c");
  doc.text(`QTY`, 263, 405, {
    width: 80,
    align: "center",
  });
  doc.rect(345, 400, 100, 17).fillAndStroke("#bfd0e3", "black").fill("#03356c");
  doc.text(`UNIT PRICE (QAR) `, 340, 405, {
    width: 100,
    align: "center",
  });
  doc.rect(445, 400, 100, 17).fillAndStroke("#bfd0e3", "black").fill("#03356c");
  doc.text(`LINE TOTAL (QAR) `, 440, 405, {
    width: 100,
    align: "center",
  });
  let productNo = 1;
  invoice_items.forEach((element) => {
    let y = 400 + productNo * 17;
    let ydown = 400 + productNo * 19;
    doc.rect(65, y, 200, 17).fillAndStroke("white", "#1a1a1a").fill("#1a1a1a");
    // doc.text(`${element?.item_name}`, 69, ydown, {
    //   width: 200,
    //   align: "left",
    // });
    // doc.rect(165, y, 100, 17).stroke();
    // doc.text(`${element?.item_description}`, 167, ydown, {
    //   width: 200,
    //   align: "left",
    // });

    doc.text(
      `${element?.item_description?.replace(/<(.|\n)*?>/g, "")}`,
      69,
      ydown,
      {
        width: 200,
        align: "left",
      }
    );

    doc.rect(265, y, 80, 17).stroke();
    doc.text(`${element?.quantity}`, 263, ydown, {
      width: 80,
      align: "center",
    });
    doc.rect(345, y, 100, 17).stroke();
    doc.text(`${formatePrice(element?.item_price)}`, 345, ydown, {
      width: 100,
      align: "center",
    });
    doc.rect(445, y, 100, 17).stroke();
    doc.text(`${formatePrice(element.item_total_price)}`, 445, ydown, {
      width: 100,
      align: "center",
    });
    productNo++;
  });

  doc.rect(345, 400 + productNo * 17, 100, 25).stroke();
  doc.text(`Total Amount`, 318, 400 + productNo * 20, {
    width: 100,
    align: "right",
  });
  //doc.rect(445, 400 + productNo * 17, 100, 22).stroke();
  doc.rect(445, 400 + productNo * 17, 100, 25).stroke();
  doc.text(
    `${formatePrice(Getinvoice[0]?.amount)}`,
    400,
    400 + productNo * 20,
    {
      width: 108,
      align: "right",
    }
  );
  doc
    .image("./uploads/qisstamp.png", 100, 400 + productNo * 20, {
      width: 200,
      height: 60,
      align: "right",
    })
    .fillColor("#444444");
  doc
    .fontSize(8)
    .fillColor("#668cff")
    .text(
      "Note : These fees are for tution only and do not include transport, meals, books or uniforms.",
      65,
      doc.page.height - 75,
      {
        lineBreak: false,
      }
    );
  doc.text(
    "Payment Method : Cash, Credit Card, or Bank Transfer to Commercial Bank of Qatar.",
    65,
    doc.page.height - 55,
    {
      lineBreak: false,
    }
  );
  doc.text(
    "Please Mention Invoice No. or Account in the trnasfer.",
    65,
    doc.page.height - 45,
    {
      lineBreak: false,
    }
  );
  doc.text(
    "Shwift Code : CBAQAQA.-IBAN QA51 CBQA 0000 0000 7090719971001.",
    65,
    doc.page.height - 35,
    {
      lineBreak: false,
    }
  );
  doc.text(
    "Bank Address : Salwa Road Branch. Doha QATAR",
    65,
    doc.page.height - 25,
    {
      lineBreak: false,
    }
  );
  doc.end();

  if (identifier === "send_pdf_email") {
    doc.pipe(fs.createWriteStream("./invoicepdf.pdf"));
  } else if (identifier === "") {
    doc.pipe(
      fs.createWriteStream(
        `./invoicespdf/${"customer-"}${
          Getinvoice[0]?.invoiceId || Getinvoice[0]?.tuition_invoice_id
        }.pdf`
      )
    );
  } else {
    doc.pipe(fs.createWriteStream("./invoicepdf.pdf"));
    doc.pipe(
      fs.createWriteStream(
        `./invoicespdf/${"customer-"}${
          Getinvoice[0]?.invoiceId || Getinvoice[0]?.tuition_invoice_id
        }.pdf`
      )
    );
  }
}

module.exports = {
  GenerateAdminSideInvoicePdf,
  GenerateUserSideInvoicePdf,
};

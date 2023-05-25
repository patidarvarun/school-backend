const util = require("util");
const moment = require("moment");
const mysqlconnection = require("../DB/db.config.connection");
const query = util.promisify(mysqlconnection.query).bind(mysqlconnection);
const MonthlyReportEmailFormat = require("./Helper/templates/monthlyReportsTemplate");
const SalesInvoiceReportsTemplate = require("./Helper/templates/simpleReceptEmailFormat");
const sendPDFEmails = require("./Helper/sendPDFEmails");
const { createPDF } = require("./Helper/pdftemplate");
const {
  GenerateAdminSideReceipt,
  GenerateCustomerSideReceipt,
} = require("./Helper/reportTemplate");
const {
  purchaseInvoiceItemasDetails,
  CusromersParentDetails,
  getInvoiceTransactionDetails,
  GetEmailTemplates,
  getInvoiceTransactionDetailsByInvId,
} = require("../commonFunction/commonControllerFunction");
const fs = require("fs");
const { migrateEmailToHubSpot } = require("../hubSpotContacts/hubSpotContacts");
const { ReplaceEmailTemplate } = require("../commonFunction/connonfunctions");
const {
  GenerateAdminSideReceiptStatemets,
  GenerateCustomerSideReceiptStatements,
} = require("./Helper/multireportstemplates");

module.exports = {
  createMonthlyReports: async (req, res) => {
    // var date = new Date();
    // var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    // var lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    //fn for get start date format
    // function getstartdate(start_date) {
    //   var currDate = new Date(start_date);
    //   return moment(currDate.setDate(currDate.getDate() - 1 + 1)).format(
    //     "YYYY-MM-DD"
    //   );
    // }
    //fn for get end date format
    // function getenddate(end_date) {
    //   var currDate = new Date(end_date);
    //   return moment(currDate.setDate(currDate.getDate() - 1 + 1)).format(
    //     "YYYY-MM-DD"
    //   );
    // }
    var now = new Date();
    var prevMonthLastDate = new Date(now.getFullYear(), now.getMonth(), 0);
    var prevMonthFirstDate = new Date(
      now.getFullYear() - (now.getMonth() > 0 ? 0 : 1),
      (now.getMonth() - 1 + 12) % 12,
      1
    );
    const firstDay = moment(
      prevMonthFirstDate.setDate(prevMonthFirstDate.getDate() - 1 + 1)
    ).format("YYYY-MM-DD");
    const lastDay = moment(
      prevMonthLastDate.setDate(prevMonthLastDate.getDate() - 1 + 1)
    ).format("YYYY-MM-DD");

    var months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    var date = new Date();
    const curr_month_year = months[date.getMonth()] + " " + date.getFullYear();
    const reports_query = `select transaction.id, transaction.sales_order_Id, transaction.invoiceId, 
    transaction.paymentMethod, transaction.transactionId, transaction.amex_order_Id, transaction.refrenceId,
    transaction.paidAmount, transaction.createdAt as 'transactionDate', users.id as customerId from transaction 
    left outer join invoices on invoices.id = transaction.invoiceId
    left outer join users on users.id = invoices.customerId
    where transaction.createdAt between '${firstDay}' and '${lastDay}'`;
    const GetReports = await query(reports_query);
    await createPDF(GetReports, curr_month_year);
    const dt = await MonthlyReportEmailFormat();
    sendPDFEmails(
      process.env.SMTP_TO_EMAIL,
      "Monthly Sales Order Reports From QIS ✔",
      dt,
      (title = "monthlyReport")
    );
  },

  //send invoices receipt aftyer pay
  DownloadReceiptController: async (req, res) => {
    const { transactionId, invoiceId } = req.body;
    //get tranasction details
    const InvoiceTrxDet = await getInvoiceTransactionDetailsByInvId(invoiceId);
    //items details
    const invoice_items = await purchaseInvoiceItemasDetails(
      InvoiceTrxDet[0].id
    );
    //get parents details
    let parent_det = null;
    if (InvoiceTrxDet[0].user_id && InvoiceTrxDet[0].cusromerparentid > 0) {
      parent_det = await CusromersParentDetails(
        InvoiceTrxDet[0].cusromerparentid
      );
    }
    if (InvoiceTrxDet.length > 1) {
      const InvoiceTrxDets = InvoiceTrxDet.reverse();
      if (InvoiceTrxDets[0].status == "Partially paid") {
        await GenerateAdminSideReceipt(
          InvoiceTrxDets,
          invoice_items,
          parent_det
        );
        await GenerateCustomerSideReceipt(
          InvoiceTrxDets,
          invoice_items,
          parent_det
        );
      } else {
        await GenerateAdminSideReceiptStatemets(
          InvoiceTrxDets,
          invoice_items,
          parent_det
        );
        await GenerateCustomerSideReceiptStatements(
          InvoiceTrxDets,
          invoice_items,
          parent_det
        );
      }
    } else {
      await GenerateAdminSideReceipt(InvoiceTrxDet, invoice_items, parent_det);
      await GenerateCustomerSideReceipt(
        InvoiceTrxDet,
        invoice_items,
        parent_det
      );
    }
    //sending emails
    const InvoiceTemp = await GetEmailTemplates(
      (emailtype = "Payment_Receipt")
    );
    var translations = {
      customername:
        parent_det == null
          ? InvoiceTrxDet[0]?.name.toUpperCase()
          : parent_det[0]?.parent_name.toUpperCase(),
      loginurl: process.env.REACTURL,
    };
    const translatedHtml = await ReplaceEmailTemplate(
      translations,
      InvoiceTemp[0].emailbodytext
    );
    sendPDFEmails(
      InvoiceTrxDet[0].email,
      InvoiceTemp[0].enailsubject,
      translatedHtml,
      (title = "invoice")
    );

    // const dt = await SalesInvoiceReportsTemplate(
    //   InvoiceTrxDet,
    //   invoice_items,
    //   parent_det
    // );
    // sendPDFEmails(
    //   InvoiceTrxDet[0].email,
    //   "Payment Receipt From QIS ✔",
    //   dt,
    //   (title = "invoice")
    // );
    // sendPDFEmails(process.env.SMTP_TO_EMAIL, "Payment Receipt From QIS ✔", dt);
    res.status(200).json({ message: "ok" });
    //add activity logs in hubspot
    const emaildata = {
      userid: InvoiceTrxDet[0].cusromerparentid,
      email: InvoiceTrxDet[0].email,
      subject: "Payment Receipt From QIS ✔",
      bodyofemail: translatedHtml,
    };
    await migrateEmailToHubSpot(emaildata);
  },

  SageDownloadReceiptController: async (data) => {
    const InvoiceTrxDet = await getInvoiceTransactionDetails(data);
    //items details
    const invoice_items = await purchaseInvoiceItemasDetails(
      InvoiceTrxDet[0].id
    );
    //get parents details
    let parent_det = null;
    if (InvoiceTrxDet[0].user_id && InvoiceTrxDet[0].cusromerparentid > 0) {
      parent_det = await CusromersParentDetails(
        InvoiceTrxDet[0].cusromerparentid
      );
    }
    await GenerateAdminSideReceipt(InvoiceTrxDet, invoice_items, parent_det);
    await GenerateCustomerSideReceipt(InvoiceTrxDet, invoice_items, parent_det);

    //sending emails
    const InvoiceTemp = await GetEmailTemplates(
      (emailtype = "Payment_Receipt")
    );
    var translations = {
      customername:
        parent_det == null
          ? InvoiceTrxDet[0]?.name.toUpperCase()
          : parent_det[0]?.parent_name.toUpperCase(),
      loginurl: process.env.REACTURL,
    };
    const translatedHtml = await ReplaceEmailTemplate(
      translations,
      InvoiceTemp[0].emailbodytext
    );
    sendPDFEmails(
      InvoiceTrxDet[0].email,
      InvoiceTemp[0].enailsubject,
      translatedHtml,
      (title = "invoice")
    );
    const emaildata = {
      userid: InvoiceTrxDet[0].cusromerparentid,
      email: InvoiceTrxDet[0].email,
      subject: "Payment Receipt From QIS ✔",
      bodyofemail: translatedHtml,
    };
    await migrateEmailToHubSpot(emaildata);
  },
  //download receipt using tranaction id
  DownloadReceiptUsingTRXIdAfterPay: async (req, res) => {
    const { RCTNumber, isSide, transactionId } = req.body;
    //get  tranaction  details
    const InvoiceTrxDet = await getInvoiceTransactionDetails(transactionId);
    // get items details
    const invoice_items = await purchaseInvoiceItemasDetails(
      InvoiceTrxDet[0].id
    );
    // get parents details
    let parent_det = null;
    if (InvoiceTrxDet[0].user_id && InvoiceTrxDet[0].cusromerparentid > 0) {
      parent_det = await CusromersParentDetails(
        InvoiceTrxDet[0].cusromerparentid
      );
    }
    if (isSide == "admin_side") {
      //admin side invoices
      var filePath = `receiptspdf/${"admin-"}${RCTNumber}.pdf`;
      fs.access(filePath, fs.constants.F_OK, async (err) => {
        if (err) {
          //create invoice pdf
          //if receipt not exists in the folder so, create
          await GenerateAdminSideReceipt(
            InvoiceTrxDet,
            invoice_items,
            parent_det
          );
          setTimeout(() => {
            const fileStream = fs.createReadStream(filePath);
            fileStream.pipe(res);
          }, 1000);
        } else {
          const fileStream = fs.createReadStream(filePath);
          fileStream.pipe(res);
        }
      });
    } else {
      //customer side invoices
      var filePath = `receiptspdf/${"customer-"}${RCTNumber}.pdf`;
      fs.access(filePath, fs.constants.F_OK, async (err) => {
        if (err) {
          //create invoice pdf
          //if receipt not exists in the folder so, create
          await GenerateCustomerSideReceipt(
            InvoiceTrxDet,
            invoice_items,
            parent_det
          );
          setTimeout(() => {
            const fileStream = fs.createReadStream(filePath);
            fileStream.pipe(res);
          }, 1000);
        } else {
          const fileStream = fs.createReadStream(filePath);
          fileStream.pipe(res);
        }
      });
    }
  },
  //download receipt after pay
  DownloadReceiptAfterPay: async (req, res) => {
    const { RCTNumber, isSide, invoiceId } = req.body;
    //get transsaction details
    const InvoiceTrxDet = await getInvoiceTransactionDetailsByInvId(invoiceId);
    //items details
    const invoice_items = await purchaseInvoiceItemasDetails(
      InvoiceTrxDet[0].id
    );
    //get parents details
    let parent_det = null;
    if (InvoiceTrxDet[0].user_id && InvoiceTrxDet[0].cusromerparentid > 0) {
      parent_det = await CusromersParentDetails(
        InvoiceTrxDet[0].cusromerparentid
      );
    }
    if (InvoiceTrxDet.length > 1) {
      const InvoiceTrxDets = InvoiceTrxDet.reverse();
      if (InvoiceTrxDets[0].status == "Partially paid") {
        if (isSide == "admin_side") {
          //admin side invoices
          var filePath = `receiptspdf/${"admin-"}${
            InvoiceTrxDets[0].rct_number
          }.pdf`;
          fs.access(filePath, fs.constants.F_OK, async (err) => {
            if (err) {
              console.log("File does not exist");
              //create invoice pdf
              //if receipt not exists in the folder so, create
              await GenerateAdminSideReceipt(
                InvoiceTrxDets,
                invoice_items,
                parent_det
              );
              setTimeout(() => {
                const fileStream = fs.createReadStream(filePath);
                fileStream.pipe(res);
              }, 1000);
            } else {
              const fileStream = fs.createReadStream(filePath);
              fileStream.pipe(res);
            }
          });
        } else {
          //customer side invoices
          var filePath = `receiptspdf/${"customer-"}${
            InvoiceTrxDets[0].rct_number
          }.pdf`;
          fs.access(filePath, fs.constants.F_OK, async (err) => {
            if (err) {
              console.log("File does not exist");
              //create invoice pdf
              //if receipt not exists in the folder so, create
              await GenerateCustomerSideReceipt(
                InvoiceTrxDets,
                invoice_items,
                parent_det
              );
              setTimeout(() => {
                const fileStream = fs.createReadStream(filePath);
                fileStream.pipe(res);
              }, 1000);
            } else {
              const fileStream = fs.createReadStream(filePath);
              fileStream.pipe(res);
            }
          });
        }
      } else {
        if (isSide == "admin_side") {
          //admin side invoices
          var filePath = `receiptspdf/${"admin-"}${
            InvoiceTrxDets[0].rct_number
          }.pdf`;
          fs.access(filePath, fs.constants.F_OK, async (err) => {
            if (err) {
              console.log("File does not exist");
              //create invoice pdf
              //if receipt not exists in the folder so, create
              await GenerateAdminSideReceiptStatemets(
                InvoiceTrxDets,
                invoice_items,
                parent_det
              );
              setTimeout(() => {
                const fileStream = fs.createReadStream(filePath);
                fileStream.pipe(res);
              }, 1000);
            } else {
              const fileStream = fs.createReadStream(filePath);
              fileStream.pipe(res);
            }
          });
        } else {
          //customer side invoices
          var filePath = `receiptspdf/${"customer-"}${
            InvoiceTrxDets[0].rct_number
          }.pdf`;
          fs.access(filePath, fs.constants.F_OK, async (err) => {
            if (err) {
              console.log("File does not exist");
              //create invoice pdf
              //if receipt not exists in the folder so, create
              await GenerateCustomerSideReceiptStatements(
                InvoiceTrxDets,
                invoice_items,
                parent_det
              );
              setTimeout(() => {
                const fileStream = fs.createReadStream(filePath);
                fileStream.pipe(res);
              }, 1000);
            } else {
              const fileStream = fs.createReadStream(filePath);
              fileStream.pipe(res);
            }
          });
        }
      }
    } else {
      if (isSide == "admin_side") {
        //admin side invoices
        var filePath = `receiptspdf/${"admin-"}${RCTNumber}.pdf`;
        fs.access(filePath, fs.constants.F_OK, async (err) => {
          if (err) {
            console.log("File does not exist");
            //create invoice pdf
            //if receipt not exists in the folder so, create
            await GenerateAdminSideReceipt(
              InvoiceTrxDet,
              invoice_items,
              parent_det
            );
            setTimeout(() => {
              const fileStream = fs.createReadStream(filePath);
              fileStream.pipe(res);
            }, 1000);
          } else {
            const fileStream = fs.createReadStream(filePath);
            fileStream.pipe(res);
          }
        });
      } else {
        //customer side invoices
        var filePath = `receiptspdf/${"customer-"}${RCTNumber}.pdf`;
        fs.access(filePath, fs.constants.F_OK, async (err) => {
          if (err) {
            console.log("File does not exist");
            //create invoice pdf
            //if receipt not exists in the folder so, create
            await GenerateCustomerSideReceipt(
              InvoiceTrxDet,
              invoice_items,
              parent_det
            );
            setTimeout(() => {
              const fileStream = fs.createReadStream(filePath);
              fileStream.pipe(res);
            }, 1000);
          } else {
            const fileStream = fs.createReadStream(filePath);
            fileStream.pipe(res);
          }
        });
      }
    }
  },
};

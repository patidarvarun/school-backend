const mysqlconnection = require("../../DB/db.config.connection");
const util = require("util");
const moment = require("moment");
const {
  createSalesInvoice,
  deleteSalesInvoice,
  updateSalesInvoice,
} = require("../../SageIntacctAPIs/SalesInvoiceService");
const {
  deleteSageIntacctSalesOrder,
} = require("../../SageIntacctAPIs/SalesOrderService");
const {
  createTuitionInvoice,
  updateTuitionInvoice,
  deleteTuitionInvoice,
} = require("../../SageIntacctAPIs/TuitionInvoiceService");
const InvoiceEmailFormat = require("../Helper/templates/InvoiceEmailTemp");
const {
  GenerateAdminSideInvoicePdf,
  GenerateUserSideInvoicePdf,
} = require("../Helper/invoicepdf");
const sendEmails = require("../Helper/sendEmails");
const query = util.promisify(mysqlconnection.query).bind(mysqlconnection);
const {
  purchaseInvoiceItemasDetails,
  CusromersParentDetails,
  GetInvoiceDetails,
  GetEmailTemplates,
} = require("../../commonFunction/commonControllerFunction");
const fs = require("fs");
const {
  migrateEmailToHubSpot,
} = require("../../hubSpotContacts/hubSpotContacts");

const {
  ReplaceEmailTemplate,
} = require("../../commonFunction/connonfunctions");

module.exports = {
  //create sales  invoice
  CreateInvoice: async (req, res) => {
    var customerId = req.body.customerId;
    var itemId = req.body.itemId;
    var status = req.body.status;
    var sageSOid = req.body.sageSOid;
    //get sales order
    let sqls = `SELECT id, invoiceId, customerId FROM invoices WHERE isDeleted = 0 and sales_order_Id = '${sageSOid}'`;
    var invoiceNos = await query(sqls);
    // sage intacct
    var sagecustomerid = "";
    const getCustomerIDQuery = `select customerId from customers where userId = "${customerId}"`;
    const customerIdResponse = await query(getCustomerIDQuery);
    if (customerIdResponse.length === 0) {
      const getCparentIDQuery = `select parentId from parents where userId = "${customerId}"`;
      console.log("getCustomerIDQuery =>", getCparentIDQuery);
      const parentIdResponse = await query(getCparentIDQuery);
      sagecustomerid = parentIdResponse[0].parentId;
    } else {
      sagecustomerid = customerIdResponse[0].customerId;
    }
    let objectDate = new Date();
    let invoiceCreateDate =
      objectDate.getMonth() +
      1 +
      "/" +
      objectDate.getDate() +
      "/" +
      objectDate.getFullYear();
    let items = [];
    let quantitys = [];
    for (var i = 0; i < itemId.length; i++) {
      if (req.body.title == "AdminSideInvoice") {
        const getitemId = `select itemId from items where id="${itemId[i]}"`;
        const intacctItem = await query(getitemId);
        items.push(intacctItem[0].itemId);
      } else {
        const getitemId = `select items.ItemID as itemId from items where id = "${itemId[i]}"`;
        const intacctItem = await query(getitemId);
        if (intacctItem.length > 0) {
          items.push(intacctItem[0].itemId);
        }
      }
      quantitys.push("1");
    }
    const data = {
      createDate: invoiceCreateDate,
      customerId: sagecustomerid,
      itemId: items,
      quantity: quantitys,
      sageSOid: sageSOid,
    };
    if (status === "Pending" || status === "Paid" || status === "Draft") {
      const sageIntacctSalesInvoice = await createSalesInvoice(data);
      console.log("sageIntacctSalesInvoice", sageIntacctSalesInvoice);
      const invoiceId = sageIntacctSalesInvoice._key;
      const sageIntacctInvoiceID = invoiceId.split("-")[1];
      const updateSql = `UPDATE invoices SET  invoiceId = "${sageIntacctInvoiceID}" 
          WHERE id="${invoiceNos[0].id}"`;
      const updateInvoice = await query(updateSql);
      //get invoice details
      const Getinvoice = await GetInvoiceDetails(invoiceNos[0].id);
      // get purchase items after inserted items
      const invoice_items = await purchaseInvoiceItemasDetails(
        invoiceNos[0].id
      );

      //get parents details
      let parent_det = null;
      if (Getinvoice[0].user_id && Getinvoice[0].cusromerparentid > 0) {
        parent_det = await CusromersParentDetails(
          Getinvoice[0].cusromerparentid
        );
      }
      if (status === "Pending") {
        //generate admin side invoice pdfs
        await GenerateAdminSideInvoicePdf(
          Getinvoice,
          invoice_items,
          parent_det
        );
        //generate user side invoice pdf
        await GenerateUserSideInvoicePdf(Getinvoice, invoice_items, parent_det);
        //send emails
        const InvoiceTemp = await GetEmailTemplates(
          (emailtype = invoice_items[0].product_line_id)
        );
        var translations = {
          customername:
            parent_det !== null
              ? parent_det[0]?.parent_name.toUpperCase()
              : Getinvoice[0]?.name.toUpperCase(),
          loginurl: process.env.REACTURL,
        };
        const translatedHtml = await ReplaceEmailTemplate(
          translations,
          InvoiceTemp[0].emailbodytext
        );
        sendEmails(
          Getinvoice[0].email1,
          InvoiceTemp[0].enailsubject,
          translatedHtml,
          (title = "INVOICE")
        );

        // const hh = await InvoiceEmailFormat(
        //   Getinvoice,
        //   invoice_items,
        //   parent_det
        // );
        // sendEmails(
        //   Getinvoice[0].email1,
        //   "Invoice Details From QIS✔",
        //   hh,
        //   (title = "INVOICE")
        // );

        res.status(200).json({
          message: "Invoice created successfully",
          data: { insertId: invoiceNos[0].id },
          sageIntacctInvoiceID: sageIntacctInvoiceID,
        });

        //add activity logs in hubspot
        const emaildata = {
          userid: Getinvoice[0].cusromerparentid,
          email: Getinvoice[0].email1,
          subject: "Invoice Details From QIS✔",
          bodyofemail: translatedHtml,
        };
        await migrateEmailToHubSpot(emaildata);
      } else if (status === "Paid") {
        res.status(200).json({
          message: "Invoice created successfully",
          sageIntacctInvoiceID: sageIntacctInvoiceID,
          data: { insertId: invoiceNos[0].id },
        });
      } else {
        res.status(400).json({ message: "something went wrong" });
      }
    } else {
      res.status(200).json({
        message: "Invoice Created Successfully",
      });
    }
  },

  //Create Tuition Invoice
  CreateTuitionInvoice: async (req, res) => {
    var customerId = req.body.customerId;
    var amount = req.body.amount;
    //add amount due
    var amountDue = req.body.amount;
    var itemId = req.body.itemId;
    var status = req.body.status;
    var createdDate = req.body.createdDate;
    var createdBy = req.body.createdBy;
    var invoiceDate = req.body.invoiceDate;
    var invoiceNo = req.body.invoiceNo;
    var note = req.body.note;
    var invoiceItems = req.body.invoiceItems;

    //check invoice number
    let sqls = `SELECT invoiceId FROM invoices WHERE tuition_invoice_id = '${invoiceNo}'`;
    var invoiceNos = await query(sqls);
    //check
    if (!customerId) {
      return res.status(400).send({ message: "customer field is required" });
    } else if (!amount) {
      return res.status(400).send({ message: "amount field is required" });
    } else if (!itemId) {
      return res.status(400).send({ message: "item field is required" });
    } else if (!status) {
      return res.status(400).send({ message: "status field is required" });
    } else if (!invoiceDate) {
      return res.status(400).send({ message: "invoiceDate field is required" });
    } else if (!invoiceNo) {
      return res.status(400).send({ message: "invoiceNo field is required" });
    } else if (invoiceNos.length > 0) {
      return res
        .status(400)
        .send({ message: "please enter unique invoice no" });
    } else {
      //insert  invoices
      var sql = `INSERT INTO invoices (customerId,amount,amount_due,itemId,status,createdDate,createdBy,invoiceDate,tuition_invoice_id,note) VALUES('${customerId}','${amount}','${amountDue}','${itemId}','${status}','${createdDate}','${createdBy}','${invoiceDate}','${invoiceNo}','${note}')`;
      const invoice = await query(sql);
      // insert invoices items
      for (var i = 0; i < invoiceItems.length; i++) {
        var invoiceitemsql = `INSERT INTO invoice_items (invoice_id, item_id, item_name, item_description, item_unit, quantity, item_price, item_total_price, itemId, product_line_id) VALUES('${invoice.insertId}','${invoiceItems[i].id}','${invoiceItems[i].name}','${invoiceItems[i].description}','${invoiceItems[i].unit}','${invoiceItems[i].quantity}','${invoiceItems[i].amount}','${invoiceItems[i].totalprice}','${invoiceItems[i].itemID}','${invoiceItems[i].product_line_id}')`;
        invoiceitems = await query(invoiceitemsql);
      }
      //sage intact
      const getCustomerIDQuery = `select customerId from customers where userId = "${customerId}"`;
      const customerIdResponse = await query(getCustomerIDQuery);
      var sagecustomerid = "";
      if (customerIdResponse.length === 0) {
        const getCparentIDQuery = `select parentId from parents where userId = "${customerId}"`;
        console.log("getCustomerIDQuery =>", getCparentIDQuery);
        const parentIdResponse = await query(getCparentIDQuery);
        sagecustomerid = parentIdResponse[0].parentId;
      } else {
        sagecustomerid = customerIdResponse[0].customerId;
      }
      let objectDate = new Date();
      let invoiceCreateDate =
        objectDate.getMonth() +
        1 +
        "/" +
        objectDate.getDate() +
        "/" +
        objectDate.getFullYear();
      let items = [];
      let quantitys = [];
      for (var i = 0; i < itemId.length; i++) {
        // const getitemId = `select itemId from items where id="${itemId[i]}"`; AdminSideInvoice
        if (req.body.title == "AdminSideInvoice") {
          const getitemId = `select itemId from items where id="${itemId[i]}"`;
          const intacctItem = await query(getitemId);
          items.push(intacctItem[0].itemId);
        } else {
          const getitemId = `select ItemID from items where id="${itemId[i]}"`;
          const intacctItem = await query(getitemId);
          if (intacctItem.length > 0) {
            items.push(intacctItem[0].itemId);
          }
        }
        quantitys.push("1");
      }
      const dateFormat = invoiceDate.split("/");
      const actualdueDate =
        dateFormat[1] + "/" + dateFormat[0] + "/" + dateFormat[2];
      const data = {
        createDate: invoiceCreateDate,
        customerId: sagecustomerid,
        itemId: items,
        quantity: quantitys,
        invoiceDueDate: actualdueDate,
        InvoiceDocNo: invoiceNo,
        status: status,
        invoiceItems: invoiceItems,
      };
      if (status === "Pending" || status === "Paid" || status === "Draft") {
        const sageIntacctSalesInvoice = await createTuitionInvoice(data);
        const invoiceId = sageIntacctSalesInvoice._key;
        const sageIntacctInvoiceID = invoiceId.split("-")[1];
        // const updateSql = `UPDATE invoices SET  invoiceId = "${sageIntacctInvoiceID}"
        //   WHERE id="${invoice.insertId}"`;
        // const updateInvoice = await query(updateSql);
        //get invoices details
        const Getinvoice = await GetInvoiceDetails(invoice.insertId);
        // get purchase items after inserted items
        const invoice_items = await purchaseInvoiceItemasDetails(
          invoice.insertId
        );
        //get parents details
        let parent_det = null;
        if (Getinvoice[0].user_id && Getinvoice[0].cusromerparentid > 0) {
          parent_det = await CusromersParentDetails(
            Getinvoice[0].cusromerparentid
          );
        }

        if (invoice && status === "Pending") {
          //generate admin side invoice pdfs
          await GenerateAdminSideInvoicePdf(
            Getinvoice,
            invoice_items,
            parent_det
          );
          //generate user side invoice pdf
          await GenerateUserSideInvoicePdf(
            Getinvoice,
            invoice_items,
            parent_det,
            (identifier = "inv_create_time_send_pdf_email")
          );
          //get invoiceids
          const invoiceids =
            Getinvoice[0]?.invoiceId || Getinvoice[0]?.tuition_invoice_id;
          //sending emails
          const InvoiceTemp = await GetEmailTemplates(
            (emailtype = invoice_items[0].product_line_id)
          );
          var translations = {
            customername:
              parent_det !== null
                ? parent_det[0]?.parent_name.toUpperCase()
                : Getinvoice[0]?.name.toUpperCase(),
            loginurl: process.env.REACTURL,
            invoiceid: invoiceids,
            amount: Getinvoice[0]?.amount,
          };
          const translatedHtml = await ReplaceEmailTemplate(
            translations,
            InvoiceTemp[0].emailbodytext
          );
          sendEmails(
            Getinvoice[0].email1,
            InvoiceTemp[0].enailsubject,
            translatedHtml,
            (title = "INVOICE")
          );
          // const hh = await InvoiceEmailFormat(
          //   Getinvoice,
          //   invoice_items,
          //   parent_det
          // );
          // sendEmails(
          //   Getinvoice[0].email1,
          //   "Invoice Details From QIS✔",
          //   hh,
          //   (title = "INVOICE")
          // );
          //add activity logs in hubspot
          const emaildata = {
            userid: Getinvoice[0].cusromerparentid,
            email: Getinvoice[0].email1,
            subject: "Invoice Details From QIS✔",
            bodyofemail: translatedHtml,
          };
          await migrateEmailToHubSpot(emaildata);
          res.status(200).json({
            message: "Invoice created successfully",
            data: invoice,
            sageIntacctInvoiceID: sageIntacctInvoiceID,
          });
        } else if (invoice && status === "Paid") {
          res.status(200).json({
            message: "Invoice created successfully",
            data: invoice,
            sageIntacctInvoiceID: sageIntacctInvoiceID,
          });
        } else if (invoice && status === "Draft") {
          res.status(200).json({
            message: "Invoice created successfully",
            data: invoice,
            sageIntacctInvoiceID: sageIntacctInvoiceID,
          });
        } else {
          res.status(400).json({ message: "something went wrong" });
        }
      } else {
        res.status(200).json({
          message: "Invoice Created Successfully",
          data: invoice,
        });
      }
    }
  },
  //get Sales invoice & Tuition Invoice
  //add amount due
  getInvoice: async (req, res) => {
    var startDate = req.body.startDate;
    var endDate = req.body.endDate;
    var customer = "";
    var status = "";
    var date = "";
    var amount = "";
    var order = "DESC";
    var isdeleted = "";
    if (req.body.status == "Paid") {
      status = `and invoices.status = '${req.body.status}'`;
    } else if (req.body.status == "Pending") {
      status = `and invoices.status = '${req.body.status}'`;
    } else if (req.body.status == "Draft") {
      status = `and invoices.status = '${req.body.status}'`;
    } else if (req.body.status == "Partially paid") {
      status = `and invoices.status = '${req.body.status}'`;
    } else {
      var status = "";
    }
    if (startDate && endDate) {
      date = `and invoices.invoiceDate BETWEEN '${startDate}' AND '${endDate}'`;
    }
    if (startDate && endDate && req.body.status) {
      date = `AND invoices.invoiceDate BETWEEN '${startDate}' AND '${endDate}'`;
    }
    if (req.body.amount) {
      amount = `AND invoices.amount = ${req.body.amount}`;
    }
    if (req.body.customer) {
      customer = `AND invoices.customerId IN (${req.body.customer})`;
    }
    if (req.body.order) {
      order = `ORDER BY id ${req.body.order}`;
    } else {
      order = `ORDER BY id DESC`;
    }

    if (!req.params.id) {
      let sql = `SELECT users.name, users.id as user_id, users.parentId as cusromerparentid,  users.attentionTo, users.email1, customers.customerId as sageCustomerId, parents.parentId as sageParentId, 
      invoices.id, invoices.tuition_invoice_id, invoices.invoiceId, invoices.amount,invoices.amount_due, invoices.customerId, invoices.status,
      invoices.isRequested, invoices.createdDate, invoices.invoiceDate, invoices.itemId
      FROM invoices 
      INNER JOIN users ON invoices.customerId = users.id 
      left outer join customers on customers.userId = users.id
      left outer join parents on parents.userId = users.id 
      where 1=1  and invoices.isDeleted=0
      ${status} ${date} ${amount} ${customer} ${isdeleted} ${order}`;
      const invoice = await query(sql);

      // for (let index = 0; index < invoice.length; index++) {
      //   let invoiceId = invoice[index].id;
      //   const invRefRes = await query(
      //     `select refrenceId from transaction where invoiceId = "${invoiceId}" order by id DESC limit 1`
      //   );
      //   let invRef = invRefRes.length > 0 ? invRefRes[0].refrenceId : "";
      //   let assignObj = Object.assign(invoice[index], { refrenceId: invRef });
      // }

      for (let index = 0; index < invoice.length; index++) {
        let invoiceId = invoice[index].id;
        const invRefRes = await query(
          `select transaction.id as transactionId, refrenceId from transaction where invoiceId = "${invoiceId}" order by id DESC limit 1`
        );
        let invTrans = invRefRes.length > 0 ? invRefRes[0].transactionId : "";
        let assignObj = Object.assign(invoice[index], {
          transactionId: invTrans,
        });
        let invRef = invRefRes.length > 0 ? invRefRes[0].refrenceId : "";
        let assignObj1 = Object.assign(invoice[index], { refrenceId: invRef });
      }

      res.status(200).json({ message: "ok", data: invoice });
    } else {
      let invoices = `SELECT users.name, users.attentionTo, invoices.invoiceId, invoices.tuition_invoice_id, invoices.amount,invoices.amount_due, invoices.customerId, customers.customerId as sageCustomerId, parents.parentId as sageParentId,  invoices.status, invoices.id, invoices.createdDate, invoices.invoiceDate, invoices.itemId, invoices.isRequested, invoices.note,
      transaction.refrenceId, transaction.id as transactionId, transaction.paymentMethod, transaction.createdAt as transactionDate, transaction.paidAmount as transactionAmount ,transaction.transactionId as transactionNumber, sagecreditnotes.amountMode as creditAmountMode, sagecreditnotes.amount as creditAmount
      FROM invoices
      INNER JOIN users ON invoices.customerId = users.id 
      left outer join customers on customers.userId = users.id
      left outer join parents on parents.userId = users.id
      left outer join transaction on transaction.invoiceId = invoices.id
      left outer join sagecreditnotes on sagecreditnotes.id = transaction.creditNotesId
      WHERE invoices.id = ${req.params.id}`;
      const invoicess = await query(invoices);
      res.status(200).json({ data: invoicess });
    }
  },

  getinvoiceAllStatus: async (req, res) => {
    let sql = `SELECT users.name, users.id as user_id, users.parentId as cusromerparentid,  users.attentionTo, users.email1, customers.customerId as sageCustomerId, parents.parentId as sageParentId, 
    invoices.id, invoices.tuition_invoice_id, invoices.invoiceId, invoices.amount,invoices.amount_due, invoices.customerId, invoices.status,
    invoices.isRequested, invoices.createdDate, invoices.invoiceDate, invoices.itemId
    FROM invoices 
    INNER JOIN users ON invoices.customerId = users.id 
    left outer join customers on customers.userId = users.id
    left outer join parents on parents.userId = users.id 
    where invoices.status="Partially paid" or invoices.status ="Pending" and invoices.isDeleted=0 order by id desc;`;
    const invoice = await query(sql);
    res.status(200).json({ message: "ok", data: invoice });
  },
  //update invoice after payment succesfull
  updateInvoice: async (req, res) => {
    let sqls = `SELECT invoices.amount,invoices.customerId,invoices.status,invoices.createdBy,invoices.id,invoices.createdDate,invoices.invoiceDate,invoices.itemId FROM invoices WHERE invoices.id = ${req.params.id}`;
    const invoice = await query(sqls);
    const {
      user_id,
      amount,
      amount_due,
      itemId,
      createdDate,
      invoiceDate,
      createdBy,
    } = req.body;
    let updateStatus = req.body.status;
    var note = "";
    if (req.body.note) {
      note = `,note='${req.body.note}'`;
    }
    if (invoice[0].status === "Paid") {
      res.status(401).json({ message: "Already Paid" });
    } else {
      let customerId = user_id ? user_id : invoice[0].customerId;
      let amounts = amount ? amount : invoice[0].amount;
      let createdDates = createdDate ? createdDate : invoice[0].createdDate;
      let invoiceDates = invoiceDate ? invoiceDate : invoice[0].invoiceDate;
      let itemIds = itemId ? itemId : invoice[0].itemId;
      let createdBys = createdBy ? createdBy : invoice[0].createdBy;
      let status = invoice[0].status;
      let amount_duee = amount_due === undefined ? 0 : amount_due;
      var sql = `UPDATE invoices SET customerId = '${customerId}', amount='${amounts}',amount_due='${amount_duee}',itemId ='${itemIds}', createdDate='${createdDates}',invoiceDate='${invoiceDates}',createdBy='${createdBys}',status='${updateStatus}'${note} WHERE id = ${req.params.id}`;
      const invoices = await query(sql);
      invoices["itemIds"] = itemIds;
      res.send({
        data: invoices,
        sageid: itemIds,
      });
    }
  },
  //edit Tuition invoice
  editInvoice: async (req, res) => {
    const {
      customerId,
      amount,
      itemId,
      createdDate,
      invoiceNo,
      invoiceDate,
      createdBy,
      updatedAt,
      updatedBy,
      status,
      note,
      invoiceItems,
    } = req.body;

    let objectDate = new Date();
    let invoiceCreateDate =
      objectDate.getMonth() +
      1 +
      "/" +
      objectDate.getDate() +
      "/" +
      objectDate.getFullYear();

    //get invoice details
    let sqls = `SELECT invoices.amount, invoices.customerId, invoices.status, invoices.createdBy, invoices.id, invoices.createdDate, invoices.invoiceDate, invoices.itemId, tuition_invoice_id as invoiceId, invoices.note FROM invoices WHERE isDeleted = 0 and invoices.id = ${req.params.id}`;
    const invoice = await query(sqls);

    let customerIds = customerId;
    let amounts = amount ? amount : invoice[0]?.amount;
    let createdDates = createdDate ? createdDate : invoice[0]?.createdDate;
    let invoiceDates = invoiceDate ? invoiceDate : invoice[0]?.invoiceDate;
    let itemIds = itemId ? itemId : invoice[0]?.itemId;
    let createdBys = createdBy ? createdBy : invoice[0]?.createdBy;
    let updatedAts = updatedAt;
    let updatedBys = updatedBy;
    let invoiceNos = invoiceNo ? invoiceNo : invoice[0].invoiceId;
    let statuss = status;
    let notes = note ? note : invoice[0].note;
    //update invoice
    var sql = `UPDATE invoices SET customerId = '${customerIds}',tuition_invoice_id = '${invoiceNos}', amount='${amounts}',itemId ='${itemIds}', createdDate='${createdDates}',invoiceDate='${invoiceDates}',createdBy='${createdBys}',updatedAt='${updatedAts}',updatedBy='${updatedBys}',status='${statuss}', note='${notes}' WHERE id = ${req.params.id}`;
    await query(sql);

    //sageintact
    var sagecustomerid = "";
    const getCustomerIDQuery = `select customerId from customers where userId = "${customerId}"`;
    const customerIdResponse = await query(getCustomerIDQuery);
    if (customerIdResponse.length === 0) {
      const getCparentIDQuery = `select parentId from parents where userId = "${customerId}"`;
      const parentIdResponse = await query(getCparentIDQuery);
      sagecustomerid = parentIdResponse[0].parentId;
    } else {
      sagecustomerid = customerIdResponse[0].customerId;
    }
    // let items = [];
    // let quantitys = [];
    // for (var i = 0; i < itemIds.length; i++) {
    //   if (req.body.title == "AdminSideInvoice") {
    //     const getitemId = `select itemId from items where id="${itemId[i]}"`;
    //     const intacctItem = await query(getitemId);
    //     items.push(intacctItem[0].itemId);
    //   } else {
    //     const getitemId = `select itemId from items where id="${itemId[i]}"`;
    //     const intacctItem = await query(getitemId);
    //     if (intacctItem.length > 0) {
    //       items.push(intacctItem[0].itemId);
    //     }
    //   }
    //   quantitys.push("1");
    // }
    const data = {
      invoiceID: invoiceNos,
      createDate: invoiceCreateDate,
      customerId: sagecustomerid,
      //itemId: items,
      //quantity: quantitys,
      dueDate: invoiceDate,
      state: status,
    };
    const sageIntacctInvoice = await updateTuitionInvoice(data);
    if (status === "Pending") {
      //get invoice details
      const Getinvoice = await GetInvoiceDetails(req.params.id);
      //get invoiceids
      const invoiceids =
        Getinvoice[0]?.invoiceId || Getinvoice[0]?.tuition_invoice_id;
      //get parents det
      let parent_det = null;
      if (Getinvoice[0].user_id && Getinvoice[0].cusromerparentid > 0) {
        parent_det = await CusromersParentDetails(
          Getinvoice[0].cusromerparentid
        );
      }
      if (invoice && status === "Pending") {
        //generate admin side invoice pdfs
        await GenerateAdminSideInvoicePdf(Getinvoice, invoiceItems, parent_det);
        //generate user side invoice pdf
        await GenerateUserSideInvoicePdf(
          Getinvoice,
          invoiceItems,
          parent_det,
          (identifier = "inv_create_time_send_pdf_email")
        );
        //send emails
        //sending emails
        const InvoiceTemp = await GetEmailTemplates(
          (emailtype = invoiceItems[0].product_line_id)
        );
        var translations = {
          customername:
            parent_det !== null
              ? parent_det[0]?.parent_name.toUpperCase()
              : Getinvoice[0]?.name.toUpperCase(),
          loginurl: process.env.REACTURL,
          invoiceid: invoiceids,
          amount: Getinvoice[0]?.amount,
        };
        const translatedHtml = await ReplaceEmailTemplate(
          translations,
          InvoiceTemp[0].emailbodytext
        );
        sendEmails(
          Getinvoice[0].email1,
          InvoiceTemp[0].enailsubject,
          translatedHtml,
          (title = "INVOICE")
        );
        // const hh = await InvoiceEmailFormat(
        //   Getinvoice,
        //   invoiceItems,
        //   parent_det
        // );
        // sendEmails(
        //   Getinvoice[0].email1,
        //   "Invoice Details From QIS✔",
        //   hh,
        //   (title = "INVOICE")
        // );

        //add activity logs in hubspot
        const emaildata = {
          userid: Getinvoice[0].cusromerparentid,
          email: Getinvoice[0].email1,
          subject: "Invoice Details From QIS✔",
          bodyofemail: translatedHtml,
        };
        await migrateEmailToHubSpot(emaildata);
        res.status(200).json({
          message: "Invoice created successfully",
          data: invoice,
          sageIntacctInvoiceID: invoiceNos,
        });
      } else {
        res.status(400).json({ message: "something went wrong" });
      }
    } else {
      res.status(200).json({
        message: "Invoice Created Successfully",
        data: invoice,
      });
    }
  },
  //get Tuition invoice number
  getInvoiceNo: async (req, res) => {
    let sql = `SELECT id FROM invoices ORDER BY id DESC`;
    const invoices = await query(sql);
    let invoiceNo = `INVP000${invoices.length === 0 ? 1 : invoices[0]?.id + 1}`;
    res.status(201).json({ invoiceNo: invoiceNo });
  },

  //delete Sales invoice
  deleteInvoice: async (req, res) => {
    const { userId } = req.body;
    const date = new Date();
    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();
    // This arrangement can be altered based on how we want the date's format to appear.
    let currentDate = `${day}/${month}/${year}`;
    var InvoiceSql = `SELECT invoiceId, tuition_invoice_id, sales_order_Id FROM invoices where id=${req.params.id};`;
    const sageIntacctInvoiveId = await query(InvoiceSql);
    let invoiceID = "";
    let sales_order_Id = "";
    let isTuitionInv = 0;
    if (sageIntacctInvoiveId[0]["invoiceId"] != null) {
      invoiceID = sageIntacctInvoiveId[0]["invoiceId"];
      sales_order_Id = sageIntacctInvoiveId[0]["sales_order_Id"];
      isTuitionInv = 0;
    } else {
      invoiceID = sageIntacctInvoiveId[0]["tuition_invoice_id"];
      isTuitionInv = 1;
    }
    if (!userId) {
      return res.status(400).send({ message: "userId is required" });
    }
    var sqls = `UPDATE invoices SET isDeleted='1',deletedBy='${userId}',deletedDate='${currentDate}' WHERE id = ${req.params.id}`;
    const updateInvoice = await query(sqls);
    if (isTuitionInv == 0) {
      const deletedInvoice = await deleteSalesInvoice(invoiceID);
      if (sales_order_Id !== "") {
        const deletedInvoice = await deleteSageIntacctSalesOrder(invoiceID);
      }
    } else {
      const deletedInvoice = await deleteTuitionInvoice(invoiceID);
    }
    res
      .status(200)
      .json({ message: "Deleted Successfully", invoiceid: invoiceID });
  },
  //send invoice email
  SendInvoiceEmail: async (req, res) => {
    //get invoice details
    const Getinvoice = await GetInvoiceDetails(req.params.id);
    //get invoiceids
    const invoiceids =
      Getinvoice[0]?.invoiceId || Getinvoice[0]?.tuition_invoice_id;
    //get invoice items details
    const invoice_items = await purchaseInvoiceItemasDetails(req.params.id);
    //get parents det
    let parent_det = null;
    if (Getinvoice[0].user_id && Getinvoice[0].cusromerparentid > 0) {
      parent_det = await CusromersParentDetails(Getinvoice[0].cusromerparentid);
    }
    await GenerateUserSideInvoicePdf(
      Getinvoice,
      invoice_items,
      parent_det,
      (identifier = "send_pdf_email")
    );

    //send emails
    const InvoiceTemp = await GetEmailTemplates(
      (emailtype = invoice_items[0].product_line_id)
    );

    var translations = {
      customername:
        parent_det !== null
          ? parent_det[0]?.parent_name.toUpperCase()
          : Getinvoice[0]?.name.toUpperCase(),
      loginurl: process.env.REACTURL,
      invoiceid: invoiceids,
      amount: Getinvoice[0]?.amount,
    };
    const translatedHtml = await ReplaceEmailTemplate(
      translations,
      InvoiceTemp[0].emailbodytext
    );
    sendEmails(
      Getinvoice[0].email1,
      InvoiceTemp[0].enailsubject,
      translatedHtml,
      (title = "INVOICE")
    );
    // const hh = await InvoiceEmailFormat(Getinvoice, invoice_items, parent_det);
    // sendEmails(
    //   Getinvoice[0].email1,
    //   "Invoice Details From QIS✔",
    //   hh,
    //   (title = "INVOICE")
    // );
    //add activity logs in hubspot
    const emaildata = {
      userid: Getinvoice[0].cusromerparentid,
      email: Getinvoice[0].email1,
      subject: "Invoice Details From QIS✔",
      bodyofemail: translatedHtml,
    };
    await migrateEmailToHubSpot(emaildata);
    res.status(200).json({ message: "send invoice email successfully" });
  },

  //get invoice by user id open and close invoice
  getInvoiceByUserId: async (req, res) => {
    if (req.query.key == "close") {
      let sql = `SELECT invoices.id as invid, invoices.amount, invoices.invoiceId, invoices.tuition_invoice_id,  invoices.isDeleted, invoices.customerId, invoices.itemId, invoices.status, invoices.createdDate,invoices.invoiceDate,invoices.id,invoices.itemId FROM invoices WHERE customerId in (${req.params.id}) AND status ='paid' AND isDeleted = 0 ORDER BY invoiceDate DESC`;
      const invoice = await query(sql);
      res.send(invoice);
    } else {
      let sql = `SELECT invoices.id as invid, invoices.amount, invoices.invoiceId, invoices.tuition_invoice_id, invoices.status,invoices.customerId, invoices.itemId,invoices.createdDate, invoices.invoiceDate,invoices.id,invoices.itemId FROM invoices WHERE customerId in (${req.params.id}) AND isDeleted = 0 AND status = 'pending' ORDER BY invoiceDate DESC`;
      const invoice = await query(sql);
      res.send(invoice);
    }
  },

  //get invoice by user id
  getInvoiceByUser: async (req, res) => {
    const { status, startDate, endDate, order, amount, invoiceId } = req.body;
    let bystatus = "";
    if (status === "Paid") {
      bystatus = ` and invoices.status = "${status}"`;
    } else if (status === "Pending") {
      bystatus = ` and invoices.status = "${status}"`;
    } else {
      bystatus = "";
    }
    // let bysorting = "order by invoices.createdDate desc";
    // if (order === "ASC") {
    //   bysorting = `order by invoices.createdDate ${order}`;
    // } else {
    //   bysorting = `order by invoices.createdDate desc`;
    // }
    let byamount = "";
    if (amount) {
      byamount = `AND invoices.amount = ${amount}`;
    } else {
      byamount = "";
    }
    let byinvoiceid = "";
    if (invoiceId) {
      byinvoiceid = `AND invoices.tuition_invoice_id = "${invoiceId}"`;
    } else {
      byinvoiceid = "";
    }
    let bydate = "";
    if (startDate && endDate) {
      bydate = ` and  invoiceDate  BETWEEN "${startDate}" AND "${endDate}"`;
    } else {
      bydate = "";
    }

    // let sql = `SELECT users.id as user_id, users.name, users.attentionTo, users.parentId as cusromerparentid, customers.customerId, customers.customerId as sageCustomerId, parents.parentId, parents.parentId as sageParentId, invoices.id as invid, invoices.tuition_invoice_id,
    // invoices.invoiceId, invoices.amount,invoices.amount_due, invoices.customerId, invoices.status, invoices.isRequested, invoices.createdDate,
    // invoices.invoiceDate, invoices.itemId, transaction.id as transactionId, transaction.refrenceId, transaction.paymentMethod, transaction.createdAt as transactionDate,transaction.paidAmount as transactionAmount
    // FROM invoices
    // INNER JOIN users ON invoices.customerId = users.id
    // left outer join customers on customers.userId = users.id
    // left outer join parents on parents.userId = users.id
    // left outer join transaction on transaction.invoiceId = invoices.id
    // WHERE invoices.customerId in(${req.params.id}) ${bystatus} ${byamount} ${byinvoiceid} ${bydate} ${bysorting}`;
    // const invoice = await query(sql);
    // res.send(invoice);

    let sql = `SELECT users.id as user_id, users.name, users.attentionTo, users.parentId as cusromerparentid, customers.customerId, customers.customerId as sageCustomerId, parents.parentId, parents.parentId as sageParentId, invoices.id as invid, invoices.tuition_invoice_id, 
    invoices.invoiceId, invoices.amount,invoices.amount_due, invoices.customerId, invoices.status, invoices.isRequested, invoices.createdDate,
    invoices.invoiceDate, invoices.itemId
    FROM invoices 
    INNER JOIN users ON invoices.customerId = users.id 
    left outer join customers on customers.userId = users.id
    left outer join parents on parents.userId = users.id 
    WHERE invoices.customerId in(${req.params.id}) ${bystatus} ${byamount} ${byinvoiceid} ${bydate} ORDER BY invoices.id DESC`;
    const invoice = await query(sql);
    for (let index = 0; index < invoice.length; index++) {
      let invoiceId = invoice[index].invid;
      const invRefRes = await query(
        `select transaction.id as transactionId, refrenceId from transaction where invoiceId = "${invoiceId}" order by id DESC limit 1`
      );
      let invTrans = invRefRes.length > 0 ? invRefRes[0].transactionId : "";
      let assignObj = Object.assign(invoice[index], {
        transactionId: invTrans,
      });
      let invRef = invRefRes.length > 0 ? invRefRes[0].refrenceId : "";
      let assignObj1 = Object.assign(invoice[index], { refrenceId: invRef });
    }
    res.send(invoice);
  },

  //get pending invoices individual user
  getPendingInvoice: async (req, res) => {
    let sql = `SELECT invoices.id as invid, invoices.amount, invoices.tuition_invoice_id, invoices.invoiceId, invoices.status, invoices.customerId, invoices.itemId, invoices.createdDate, invoices.invoiceDate FROM invoices WHERE customerId in(${req.params.id}) AND isDeleted = 0  AND status="pending" ORDER BY invoices.invoiceDate DESC`;
    const invoice = await query(sql);
    res.status(200).json({ message: "ok", data: invoice });
  },
  GetCustomerIdByInvoiceNo: (req, res) => {
    const ids = req.params.id;
    var sql = `SELECT customers.customerId FROM customers INNER JOIN invoices ON invoices.customerId = customers.userId where invoices.invoiceId = "${ids}"`;
    mysqlconnection.query(sql, function (err, result) {
      if (err) throw err;
      res.status(200).json({ message: "ok", data: result });
    });
  },
  //download invoice controller
  DownloadInvoiceController: async (req, res) => {
    const { id, invoiceId, isSide } = req.body;
    //get invoice details
    const Getinvoice = await GetInvoiceDetails(id);
    //get invoice items details
    const invoice_items = await purchaseInvoiceItemasDetails(id);
    //get parents det
    let parent_det = null;
    if (Getinvoice[0].user_id && Getinvoice[0].cusromerparentid > 0) {
      parent_det = await CusromersParentDetails(Getinvoice[0].cusromerparentid);
    }

    if (isSide == "admin_side") {
      //admin side invoices
      var filePath = `invoicespdf/${"admin-"}${invoiceId}.pdf`;
      fs.access(filePath, fs.constants.F_OK, async (err) => {
        if (err) {
          console.log("File does not exist");
          //if invoice not exists in the forlder so, create invoice
          //generate admin side invoice pdf
          await GenerateAdminSideInvoicePdf(
            Getinvoice,
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
      var filePath = `invoicespdf/${"customer-"}${invoiceId}.pdf`;
      fs.access(filePath, fs.constants.F_OK, async (err) => {
        if (err) {
          console.log("File does not exist");
          //create invoice pdf
          //generate user side invoice pdf
          await GenerateUserSideInvoicePdf(
            Getinvoice,
            invoice_items,
            parent_det,
            (identifier = "")
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

  deleteActivityInvoice: async (req, res) => {
    var InvoiceSql = `SELECT invoiceId, tuition_invoice_id, sales_order_Id FROM invoices where id=${req.params.id};`;
    const sageIntacctInvoiveId = await query(InvoiceSql);
    let invoiceID = "";
    let sales_order_Id = "";
    let isTuitionInv = 0;
    if (sageIntacctInvoiveId[0]["invoiceId"] != null) {
      invoiceID = sageIntacctInvoiveId[0]["invoiceId"];
      sales_order_Id = sageIntacctInvoiveId[0]["sales_order_Id"];
      isTuitionInv = 0;
    } else {
      invoiceID = sageIntacctInvoiveId[0]["tuition_invoice_id"];
      isTuitionInv = 1;
    }

    if (isTuitionInv == 0) {
      const deletedInvoice = await deleteSalesInvoice(invoiceID);
      if (sales_order_Id !== "") {
        const deletedInvoice = await deleteSageIntacctSalesOrder(
          sales_order_Id
        );
      }
    } else {
      const deletedInvoice = await deleteTuitionInvoice(invoiceID);
    }
    var InvoiceSql = `DELETE FROM invoices WHERE id="${req.params.id}"`;
    const dbinvoiceid = await query(InvoiceSql);
    // await deleteSalesInvoice(invoiceId);
    res
      .status(200)
      .json({ message: "Deleted Successfully", invoiceid: invoiceID });
  },
  //get invoices ids
  GetInvoiceids: (req, res) => {
    var sql = `SELECT invoices.id, invoices.invoiceId, invoices.tuition_invoice_id FROM invoices`;
    mysqlconnection.query(sql, function (err, result) {
      if (err) throw err;
      res.status(200).json({ message: "ok", data: result });
    });
  },
};

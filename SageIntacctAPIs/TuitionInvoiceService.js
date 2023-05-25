const { client, IA } = require("./IntacctClient");
const mysqlconnection = require("../DB/db.config.connection");
const util = require("util");
const InvoiceEmailFormat = require("../Controllers/Helper/templates/InvoiceEmailTemp");
const sendEmails = require("../Controllers/Helper/sendEmails");
const {
  purchaseInvoiceItemasDetails,
  CusromersParentDetails,
  GetInvoiceDetails,
} = require("../commonFunction/commonControllerFunction");
const {
  GenerateUserSideInvoicePdf,
} = require("../Controllers/Helper/invoicepdf");

const query = util.promisify(mysqlconnection.query).bind(mysqlconnection);
module.exports = {
  createTuitionInvoice: async (data) => {
    try {
      const itemIds = data.itemId;
      const invoiceItems = data.invoiceItems;
      const itemQuantity = data.quantity;
      if (itemIds.length != itemQuantity.length) {
        return "please provide the quantity for each item !";
      }
      let record = new IA.Functions.OrderEntry.OrderEntryTransactionCreate();
      record.transactionDefinition = "Tuition Invoice";
      record.transactionDate = data.createDate; //"2/15/2023"
      record.glPostingDate = data.createDate; //"2/15/2023"
      record.customerId = data.customerId; //10003
      record.dueDate = data.invoiceDueDate;
      record.state = data.status;
      record.documentNumber = data.InvoiceDocNo;
      var lines = [];
      for (var i = 0; i < itemIds.length; i++) {
        //lines.push(`line${i}`);
      }
      for (var j = 0; j < invoiceItems.length; j++) {
        lines[j] =
          new IA.Functions.OrderEntry.OrderEntryTransactionLineCreate();
        lines[j].itemId = invoiceItems[j].itemID; //"CSS1003"
        lines[j].quantity = invoiceItems[j].quantity; // 2
        lines[j].locationId = "100--USA1";
        lines[j].unit = invoiceItems[j].unit;
        lines[j].price = invoiceItems[j].amount;
        lines[j].itemDescription = invoiceItems[j].description;
      }
      record.lines = lines;
      console.log("record", record);
      const createResponse = await client.execute(record).catch((error) => {
        console.error("error", error);
        return error.message;
      });
      const createResult = createResponse.getResult();
      return createResult;
    } catch (error) {
      console.error("error", error);
      return error.message;
    }
  },

  updateTuitionInvoice: async (data) => {
    try {
      // const itemIds = data.itemId.split(",");
      // const itemQuantity = data.quantity.split(",");

      // const itemIds = data.itemId;
      // const itemQuantity = data.quantity;

      const Date = data.dueDate.split("/");
      var DueDate = `"${Date[1]}/${Date[0]}/${Date[2]}"`;
      let record = new IA.Functions.OrderEntry.OrderEntryTransactionUpdate();
      record.transactionId = `Tuition Invoice-${data.invoiceID}`;
      record.transactionDefinition = "Tuition Invoice";
      // record.transactionDate = new Date("2/15/2023");
      record.dueDate = DueDate; //"02/24/2027"
      record.customerId = data.customerId; //"10003";
      record.state = data.state; //"Closed ,pending"
      // var lines = [];
      // for (var i = 0; i < itemIds.length; i++) {
      //   lines.push(`line${i}`);
      // }
      // for (var j = 0; j < itemIds.length; j++) {
      //   var lineNo = parseInt(1 + j);
      //   lines[j] =
      //     new IA.Functions.OrderEntry.OrderEntryTransactionLineUpdate();
      //   lines[j].lineNo = lineNo;
      //   lines[j].itemId = itemIds[j]; //"CSS1003"
      //   lines[j].quantity = itemQuantity[j]; // 2
      //   lines[j].locationId = "100--USA1";
      //   lines[j].unit = "Each";
      // }
      // record.lines = lines;

      const createResponse = await client.execute(record);
      const createResult = createResponse.getResult();
      return createResult;
    } catch (error) {
      console.log("error", error);
      return error.message;
    }
  },

  deleteTuitionInvoice: async (invoiceID) => {
    try {
      let record = new IA.Functions.OrderEntry.OrderEntryTransactionDelete();
      record.documentId = `Tuition Invoice-${invoiceID}`;
      const createResponse = await client.execute(record);
      const createResult = createResponse.getResult();

      return error.message;
    } catch (error) {
      // res.send(error.message);
      return error.message;
    }
  },
  getListTuitionInvoices: async (req, res) => {
    try {
      let limit = 1000;
      let salquery = new IA.Functions.Common.ReadByQuery();

      salquery.objectName = "SODOCUMENT"; // Keep the count to just 1 for the example
      salquery.pageSize = limit;

      salquery.docParId = "Tuition Invoice";
      const response = await client.execute(salquery);
      const result = response.getResult();
      let json_data = result.data;

      const numPage = Math.ceil(result.totalCount / limit);

      await isTuitionInvoiceExistInDB(json_data, req, res);
      let i = 1;

      while (
        result.numRemaining > 0 &&
        i < numPage &&
        result.resultId != null
      ) {
        i++;
        let more = new IA.Functions.Common.ReadMore();
        more.resultId = result.resultId;

        const responseMore = await client.execute(more);
        const resultMore = responseMore.getResult();

        await isTuitionInvoiceExistInDB(resultMore.data, req, res);
      }

      res.status(200);
    } catch (error) {
      return error.message;
    }
  },

  getTuitionInvoiceBySmartEvent: async (req, res) => {
    try {
      if (req.body) {
        let ItemsArr = [];

        ItemsArr.push(req.body);

        await isTuitionInvoiceExistInDB(ItemsArr, req, res);
        res.status(200).send("OK");
      }
    } catch (error) {
      return error.message;
    }
  },

  getUnitOfMesurements: async (req, res) => {
    try {
      let uomquery = new IA.Functions.Common.ReadByQuery();

      uomquery.objectName = "UOM"; // Keep the count to just 1 for the example
      const response = await client.execute(uomquery);
      const result = response.getResult();
      let json_data = result.data;
      console.log("getUnitOfMesurements", json_data);
      await manageUnitOfMesurements(json_data, req, res);
    } catch (error) {
      console.error("getUnitOfMesurements", error);
      return error.message;
    }
  },

  getUnitOfMesurementsBySmartEvent: async (req, res) => {
    try {
      if (req.body) {
        const RECORDNO = req.body.RECORDNO;
        const { recordId } = req.body;
        let read = new IA.Functions.Common.Read();
        read.objectName = "UOM";
        read.keys = [RECORDNO];
        const responsebyname = await client.execute(read);
        const result = responsebyname.getResult();
        let json_data = result.data.length > 0 ? result.data[0] : "";
        console.log("getUnitOfMesurements", json_data);
        await manageUnitOfMesurements(result.data, req, res);
      }
    } catch (error) {
      console.error("getUnitOfMesurements", error);
      return error.message;
    }
  },

  deleteUnitOfMesurementsBySmartEvent: async (req, res) => {
    try {
      if (req.body) {
        const recordNo = req.body.RECORDNO;

        await deleteUnitOfMesurements(recordNo, req, res);
      }
    } catch (error) {
      console.error("getUnitOfMesurements", error);
      return error.message;
    }
  },
};

async function isTuitionInvoiceExistInDB(sageIntacctInovice, req, res) {
  try {
    let alreadyinvoicesInDB = [];
    let sageIntacctinvoicesId = [];
    const alreadyDBInvoice = `SELECT tuition_invoice_id FROM invoices where tuition_invoice_id!="null" `;
    const DBinvoice = await query(alreadyDBInvoice);
    for (var k = 0; k < DBinvoice.length; k++) {
      alreadyinvoicesInDB.push(DBinvoice[k]["tuition_invoice_id"]);
    }
    for (var i = 0; i < sageIntacctInovice.length; i++) {
      sageIntacctinvoicesId.push(sageIntacctInovice[i]["DOCNO"]);
    }
    // console.log("sageIntacctinvoicesId ", sageIntacctinvoicesId);
    // console.log("alreadyinvoicesInDB ", alreadyinvoicesInDB);
    for (var j = 0; j < sageIntacctinvoicesId.length; j++) {
      // for (var j = 0; j < 1; j++) {

      const recordNo = sageIntacctInovice[j]["RECORDNO"];

      let read = new IA.Functions.Common.Read();
      read.objectName = "SODOCUMENT";
      read.keys = [recordNo]; // sales order not related 1913 // sales order related 3457

      const responsebyname = await client.execute(read);
      const invoiceResponse = responsebyname.getResult();
      const invoice = invoiceResponse?._data[0];
      const sageIntacctItemId = invoice["SODOCUMENTENTRIES"].sodocumententry;
      //console.log(sageIntacctItemId)

      let ItemsArr = [];
      const invoiceItem = [];
      if (sageIntacctItemId.length) {
        try {
          for (var k = 0; k < sageIntacctItemId.length; k++) {
            const sId = sageIntacctItemId[k]["ITEMID"];
            const itemUnit = sageIntacctItemId[k]["UNIT"];
            const itemQty = sageIntacctItemId[k]["QUANTITY"];
            const itemPrice = sageIntacctItemId[k]["PRICE"];
            const itemTotal = sageIntacctItemId[k]["TOTAL"];
            const itemName = sageIntacctItemId[k]["ITEMNAME"];
            const itemDesc = sageIntacctItemId[k]["ITEMDESC"];
            const actualitemId = sId.split("--")[0];
            const queryforitemIdResponse = await query(
              `select id, product_line_id from items where itemID = "${actualitemId}"`
            );
            if (queryforitemIdResponse.length > 0) {
              const itemid = queryforitemIdResponse[0]?.id;
              const productLineId = queryforitemIdResponse[0]?.product_line_id;
              //console.log("Items if ",{ "itemName": itemName, "itemDesc": itemDesc, "itemUnit": itemUnit, "itemQty":itemQty, "itemPrice":itemPrice, "itemTotal":itemTotal, "itemId": itemid })
              ItemsArr.push({
                itemName: itemName,
                itemDesc: itemDesc,
                itemUnit: itemUnit,
                itemQty: itemQty,
                itemPrice: itemPrice,
                itemTotal: itemTotal,
                item_id: itemid,
                itemId: actualitemId,
                product_line_id: productLineId,
              });
              invoiceItem.push(itemid);
            }
          }
        } catch (error) {
          console.log("Error  = ", error);
        }
      } else {
        const sId = sageIntacctItemId.ITEMID;
        const actualitemId = sId.split("--")[0];
        const queryforitemIdResponse = await query(
          `select id, product_line_id from items where itemID = "${actualitemId}"`
        );
        if (queryforitemIdResponse.length > 0) {
          const itemid = queryforitemIdResponse[0]?.id;
          const itemUnit = sageIntacctItemId.UNIT;
          const itemQty = sageIntacctItemId.QUANTITY;
          const itemPrice = sageIntacctItemId.PRICE;
          const itemTotal = sageIntacctItemId.TOTAL;
          const itemName = sageIntacctItemId.ITEMNAME;
          const itemDesc = sageIntacctItemId.ITEMDESC;
          const itemId = actualitemId;
          const productLineId = queryforitemIdResponse[0]?.product_line_id;
          //console.log("Items else",{ "itemName": itemName, "itemDesc": itemDesc, "itemUnit": itemUnit, "itemQty":itemQty, "itemPrice":itemPrice, "itemTotal":itemTotal, "itemId": itemid })
          ItemsArr.push({
            itemName: itemName,
            itemDesc: itemDesc,
            itemUnit: itemUnit,
            itemQty: itemQty,
            itemPrice: itemPrice,
            itemTotal: itemTotal,
            item_id: itemid,
            itemId: itemId,
            produdt_line_id: productLineId,
          });
          invoiceItem.push(itemid);
        }
      }
      var itemtoinsert = invoiceItem.map((e, i) => e + ",").join("");
      itemtoinsert = itemtoinsert.slice(0, -1);
      console.log("itemtoinsert = ", itemtoinsert);
      const queryUserId = `select userId from customers where customerId = "${invoice["CUSTVENDID"]}"`;
      const userIdResponse = await query(queryUserId);
      let userID;
      if (userIdResponse.length > 0) {
        userID = userIdResponse[0]?.userId;
      } else {
        const queryUserId = `select userId from parents where parentId = "${invoice["CUSTVENDID"]}"`;
        const userIdResponse = await query(queryUserId);
        userID = userIdResponse[0]?.userId;
      }
      const invoiceid = invoice["DOCNO"];
      const amount = invoice["TOTAL"];
      let status = invoice["STATE"];
      if (status == "Closed") {
        status = "Pending";
      }
      const createdate = invoice["WHENCREATED"];
      const createby = invoice["CREATEDBY"];
      const email1 = invoice["CONTACT.EMAIL1"];
      const name = invoice["CONTACT"]["CONTACTNAME"];
      const createdDate = invoice["WHENCREATED"]; //27/03/2023
      const paymentExpectDate = invoice["WHENDUE"];
      const fromateDate = createdDate?.split("-");
      const invoiceCreateDate = `${fromateDate[2]}/${fromateDate[1]}/${fromateDate[0]}`;
      const dueDate = paymentExpectDate?.split("-");
      const payExpect = `${dueDate[2]}/${dueDate[1]}/${dueDate[0]}`;
      const paymentStatus = invoice["PAYMENTSTATUS"];
      const payments = invoice["PAYMENTS"];
      let paymentMenthod = "";
      let transactionid = "";
      if (payments) {
        transactionid = invoice["PAYMENTS"]["ENTITY"];
        paymentMenthod = invoice["PAYMENTS"]["PAYMENTTYPE"];
      }
      const InvoiceIdEx = await query(
        `SELECT id, tuition_invoice_id ,sales_order_id  FROM invoices where tuition_invoice_id = "${invoiceid}"`
      );
      let InvTblId = "";
      let SalesInvId = "";
      let SalesIdEx = "";
      if (InvoiceIdEx.length > 0) {
        InvTblId = InvoiceIdEx[0].id;
        SalesInvId = InvoiceIdEx[0].tuition_invoice_id;
        SalesIdEx = InvoiceIdEx[0].sales_order_id;
      }
      if (paymentStatus === "Paid") {
        status = "Paid";
      }
      try {
        if (invoiceItem && userID) {
          if (alreadyinvoicesInDB.includes(sageIntacctinvoicesId[j])) {
            var updateSql = `UPDATE invoices SET customerId = "${userID}",tuition_invoice_id = "${invoiceid}", amount="${amount}",status="${status}", itemId="${itemtoinsert}" WHERE tuition_invoice_id = "${invoiceid}"`;
            const update = await query(updateSql);
            await insertIvoiceItems(ItemsArr, InvTblId);
            if (paymentStatus === "Paid") {
              const transactionSql = `select id from transaction where invoiceId = "${InvTblId}"`;
              const transactionSqlRes = await query(transactionSql);
              if (transactionSqlRes.length > 0) {
                const transactionupdateSql = `update transaction set invoiceId="${InvTblId}",paymentMethod="${paymentMenthod}",transactionId="${transactionid}",totalAmount="${amount}",paidAmount="${amount}",amex_order_Id="${invoiceid}" where id = "${transactionSqlRes[0].id}"`;
                await query(transactionupdateSql);
              } else {
                const InvoiceEx = await query(
                  `SELECT id, tuition_invoice_id, sales_order_id  FROM invoices where tuition_invoice_id = "${invoiceid}"`
                );
                const insertTransactionsql = `insert into transaction(invoiceId, sales_order_id, paymentMethod,transactionId,totalAmount,paidAmount,amex_order_Id)values("${InvoiceEx[0]?.id}", "${InvoiceEx[0]?.sales_order_id}","${paymentMenthod}","${transactionid}","${amount}","${amount}","${invoiceid}")`;
                const insertTransactionsqlReq = await query(
                  insertTransactionsql
                );
                const refrenceId = generateRefrenceNumber(
                  insertTransactionsqlReq?.insertId
                );
                const updateRefQuery = `update transaction set refrenceId = "${refrenceId}" where id="${insertTransactionsqlReq?.insertId}"`;
                const updateTransaction = await query(updateRefQuery);
              }
            }
          } else {
            var InsertSql = `INSERT INTO invoices (customerId,amount,status,createdDate,createdBy,invoiceDate,tuition_invoice_id,itemId) VALUES("${userID}","${amount}","${status}","${invoiceCreateDate}","${1}","${payExpect}","${invoiceid}","${itemtoinsert}")`;
            const insert = await query(InsertSql);
            await insertIvoiceItems(ItemsArr, insert?.insertId);
            if (paymentStatus === "Paid") {
              console.log(" not in db 1");
              const transactionSql = `select * from transaction where invoiceId = "${insert?.insertId}"`;
              const transactionSqlRes = await query(transactionSql);
              if (transactionSqlRes.length > 0) {
                console.log(" not in db 2");
                const transactionupdateSql = `update transaction set invoiceId="${insert?.insertId}",  paymentMethod="${paymentMenthod}",transactionId="${transactionid}",totalAmount="${amount}",paidAmount="${amount}",amex_order_Id="${invoiceid}" where id = "${transactionSqlRes[0].id}" `;
                await query(transactionupdateSql);
              } else {
                console.log(" not in db 3");
                const insertTransactionsql = `insert into transaction(invoiceId,paymentMethod,transactionId,totalAmount,paidAmount,amex_order_Id)values("${insert?.insertId}" ,"${paymentMenthod}","${transactionid}","${amount}","${amount}","${invoiceid}")`;
                const insertTransactionsqlReq = await query(
                  insertTransactionsql
                );
                const refrenceId = generateRefrenceNumber(
                  insertTransactionsqlReq?.insertId
                );
                const updateRefQuery = `update transaction set refrenceId = "${refrenceId}" where id="${insertTransactionsqlReq?.insertId}"`;
                const updateTransaction = await query(updateRefQuery);
              }
            }

            if (status === "Pending") {
              //sending Emails Functionality
              //get invoice details
              const Getinvoice = await GetInvoiceDetails(insert?.insertId);
              //get invoice items details
              const invoice_items = await purchaseInvoiceItemasDetails(
                insert?.insertId
              );
              //get parents det
              let parent_det = null;
              if (Getinvoice[0].user_id && Getinvoice[0].cusromerparentid > 0) {
                parent_det = await CusromersParentDetails(
                  Getinvoice[0].cusromerparentid
                );
              }
              //generate user side invoice pdf
              await GenerateUserSideInvoicePdf(
                Getinvoice,
                invoice_items,
                parent_det,
                (identifier = "inv_create_time_send_pdf_email")
              );
              //send emails
              const hh = await InvoiceEmailFormat(
                Getinvoice,
                invoice_items,
                parent_det
              );
              sendEmails(
                Getinvoice[0].email1,
                "Invoice Details From QIS✔",
                hh,
                (title = "INVOICE")
              );
            }
          }
        }
      } catch (error) {
        console.log("error", error);
        return error.message;
      }

      /////////////////////////////////////////////////////////////////////////////////////////////
      if (paymentStatus === "Partially Paid") {
        status = "Partially paid";
      }
      try {
        if (invoiceItem && userID) {
          if (alreadyinvoicesInDB.includes(sageIntacctinvoicesId[j])) {
            var updateSql = `UPDATE invoices SET customerId = "${userID}",tuition_invoice_id = "${invoiceid}", amount="${amount}",status="${status}", itemId="${itemtoinsert}" WHERE tuition_invoice_id = "${invoiceid}"`;
            const update = await query(updateSql);
            await insertIvoiceItems(ItemsArr, InvTblId);
            if (paymentStatus === "Partially Paid") {
              const transactionSql = `select id from transaction where invoiceId = "${InvTblId}"`;
              const transactionSqlRes = await query(transactionSql);
              if (transactionSqlRes.length > 0) {
                console.log(" already in db paid 1");
                const transactionupdateSql = `update transaction set invoiceId="${InvTblId}",paymentMethod="${paymentMenthod}",transactionId="${transactionid}",totalAmount="${amount}",paidAmount="${amount}",amex_order_Id="${invoiceid}" where id = "${transactionSqlRes[0].id}"`;
                await query(transactionupdateSql);
              } else {
                const InvoiceEx = await query(
                  `SELECT id, tuition_invoice_id, sales_order_id  FROM invoices where tuition_invoice_id = "${invoiceid}"`
                );
                const insertTransactionsql = `insert into transaction(invoiceId, sales_order_id, paymentMethod,transactionId,totalAmount,paidAmount,amex_order_Id)values("${InvoiceEx[0]?.id}", "${InvoiceEx[0]?.sales_order_id}","${paymentMenthod}","${transactionid}","${amount}","${amount}","${invoiceid}")`;
                const insertTransactionsqlReq = await query(
                  insertTransactionsql
                );
                const refrenceId = generateRefrenceNumber(
                  insertTransactionsqlReq?.insertId
                );
                const updateRefQuery = `update transaction set refrenceId = "${refrenceId}" where id="${insertTransactionsqlReq?.insertId}"`;
                const updateTransaction = await query(updateRefQuery);
              }
            }
          } else {
            var InsertSql = `INSERT INTO invoices (customerId,amount,status,createdDate,createdBy,invoiceDate,tuition_invoice_id,itemId) VALUES("${userID}","${amount}","${status}","${invoiceCreateDate}","${1}","${payExpect}","${invoiceid}","${itemtoinsert}")`;
            const insert = await query(InsertSql);
            await insertIvoiceItems(ItemsArr, insert?.insertId);
            if (paymentStatus === "Partially Paid") {
              const transactionSql = `select * from transaction where invoiceId = "${insert?.insertId}"`;
              const transactionSqlRes = await query(transactionSql);
              if (transactionSqlRes.length > 0) {
                const transactionupdateSql = `update transaction set invoiceId="${insert?.insertId}",  paymentMethod="${paymentMenthod}",transactionId="${transactionid}",totalAmount="${amount}",paidAmount="${amount}",amex_order_Id="${invoiceid}" where id = "${transactionSqlRes[0].id}" `;

                await query(transactionupdateSql);
              } else {
                const insertTransactionsql = `insert into transaction(invoiceId,paymentMethod,transactionId,totalAmount,paidAmount,amex_order_Id)values("${insert?.insertId}" ,"${paymentMenthod}","${transactionid}","${amount}","${amount}","${invoiceid}")`;

                const insertTransactionsqlReq = await query(
                  insertTransactionsql
                );
                const refrenceId = generateRefrenceNumber(
                  insertTransactionsqlReq?.insertId
                );
                const updateRefQuery = `update transaction set refrenceId = "${refrenceId}" where id="${insertTransactionsqlReq?.insertId}"`;
                const updateTransaction = await query(updateRefQuery);
              }
            }
            // if (status === "Pending") {
            //   //sending Emails Functionality
            //   //get invoice details
            //   const Getinvoice = await GetInvoiceDetails(insert?.insertId);
            //   //get invoice items details
            //   const invoice_items = await purchaseInvoiceItemasDetails(
            //     insert?.insertId
            //   );
            //   //get parents det
            //   let parent_det = null;
            //   if (Getinvoice[0].user_id && Getinvoice[0].cusromerparentid > 0) {
            //     parent_det = await CusromersParentDetails(
            //       Getinvoice[0].cusromerparentid
            //     );
            //   }
            //   //generate user side invoice pdf
            //   await GenerateUserSideInvoicePdf(
            //     Getinvoice,
            //     invoice_items,
            //     parent_det,
            //     (identifier = "inv_create_time_send_pdf_email")
            //   );
            //   //send emails
            //   const hh = await InvoiceEmailFormat(
            //     Getinvoice,
            //     invoice_items,
            //     parent_det
            //   );
            //   sendEmails(
            //     Getinvoice[0].email1,
            //     "Invoice Details From QIS✔",
            //     hh,
            //     (title = "INVOICE")
            //   );
            // }
          }
        }
      } catch (error) {
        console.log("error", error);
        return error.message;
      }
      ////////////////////////////////////////////////////////////////////////////////////////////////
    }
    res.status(200).send("OK");
  } catch (error) {
    console.log("error", error);
    return error.message;
  }
}

async function insertIvoiceItems(invoiceItems, invoiceId) {
  await query(`DELETE FROM invoice_items WHERE invoice_id = "${invoiceId}"`);
  for (var i = 0; i < invoiceItems.length; i++) {
    await query(
      `INSERT INTO invoice_items( invoice_id, item_id, item_name, item_description, item_unit, quantity, item_price, item_total_price, itemId, product_line_id) VALUES ("${invoiceId}","${invoiceItems[i].item_id}","${invoiceItems[i].itemName}", "${invoiceItems[i].itemDesc}","${invoiceItems[i].itemUnit}","${invoiceItems[i].itemQty}","${invoiceItems[i].itemPrice}","${invoiceItems[i].itemTotal}","${invoiceItems[i].itemId}","${invoiceItems[i].produdt_line_id}")`
    );
  }
}

async function deleteUnitOfMesurements(recordNo, req, res) {
  try {
    await query(`DELETE FROM unitofmeasure WHERE record_no = "${recordNo}"`);
    res.status(200).send("Ok");
  } catch (error) {
    console.log(error);
    return error.message;
  }
}

async function manageUnitOfMesurements(sageData, req, res) {
  try {
    console.log("sageData.length", sageData.length);
    if (sageData.length > 0) {
      for (var j = 0; j < sageData.length; j++) {
        console.log("sageData", sageData[j].RECORDNO);

        const unitEx = await query(
          `SELECT id FROM unitofmeasure where record_no=${sageData[j].RECORDNO}`
        );
        console.log("unitEx", unitEx);
        if (unitEx.length > 0) {
          await query(
            `UPDATE unitofmeasure SET name="${sageData[j].NAME}",is_system="${sageData[j].ISSYSTEM}",record_no="${sageData[j].RECORDNO}",podefaultkey="${sageData[j].PODEFUNITKEY}",sodefaultkey="${sageData[j].SODEFUNITKEY}",invuom="${sageData[j].INVUOM}",pouom="${sageData[j].POUOM}",oeuom="${sageData[j].OEUOM}" WHERE id="${unitEx[0].id}"`
          );
        } else {
          await query(
            `INSERT INTO unitofmeasure (name, is_system, record_no, podefaultkey, sodefaultkey, invuom, pouom, oeuom) VALUES ("${sageData[j].NAME}", "${sageData[j].ISSYSTEM}", "${sageData[j].RECORDNO}", "${sageData[j].PODEFUNITKEY}", "${sageData[j].SODEFUNITKEY}", "${sageData[j].INVUOM}", "${sageData[j].POUOM}", "${sageData[j].OEUOM}")`
          );
        }
      }
      res.status(200).send("Ok");
    }
  } catch (error) {
    console.log("ERROR", error);
    return error.message;
  }
}

generateRefrenceNumber = (DBTransactionId) => {
  let gId = `${DBTransactionId.toString()}`;
  let tempRef = "RCT-000000000";
  let refrenceNumber = tempRef.slice(0, -gId.length);
  let finalGeneratedRefrenceNumber = refrenceNumber + gId;

  return finalGeneratedRefrenceNumber;
};

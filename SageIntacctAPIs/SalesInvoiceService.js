const { client, IA } = require("./IntacctClient");
const mysqlconnection = require("../DB/db.config.connection");
const util = require("util");

const query = util.promisify(mysqlconnection.query).bind(mysqlconnection);
module.exports = {
  createSalesInvoice: async (data) => {
    try {
      const itemIds = data.itemId;
      const itemQuantity = data.quantity;
      if (itemIds.length != itemQuantity.length) {
        return "please provide the quantity for each item !";
      }
      let record = new IA.Functions.OrderEntry.OrderEntryTransactionCreate();
      record.transactionDefinition = "Sales Invoice";
      record.transactionDate = new Date(data.createDate); //"2/15/2023"
      record.dateDue = new Date(data.createDate); //"2/15/2023"
      record.customerId = data.customerId; //10003
      record.createdFrom = "Sales Order-" + data.sageSOid;
      var lines = [];
      for (var i = 0; i < itemIds.length; i++) {
        lines.push(`line${i}`);
      }
      for (var j = 0; j < itemIds.length; j++) {
        lines[j] =
          new IA.Functions.OrderEntry.OrderEntryTransactionLineCreate();
        lines[j].itemId = itemIds[j]; //"CSS1003"
        lines[j].quantity = itemQuantity[j]; // 2
        lines[j].locationId = "100--USA1";
        lines[j].unit = "Each";
      }
      record.lines = lines;
      const createResponse = await client.execute(record).catch((error) => {
        console.log("error", error);
        return error.message;
      });
      const createResult = createResponse.getResult();
      return createResult;
    } catch (error) {
      return error.message;
    }
  },

  updateSalesInvoice: async (data) => {
    try {
      const itemIds = data.itemId.split(",");
      const itemQuantity = data.quantity.split(",");
      let record = new IA.Functions.OrderEntry.OrderEntryTransactionUpdate();
      record.transactionId = `Sales Invoice-${data.invoiceID}`;
      record.transactionDefinition = "Sales Invoice";
      // record.transactionDate = new Date("2/15/2023");
      record.dueDate = new Date(data.dueDate); //"02/24/2027"
      record.customerId = data.customerId; //"10003";
      record.state = data.state; //"Closed ,pending"
      var lines = [];
      for (var i = 0; i < itemIds.length; i++) {
        lines.push(`line${i}`);
      }
      for (var j = 0; j < itemIds.length; j++) {
        var lineNo = parseInt(1 + j);
        lines[j] =
          new IA.Functions.OrderEntry.OrderEntryTransactionLineUpdate();
        lines[j].lineNo = lineNo;
        lines[j].itemId = itemIds[j]; //"CSS1003"
        lines[j].quantity = itemQuantity[j]; // 2
        lines[j].locationId = "100--USA1";
        lines[j].unit = "Each";
      }
      record.lines = lines;
      // const line1 = new IA.Functions.OrderEntry.OrderEntryTransactionLineUpdate();
      // line1.lineNo= 1
      // line1.itemId = "CSS1003";
      // line1.quantity =1;
      // line1.locationId="100--USA1"
      // line1.unit="Each"
      //  record.lines = [
      //     line1,
      // ];
      const createResponse = await client.execute(record);
      const createResult = createResponse.getResult();
      // res.send(createResult)
      return createResult;
    } catch (error) {
      // res.send(error.message);
      return error.message;
    }
  },

  deleteSalesInvoice: async (invoiceID) => {
    try {
      let record = new IA.Functions.OrderEntry.OrderEntryTransactionDelete();
      console.log("@@@@@@@@@@@", record);
      record.documentId = `Sales Invoice-${invoiceID}`;
      const createResponse = await client.execute(record);
      const createResult = createResponse.getResult();
      console.log("###########", createResult);
      return error.message;
    } catch (error) {
      // res.send(error.message);
      return error.message;
    }
  },

  getListOfSalesInovice: async (req, res) => {
    try {
      let limit = 1000;
      let salquery = new IA.Functions.Common.ReadByQuery();

      salquery.objectName = "SODOCUMENT"; // Keep the count to just 1 for the example
      salquery.pageSize = limit;

      salquery.docParId = "Sales Invoice";
      const response = await client.execute(salquery);
      const result = response.getResult();
      let json_data = result.data;

      const numPage = Math.ceil(result.totalCount / limit);

      await isSalesInvoiceExistInDB(json_data, req, res);
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
        await isSalesInvoiceExistInDB(resultMore.data, req, res);
      }
      res.status(200);
    } catch (error) {
      console.log(error);
      return error.message;
    }
  },

  getSalesInoviceBySmartEvent: async (req, res) => {
    try {
      // const Items_array = req.body.split("&");
      // let ItemsObj = {};
      // let ItemsArr = [];

      // for (var i = 0; i < Items_array.length; i++) {
      //   let Item = Items_array[i].split("=");

      //   if (Item.length == 2) {
      //     ItemsObj[Item[0]] = Item[1];
      //   }
      // }

      if (req.body) {
        let ItemsArr = [];
        ItemsArr.push(req.body);
        await isSalesInvoiceExistInDB(ItemsArr, req, res);
        res.status(200).send("OK");
      }
    } catch (error) {
      return error.message;
    }
  },
};

async function isSalesInvoiceExistInDB(sageIntacctInovice, req, res) {
  try {
    let alreadyinvoicesInDB = [];
    let sageIntacctinvoicesId = [];
    const alreadyDBInvoice = `SELECT invoiceId FROM invoices where invoiceId!="null" `;
    const DBinvoice = await query(alreadyDBInvoice);
    for (var k = 0; k < DBinvoice.length; k++) {
      alreadyinvoicesInDB.push(DBinvoice[k]["invoiceId"]);
    }
    for (var i = 0; i < sageIntacctInovice.length; i++) {
      sageIntacctinvoicesId.push(sageIntacctInovice[i]["DOCNO"]);
    }

    for (var j = 0; j < sageIntacctinvoicesId.length; j++) {
      const recordNo = sageIntacctInovice[j]["RECORDNO"];

      let read = new IA.Functions.Common.Read();
      read.objectName = "SODOCUMENT";
      read.keys = [recordNo]; // sales order not related 1913 // sales order related 3457

      const responsebyname = await client.execute(read);
      const invoiceResponse = responsebyname.getResult();
      const invoice = invoiceResponse?._data[0];

      const sageIntacctItemId = invoice["SODOCUMENTENTRIES"].sodocumententry;

      let invoiceItem = [];
      let ItemsArr = [];
      if (sageIntacctItemId.length) {
        for (var k = 0; k < sageIntacctItemId.length; k++) {
          const sId = sageIntacctItemId[k]["ITEMID"];
          const itemUnit = sageIntacctItemId[k]["UNIT"];
          const itemQty = sageIntacctItemId[k]["QUANTITY"];
          const itemPrice = sageIntacctItemId[k]["PRICE"];
          const itemTotal = sageIntacctItemId[k]["TOTAL"];
          const itemName = sageIntacctItemId[k]["ITEMNAME"];
          const itemDesc = sageIntacctItemId[k]["ITEMDESC"];
          const actualitemId = sId.split("--")[0];
          const queryforitemId = `select id, product_line_id from items where itemID = "${actualitemId}"`;
          const queryforitemIdResponse = await query(queryforitemId);
          if (queryforitemIdResponse.length > 0) {
            const itemid = queryforitemIdResponse[0]?.id;
            const productLineId = queryforitemIdResponse[0]?.product_line_id;
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
      } else {
        const sId = sageIntacctItemId.ITEMID;

        const actualitemId = sId.split("--")[0];

        const queryforitemId = `select id, product_line_id from items where itemID = "${actualitemId}"`;
        const queryforitemIdResponse = await query(queryforitemId);
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
      const CREATEDFROM = invoice["CREATEDFROM"]
        ? invoice["CREATEDFROM"].replace("Sales Order-", "")
        : "";

      const amount = invoice["TOTALENTERED"];
      let status = invoice["STATE"];
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

      const SalesOrderExits = await query(
        `SELECT id, invoiceId,sales_order_id  FROM invoices where sales_order_id = "${CREATEDFROM}"`
      );

      const InvoiceIdEx = await query(
        `SELECT id, invoiceId,sales_order_id  FROM invoices where invoiceId = "${invoiceid}"`
      );

      let InvoiceTblId = "";
      let SalesInvoiceId = "";
      let SalesOrderIdEx = "";
      try {
        if (SalesOrderExits.length > 0) {
          InvoiceTblId = SalesOrderExits[0].id;
          SalesInvoiceId = SalesOrderExits[0].invoiceId;
          SalesOrderIdEx = SalesOrderExits[0].sales_order_id;
        }

        let InvTblId = "";
        let SalesInvId = "";
        let SalesIdEx = "";

        if (InvoiceIdEx.length > 0) {
          InvTblId = InvoiceIdEx[0].id;
          SalesInvId = InvoiceIdEx[0].invoiceId;
          SalesIdEx = InvoiceIdEx[0].sales_order_id;
        }

        if (paymentStatus === "Paid") {
          status = "Paid";
        } else if (status === "Converted") {
          status = "Pending";
        }

        if (invoiceItem && userID) {
          if (alreadyinvoicesInDB.includes(sageIntacctinvoicesId[j])) {
            var updateSql = `UPDATE invoices SET customerId = "${userID}",invoiceId = "${invoiceid}", amount="${amount}",status="${status}", itemId="${itemtoinsert}", createdDate ="${invoiceCreateDate}", invoiceDate="${payExpect}"  WHERE invoiceId = "${invoiceid}"`;
            const update = await query(updateSql);

            await insertIvoiceItems(ItemsArr, InvTblId);

            if (paymentStatus === "Paid") {
              const transactionSql = `select id from transaction where invoiceId = "${InvTblId}"`;
              const transactionSqlRes = await query(transactionSql);
              if (transactionSqlRes.length > 0) {
                const transactionupdateSql = `update transaction set invoiceId="${InvTblId}",paymentMethod="${paymentMenthod}",transactionId="${transactionid}",totalAmount="${amount}",paidAmount="${amount}",amex_order_Id="${invoiceid}" where id = "${transactionSql[0].id}"`;
                await query(transactionupdateSql);
              } else {
                const InvoiceEx = await query(
                  `SELECT id, invoiceId, sales_order_id  FROM invoices where invoiceId = "${invoiceid}"`
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
            if (SalesInvoiceId === null) {
              var updateSql = `UPDATE invoices SET customerId = "${userID}",invoiceId = "${invoiceid}", amount="${amount}",status="${status}", itemId="${itemtoinsert}", createdDate ="${invoiceCreateDate}", invoiceDate="${payExpect}"  WHERE id = "${InvoiceTblId}"`;
              const update = await query(updateSql);

              await insertIvoiceItems(ItemsArr, InvoiceTblId);

              if (paymentStatus === "Paid") {
                const transactionSql = `select * from transaction where invoiceId = "${InvTblId}"`;
                const transactionSqlRes = await query(transactionSql);
                if (transactionSqlRes.length > 0) {
                  const transactionupdateSql = `update transaction set invoiceId="${InvTblId}",paymentMethod="${paymentMenthod}",transactionId="${transactionid}",totalAmount="${amount}",paidAmount="${amount}",amex_order_Id="${invoiceid}"`;
                  await query(transactionupdateSql);
                } else {
                  const InvoiceEx = await query(
                    `SELECT id, invoiceId, sales_order_id  FROM invoices where invoiceId = "${invoiceid}"`
                  );

                  const insertTransactionsql = `insert into transaction(invoiceId, sales_order_id, paymentMethod,transactionId,totalAmount,paidAmount,amex_order_Id)values("${InvoiceEx[0]?.id}", "${InvoiceEx[0]?.isales_order_id}","${paymentMenthod}","${transactionid}","${amount}","${amount}","${invoiceid}")`;
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
              var InsertSql = `INSERT INTO invoices (customerId,amount,status,createdDate,createdBy,invoiceDate,invoiceId,itemId) VALUES("${userID}","${amount}","${status}","${invoiceCreateDate}","${1}","${payExpect}","${invoiceid}","${itemtoinsert}")`;
              const insert = await query(InsertSql);
              await insertIvoiceItems(ItemsArr, insert?.insertId);
              if (paymentStatus === "Paid") {
                const transactionSql = `select * from transaction where invoiceId = "${insert.insertId}"`;

                const transactionSqlRes = await query(transactionSql);
                if (transactionSqlRes.length > 0) {
                  const transactionupdateSql = `update transaction set invoiceId="${insert?.insertId}", sales_order_id = "${CREATEDFROM}",  paymentMethod="${paymentMenthod}",transactionId="${transactionid}",totalAmount="${amount}",paidAmount="${amount}",amex_order_Id="${invoiceid}"`;

                  await query(transactionupdateSql);
                } else {
                  const insertTransactionsql = `insert into transaction(invoiceId,sales_order_id,paymentMethod,transactionId,totalAmount,paidAmount,amex_order_Id)values("${insert?.insertId}", "${CREATEDFROM}" ,"${paymentMenthod}","${transactionid}","${amount}","${amount}","${invoiceid}")`;

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
                //sending emails
              }
            }
          }
        }
      } catch (error) {
        console.log("error", error);
        return error.message;
      }
    }
    res.status(200).send("OK");
  } catch (error) {
    console.log("error", error);
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

async function insertIvoiceItems(invoiceItems, invoiceId) {
  await query(`DELETE FROM invoice_items WHERE invoice_id = "${invoiceId}"`);
  for (var i = 0; i < invoiceItems.length; i++) {
    await query(
      `INSERT INTO invoice_items( invoice_id, item_id, item_name, item_description, item_unit, quantity, item_price, item_total_price, itemId,product_line_id) VALUES ("${invoiceId}","${invoiceItems[i].item_id}","${invoiceItems[i].itemName}", "${invoiceItems[i].itemDesc}","${invoiceItems[i].itemUnit}","${invoiceItems[i].itemQty}","${invoiceItems[i].itemPrice}","${invoiceItems[i].itemTotal}","${invoiceItems[i].itemId}","${invoiceItems[i].produdt_line_id}")`
    );
  }
}

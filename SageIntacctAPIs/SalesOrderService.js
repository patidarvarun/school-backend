const { client, IA } = require("./IntacctClient");
const mysqlconnection = require("../DB/db.config.connection");
const util = require("util");
const SalesTemplate = require("../Controllers/Helper/templates/SalesOrderTemplete");
const sendEmails = require("../Controllers/Helper/sendEmails");
const {
  GetSalesOrderDetails,
  purchaseInvoiceItemasDetails,
  GetInvoiceDetails,
  CusromersParentDetails,
} = require("../commonFunction/commonControllerFunction");
const {
  GenerateUserSideInvoicePdf,
} = require("../Controllers/Helper/invoicepdf");
const InvoiceEmailFormat = require("../Controllers/Helper/templates/InvoiceEmailTemp");

const query = util.promisify(mysqlconnection.query).bind(mysqlconnection);
module.exports = {
  createSalesOrder: async (data) => {
    try {
      let record = new IA.Functions.OrderEntry.OrderEntryTransactionCreate();
      record.transactionDefinition = "Sales Order";
      record.transactionDate = new Date(data.transactionDate); //"2/15/2023"
      record.dueDate = new Date(data.transactionDate);
      record.customerId = data.customerId; // "10003";

      const line1 =
        new IA.Functions.OrderEntry.OrderEntryTransactionLineCreate();
      line1.itemId = data.itemId; //"CSS1003";
      line1.quantity = data.itemQty;
      line1.locationId = "100--USA1";
      line1.unit = data.itemUnit;
      line1.price = data.itemPrice;
      line1.itemDescription = data.itemDesc;
      record.lines = [line1];
      const createResponse = await client.execute(record);
      const createResult = createResponse.getResult();

      // res.send(createResult)
      return createResult;
    } catch (error) {
      console.log("Error", error);
      return error.message;
    }
  },

  updateSalesOrder: async (data) => {
    try {
      let record = new IA.Functions.OrderEntry.OrderEntryTransactionUpdate();
      record.transactionId = `Sales Order-${data.transactionId}`;
      record.transactionDefinition = "Sales Order";
      // record.transactionDate = new Date("2/15/2023");
      record.dueDate = new Date("02/24/2027");
      record.customerId = data.customerId; //"10003";
      record.state = data.state; //"Closed";
      const line1 =
        new IA.Functions.OrderEntry.OrderEntryTransactionLineUpdate();
      line1.lineNo = 1;
      line1.itemId = data.itemId; //"CSS1003";
      line1.quantity = 1;
      line1.locationId = "100--USA1";
      line1.unit = "Each";
      record.lines = [line1];
      const createResponse = await client.execute(record);
      const createResult = createResponse.getResult();

      // res.send(createResult)
      return createResult;
    } catch (error) {
      // res.send(error.message);
      return error.message;
    }
  },
  deleteSageIntacctSalesOrder: async (documentId) => {
    try {
      let record = new IA.Functions.OrderEntry.OrderEntryTransactionDelete();
      record.documentId = `Sales Order-${documentId}`;
      const createResponse = await client.execute(record).catch((error) => {
        res.send(error.message);
      });
      const createResult = createResponse.getResult();

      return createResult;
    } catch (error) {
      return error.message;
    }
  },
  getListOfSalesOrder: async (req, res) => {
    try {
      let limit = 1000;
      let sagquery = new IA.Functions.Common.ReadByQuery();
      sagquery.objectName = "SODOCUMENT"; // Keep the count to just 1 for the example
      sagquery.pageSize = limit;
      sagquery.docParId = "Sales Order";
      const response = await client.execute(sagquery);
      const result = response.getResult();
      let json_data = result.data;

      const numPage = Math.ceil(result.totalCount / limit);

      await isSalesOrderExistInDB(json_data, req, res);
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

        await isSalesOrderExistInDB(resultMore.data, req, res);
      }

      res.status(200);
    } catch (error) {
      res.status(400).send({
        error: error.message,
      });
    }
  },

  getSalesOrderBySmartEvent: async (req, res) => {
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

      // ItemsArr.push(ItemsObj);

      if (req.body) {
        let ItemsArr = [];

        ItemsArr.push(req.body);

        await isSalesOrderExistInDB(ItemsArr, req, res);
        res.status(200).send("OK");
      }
    } catch (error) {
      return error.message;
    }
  },
};

async function isSalesOrderExistInDB(sageIntacctorders, req, res) {
  try {
    let alreadyordersInDB = [];
    let sageIntacctordersId = [];

    const alreadyDBorderQuery = `SELECT sales_order_Id FROM invoices`;
    const DBorder = await query(alreadyDBorderQuery);
    for (var k = 0; k < DBorder.length; k++) {
      alreadyordersInDB.push(DBorder[k]["sales_order_Id"]);
    }

    for (var i = 0; i < sageIntacctorders.length; i++) {
      sageIntacctordersId.push(sageIntacctorders[i]["DOCNO"]);
    }

    for (var j = 0; j < sageIntacctordersId.length; j++) {
      const recordNo = sageIntacctorders[j]["RECORDNO"];
      let read = new IA.Functions.Common.Read();
      read.objectName = "SODOCUMENT";
      read.keys = [recordNo];

      const responsebyname = await client.execute(read);
      const orderResponse = responsebyname.getResult();
      const salesOrder = orderResponse?._data[0];

      let userID;
      const queryUserId = `select userId from customers where customerId = "${salesOrder["CUSTVENDID"]}"`;
      const userIdResponse = await query(queryUserId);
      if (userIdResponse.length > 0) {
        userID = userIdResponse[0]?.userId;
      } else {
        const queryUserId = `select userId from parents where parentId = "${salesOrder["CUSTVENDID"]}"`;
        const userIdResponse = await query(queryUserId);
        userID = userIdResponse[0]?.userId;
      }
      let status = salesOrder["STATE"];
      const amount = salesOrder["TOTAL"];
      const sales_order_Id = salesOrder["DOCNO"];
      const createdBy = salesOrder["CREATEDBY"];
      const paymentExpectDate = salesOrder["WHENDUE"];
      const createdDate = salesOrder["WHENCREATED"]; //27/03/2023
      const updateby = salesOrder["MODIFIEDBY"];
      const fromateDate = createdDate?.split("-");
      const invoiceCreateDate = `${fromateDate[2]}/${fromateDate[1]}/${fromateDate[0]}`;
      const dueDate = paymentExpectDate?.split("-");
      const payExpect = `${dueDate[2]}/${dueDate[1]}/${dueDate[0]}`;
      let sageIntacctItemId = salesOrder["SODOCUMENTENTRIES"].sodocumententry;

      let itemId = "";
      let ItemsArr = [];
      let itemIds = [];
      if (sageIntacctItemId.length > 0) {
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
            itemIds.push(itemid);
          }
        }
      } else {
        let sageIntacctItemId =
          salesOrder["SODOCUMENTENTRIES"].sodocumententry["ITEMID"];
        const actualitemId = sageIntacctItemId.split("--")[0];
        console.log("actualitemId", actualitemId);
        const queryforActivityId = `select id, product_line_id from items where itemID = "${actualitemId}"`;
        const queryforActivityIdResponse = await query(queryforActivityId);
        const itemid = queryforActivityIdResponse[0]?.id;
        const productLineId = queryforActivityIdResponse[0]?.product_line_id;
        const itemUnit =
          salesOrder["SODOCUMENTENTRIES"].sodocumententry["UNIT"];
        const itemQty =
          salesOrder["SODOCUMENTENTRIES"].sodocumententry["QUANTITY"];
        const itemPrice =
          salesOrder["SODOCUMENTENTRIES"].sodocumententry["PRICE"];
        const itemTotal =
          salesOrder["SODOCUMENTENTRIES"].sodocumententry["TOTAL"];
        const itemName =
          salesOrder["SODOCUMENTENTRIES"].sodocumententry["ITEMNAME"];
        const itemDesc =
          salesOrder["SODOCUMENTENTRIES"].sodocumententry["ITEMDESC"];
        const itemId = actualitemId;
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
        itemIds.push(itemid);
      }
      itemId = itemIds.map((e, i) => e + ",").join("");
      itemId = itemId.slice(0, -1);
      const InvoiceIdEx = await query(
        `SELECT id, tuition_invoice_id ,sales_order_id  FROM invoices where sales_order_Id = "${sales_order_Id}"`
      );
      let InvTblId = "";

      if (InvoiceIdEx.length > 0) {
        InvTblId = InvoiceIdEx[0].id;
      }
      if (status === "Converted") {
        status = "Pending";
      }
      if (itemId && userID) {
        if (alreadyordersInDB.includes(sageIntacctordersId[j])) {
          var updateSql = `update invoices set amount = "${amount}",status = "${status}", customerId = "${userID}", updatedBy="${1}",itemId="${itemId}", createdDate ="${invoiceCreateDate}", invoiceDate="${payExpect}" where sales_order_Id = "${sales_order_Id}"`;
          const update = await query(updateSql);
          await insertIvoiceItems(ItemsArr, InvTblId);
          //get invoice id after updated
          var getSql = `select  invoices.id from invoices where sales_order_Id = "${sales_order_Id}"`;
          const getinvid = await query(getSql);
          //get invoice details
          const Getinvoice = await GetInvoiceDetails(getinvid[0]?.id);
          // get purchase items after inserted items
          const invoice_items = await purchaseInvoiceItemasDetails(
            getinvid[0]?.id
          );
          //get parents details
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
        } else {
          var InsertSql = `INSERT INTO invoices (amount,status,customerId,sales_order_Id,createdBy,itemId,createdDate,invoiceDate)VALUES("${amount}","${status}","${userID}","${sales_order_Id}","1","${itemId}","${invoiceCreateDate}","${payExpect}")`;
          const insert = await query(InsertSql);
          await insertIvoiceItems(ItemsArr, insert?.insertId);
          //sending emails
          //get sales order details
          const SalesOrderDet = await GetSalesOrderDetails(insert?.insertId);
          //get items details
          const invoice_items = await purchaseInvoiceItemasDetails(
            insert?.insertId
          );
          const hh = await SalesTemplate(SalesOrderDet, invoice_items);
          sendEmails(
            SalesOrderDet[0]?.email1,
            "Sales Order Details From QIS✔",
            hh
          );
          sendEmails(
            process.env.SMTP_TO_EMAIL,
            "Sales Order Details From QIS✔",
            hh
          );
        }
      }
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

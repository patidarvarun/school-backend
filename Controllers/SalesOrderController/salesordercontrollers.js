const express = require("express");
const app = express();
const mysqlconnection = require("../../DB/db.config.connection");
const {
  createSalesOrder,
  deleteSageIntacctSalesOrder,
  updateSalesOrder,
} = require("../../SageIntacctAPIs/SalesOrderService");
const moment = require("moment");
const SalesTemplate = require("../Helper/templates/SalesOrderTemplete");
const sendEmails = require("../Helper/sendEmails");
const util = require("util");
const {
  GetSalesOrderDetails,
  purchaseInvoiceItemasDetails,
} = require("../../commonFunction/commonControllerFunction");
const {
  migrateEmailToHubSpot,
} = require("../../hubSpotContacts/hubSpotContacts");
const query = util.promisify(mysqlconnection.query).bind(mysqlconnection);

module.exports = {
  //create  Sales controller
  addSalesOrder: async (req, res) => {
    const {
      amount,
      status,
      customerId,
      itemId,
      createdBy,
      createdDate,
      invoiceDate,
    } = req.body;
    var sql = `INSERT INTO invoices (amount,amount_due,status,customerId,itemId,createdBy,createdDate,invoiceDate)VALUES("${amount}","${amount}","${status}","${customerId}","${itemId}","${createdBy}","${createdDate}","${invoiceDate}")`;
    mysqlconnection.query(sql, async function (err, result) {
      if (err) throw err;
      //get customer details
      const queryForCustomeDet = `SELECT name, email1 FROM users where id = "${customerId}"`;
      customerResponse = await query(queryForCustomeDet);
      //get customers id
      const queryForCustomerId = `SELECT customerId FROM customers where userId = "${customerId}"`;
      const customerIdQueryResponse = await query(queryForCustomerId);
      let sagecustomerID = "";
      if (customerIdQueryResponse.length > 0) {
        sagecustomerID = customerIdQueryResponse[0]?.customerId;
      } else {
        //get parent id
        const queryForCustomerIdfromparent = `SELECT parentId FROM parents where userId = "${customerId}"`;
        const responseofParent = await query(queryForCustomerIdfromparent);
        sagecustomerID = responseofParent[0].parentId;
      }
      //get item id
      const queryForItemID = `SELECT id, name, price, itemID, description, short_description, product_line_id FROM items where id = ${itemId}`;
      const itemId1 = await query(queryForItemID);

      let objectDate = new Date();
      let transactionDate =
        objectDate.getMonth() +
        1 +
        "/" +
        objectDate.getDate() +
        "/" +
        objectDate.getFullYear();
      const data = {
        customerId: sagecustomerID,
        transactionDate: transactionDate,
        itemId: itemId1[0]?.itemID,
        itemName: itemId1[0]?.name,
        itemDesc: itemId1[0]?.short_description,
        itemUnit: "Each",
        itemQty: 1,
        itemPrice: itemId1[0]?.price,
        itemTotal: itemId1[0]?.price,
      };
      await query(
        `INSERT INTO invoice_items(invoice_id, item_id, item_name, item_description, item_unit, quantity, item_price, item_total_price, itemId, product_line_id) VALUES ("${result.insertId}","${itemId1[0]?.id}","${itemId1[0]?.name}","${itemId1[0]?.short_description}","Each","1","${itemId1[0]?.price}","${itemId1[0]?.price}","${itemId1[0]?.itemID}","${itemId1[0]?.product_line_id}")`
      );
      const sageIntacctSalesOrder = await createSalesOrder(data);
      const SalesorderId = sageIntacctSalesOrder._key;
      const sageIntacctorderID = SalesorderId?.split("-")[1];
      const updateSql = `UPDATE invoices SET sales_order_Id = "${sageIntacctorderID}" WHERE id="${result.insertId}"`;
      await query(updateSql);

      //get sales order details
      const SalesOrderDet = await GetSalesOrderDetails(result.insertId);
      //get items details
      const invoice_items = await purchaseInvoiceItemasDetails(result.insertId);

      const hh = await SalesTemplate(SalesOrderDet, invoice_items);
      sendEmails(
        customerResponse[0]?.email1,
        "Activites Details From QIS✔",
        hh
      );
      // sendEmails(
      //   process.env.SMTP_TO_EMAIL,
      //   "Sales Order Details From QIS✔",
      //   hh
      // );
      res.status(200).json({
        message: "Data inserted successfully",
        data: result,
        sageIntacctorderID: sageIntacctorderID,
      });
      //res.status(200).json({ message: "send invoice email successfully" });
      //add activity logs in hubspot
      const emaildata = {
        userid: sagecustomerID,
        email: customerResponse[0]?.email1,
        subject: "Sales Order Details From QIS✔",
        bodyofemail: hh,
      };
      await migrateEmailToHubSpot(emaildata);
    });
  },

  //get sales Order controller
  getSalesOrder: (req, res) => {
    var sql = `SELECT invoices.id, invoices.amount, invoices.status,invoices.isDeleted,invoices.sales_order_Id,
    invoices.invoiceId, invoices.createdDate, items.name as activitesname, users.name, users.email1
    from invoices left outer join users on users.id = invoices.customerId left outer join items on items.id = invoices.itemId where invoices.sales_order_id != ""`;
    mysqlconnection.query(sql, function (err, result) {
      if (err) throw err;
      res.status(200).json({ message: "ok", data: result });
    });
  },

  //get sales details controller
  getSalesDetails: (req, res) => {
    const id = req.params.id;
    var sql = `SELECT invoices.id, invoices.amount, invoices.status, invoices.isRequested, invoices.customerId, users.name
    as username, users.email1 as useremail, users.phone1 as userphone1, users.createdAt, invoices.itemId,
    customers.customerId as sageCustomerId, invoices.sales_order_id,
    parents.parentId as sageParentId 
    from invoices
    INNER JOIN users ON users.id = invoices.customerId 
    left outer join customers on customers.userId = users.id 
    left outer join parents on parents.userId = users.id where invoices.id = ${id}`;
    mysqlconnection.query(sql, function (err, result) {
      if (err) {
        throw err;
      } else {
        res.status(200).json({ message: "ok", data: result });
      }
    });
  },

  getActivityViewSales: (req, res) => {
    const id = req.params.id;
    var sql = `SELECT items.name as activityname, invoices.status, invoices.amount, invoices.createdDate, invoices.sales_order_Id, invoices.id  FROM invoices INNER JOIN items ON items.id = invoices.itemId where customerId in(${id}) and sales_order_Id != "" and invoices.status = 'Paid' ORDER BY invoices.createdDate desc`;
    mysqlconnection.query(sql, function (err, result) {
      if (err) {
        throw err;
      } else {
        res.status(200).json({ message: "ok", data: result });
      }
    });
  },

  //edit sales controller
  editSalesOrder: (req, res) => {
    const id = req.params.id;
    const { amount, status, userId, activityId, orderId, updatedBy } = req.body;

    const updt_query = `update sales_order set amount = "${amount}",status = "${status}", userId = ${userId}, activityId = "${activityId}", orderId = "${orderId}",updatedBy="${updatedBy}" where id = ${id}`;
    mysqlconnection.query(updt_query, async function (err, result) {
      if (err) throw err;

      const queryForCustomerId = `SELECT customerId FROM customers where userId = "${userId}"`;
      const customerIdQueryResponse = await query(queryForCustomerId);

      var salesOrderSql = `SELECT transactionId FROM  sales_order where id = "${id}"`;
      const sageIntacctsalesorderId = await query(salesOrderSql);
      const salesOrderID = sageIntacctsalesorderId[0]["transactionId"];

      const queryForItemID = `SELECT itemID FROM items where activityId = "${activityId}"`;
      const itemId = await query(queryForItemID);

      const data = {
        transactionId: salesOrderID,
        customerId: customerIdQueryResponse[0].customerId,
        itemId: itemId[0].itemID,
        state: status === 0 ? "Closed" : "pending",
      };
      console.log("data =>", data);
      const sageIntacctInvoice = await updateSalesOrder(data);
      res
        .status(200)
        .json({ message: "data updated successfully", data: result });
    });
  },

  //delete sales controller
  deleteSalesOrder: (req, res) => {
    const id = req.params.id;
    var sql = `update sales_order set isDeleted = 1 where id = ${id}`;
    mysqlconnection.query(sql, async function (err, result) {
      if (err) throw err;
      const queryForGetTransactionID = `SELECT transactionId FROM  sales_order where id = "${id}"`;
      const transactionIdResponse = await query(queryForGetTransactionID);
      const SageIntacctSalesOrder = await deleteSageIntacctSalesOrder(
        transactionIdResponse[0].transactionId
      );
      res.status(200).json({
        message: "Data deleted successfully",
        response: result,
        deleteid: transactionIdResponse[0].transactionId,
      });
    });
  },

  //get sales order by user id
  getSalesOrderByUserId: (req, res) => {
    const user_id = req.params.id;
    var sql = `SELECT invoices.id, invoices.customerId, invoices.amount, invoices.status, invoices.sales_order_id, invoices.tuition_invoice_id,
    invoices.invoiceId, invoices.isRequested, users.name, items.name as actname, invoices.itemId, transaction.refrenceId, 
    transaction.paymentMethod, transaction.createdAt as transactionDate, transaction.paidAmount as transactionAmount
    from invoices
    inner join items on items.id = invoices.itemId
    left outer join users on users.id = invoices.customerId 
    left outer join transaction on transaction.invoiceId = invoices.id
    where invoices.customerId in(${user_id}) and invoices.sales_order_id != "" `;
    mysqlconnection.query(sql, function (err, result) {
      if (err) throw err;
      res.status(200).json({ message: "ok", data: result });
    });
  },
};

const util = require("util");
const mysqlconnection = require("../DB/db.config.connection");
const query = util.promisify(mysqlconnection.query).bind(mysqlconnection);
module.exports = {
  CBQController: async (req, res) => {

    var amount = new RegExp("&auth_amount=(.*)&auth_response");
    var amount1 = req.body.match(amount);

    var reference = new RegExp(
      "&req_reference_number=(.*)&req_bill_to_address_state"
    );
    var referenceId = req.body.match(reference);

    var transaction = new RegExp("&transaction_id=(.*)&req_card_type");
    var transactionid = req.body.match(transaction);

    let totalAmount = amount1[1];
    let paidAmount = amount1[1];
    let transactionId = transactionid[1];
    let amexorderId = transactionid[1];
    let paymentMethod = "CBQ";
    let idForPayment = referenceId[1];
    let creditNotesId = null;
    let sales_order_Id = null;

      const invoiceID= `SELECT id FROM invoices where invoiceId="${idForPayment}"`;
      const invoiceidd = await query(invoiceID);

    if (!transactionId || !amexorderId || !paymentMethod || !idForPayment) {
      res.status(400).send({ message: "All field is required" });
      return;
    }
    const firstTwoChars = idForPayment.slice(0, 2);
    if (firstTwoChars === "SO") {
      const salesOrderID = `select id from sales_order where transactionId = "${idForPayment}"`;
      const salesOrderResponse = await query(salesOrderID);

      if (salesOrderResponse.length === 0) {
        res
          .status(201)
          .send({ message: "sales order transactionId not found !" });
        return;
      }
      const transactionInsertQuery = `insert into transaction (sales_order_Id,paymentMethod ,transactionId,totalAmount,paidAmount,amex_order_Id,creditNotesId) values(${salesOrderResponse[0].id},"${paymentMethod}","${transactionId}",${totalAmount},${paidAmount},"${amexorderId}",${creditNotesId})`;
      const insetTransatction = await query(transactionInsertQuery);
      res.status(200).send({
        message: `transaction created for sales order ${idForPayment}`,
        insetTransatction: insetTransatction,
      });
    }
    if (firstTwoChars === "SI") {
      const invoiceIDQuery = `select id from invoices where invoiceId = "${idForPayment}"`;
      const invoiceIDQueryResponse = await query(invoiceIDQuery);
      if (invoiceIDQueryResponse.length === 0) {
        res.status(201).send({ message: "invoiceId not found in invoices !" });
        return;
      }
      let salesorder = sales_order_Id ? sales_order_Id : null;
      var transactionInsertQuery;
      if (salesorder) {
        const queryForgetsalesOrderId = `select id from sales_order where transactionId="${salesorder}"`;
        const sgaeIntacctSalesOrderId = await query(queryForgetsalesOrderId);
        console.log("sales order id ", sgaeIntacctSalesOrderId);
        salesorder = sgaeIntacctSalesOrderId[0].id;
        transactionInsertQuery = `insert into transaction (invoiceId,sales_order_Id,paymentMethod ,transactionId,totalAmount,paidAmount,amex_order_Id,creditNotesId) values(${invoiceIDQueryResponse[0].id},"${salesorder}","${paymentMethod}","${transactionId}",${totalAmount},${paidAmount},"${amexorderId}",${creditNotesId})`;
      } else {
        transactionInsertQuery = `insert into transaction (invoiceId,paymentMethod ,transactionId,totalAmount,paidAmount,amex_order_Id,creditNotesId) values(${invoiceIDQueryResponse[0].id},"${paymentMethod}","${transactionId}",${totalAmount},${paidAmount},"${amexorderId}",${creditNotesId})`;
      }
      console.log("salesorder =>", transactionInsertQuery);
      // const transactionInsertQuery = `insert into transaction (invoiceId,sales_order_Id,paymentMethod ,transactionId,totalAmount,paidAmount,amex_order_Id,creditNotesId) values(${invoiceIDQueryResponse[0].id},"${salesorder}","${paymentMethod}","${transactionId}",${totalAmount},${paidAmount},"${amexorderId}",${creditNotesId})`
      const insetTransatction = await query(transactionInsertQuery);
      const referenceNumber = generateRefrenceNumber(
        insetTransatction.insertId
      );
      const updateRefQuery = `update transaction set refrenceId = "${referenceNumber}" where id="${
        (insetTransatction.insertId, insetTransatction.insertId)
      }"`;
      const updateTransaction = await query(updateRefQuery);
      res.status(200).send({
        message: `transaction created for the invoice ${idForPayment}`,
        insetTransatction: insetTransatction,
        idForPayment:idForPayment
      });
    }
    if (firstTwoChars === "CD") {
      console.log("firstTwoChars", firstTwoChars);
    }

    let sqls = `SELECT invoices.amount,invoices.customerId,invoices.status,invoices.createdBy,invoices.id,invoices.createdDate,invoices.invoiceDate,invoices.itemId FROM invoices WHERE invoices.id = ${invoiceidd[0]?.id}`;
    const invoice = await query(sqls);
  
    var note = "";
    if (req.body.note) {
      note = `,note='${note}'`;
    }
    if (invoice[0].status === "paid") {
      res.status(401).json({ message: "Already Paid" });
    } else {
      let customerId = invoice[0].customerId;
      let amountss =  invoice[0].amount;
      let createdDates = invoice[0].createdDate;
      let invoiceDates = invoice[0].invoiceDate;
      let itemIds = invoice[0].itemId;
      let createdBys =  invoice[0].createdBy;
      let status = "paid";

      var sql = `UPDATE invoices SET customerId = '${customerId}', amount='${amountss}',itemId ='${itemIds}', createdDate='${createdDates}',invoiceDate='${invoiceDates}',createdBy='${createdBys}',status='${status}'${note} WHERE id = ${invoiceidd[0]?.id}`;
      const invoices = await query(sql);
      invoices["itemIds"] = itemIds;
      // res.send({
      //   data: invoices,
      //   sageid: itemIds,
      // });
    }
  },
};

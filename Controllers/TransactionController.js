const util = require("util");
const mysqlconnection = require("../DB/db.config.connection");
const {
  getCBQARInvoiceRecordNumber,
} = require("../SageIntacctAPIs/InvoiceService");
const query = util.promisify(mysqlconnection.query).bind(mysqlconnection);
module.exports = {
  createTransaction: async (req, res) => {
    try {
      console.log("body =>", req.body);
      const {
        totalAmount,
        paidAmount,
        transactionId,
        amexorderId,
        paymentMethod,
        idForPayment,
        creditNotesId,
        sales_order_Id,
        check_no,
        reference_no,
        card_type,
        authorization_code,
      } = req.body;
      console.log("check_no", check_no);
      let check = check_no === undefined ? "null" : check_no;
      let reference = reference_no === undefined ? "null" : reference_no;
      let card_Type = card_type === undefined ? "null" : card_type;
      let authorization =
        authorization_code === undefined ? "null" : authorization_code;
      console.log("check", check);
      if (!transactionId || !amexorderId || !paymentMethod || !idForPayment) {
        res.status(400).send({ message: "All field is required" });
        return;
      }
      const firstTwoChars = idForPayment.slice(0, 2);
      if (firstTwoChars !== "SI") {
        const salesOrderID = `select id from invoices where tuition_invoice_id = "${idForPayment}"`;
        const salesOrderResponse = await query(salesOrderID);

        if (salesOrderResponse.length === 0) {
          res
            .status(201)
            .send({ message: "sales order transactionId not found !" });
          return;
        }
        const transactionInsertQuery = `insert into transaction (invoiceId,paymentMethod ,transactionId,totalAmount,paidAmount,amex_order_Id,creditNotesId,check_no,reference_no,card_type,authorization_code) values(${salesOrderResponse[0].id},"${paymentMethod}","${transactionId}",${totalAmount},${paidAmount},"${amexorderId}",${creditNotesId},"${check}","${reference}","${card_Type}","${authorization}")`;
        console.log("transactionInsertQuery111111111", transactionInsertQuery);
        const insetTransatction = await query(transactionInsertQuery);
        const referenceNumber = generateRefrenceNumber(
          insetTransatction.insertId
        );
        const updateRefQuery = `update transaction set refrenceId = "${referenceNumber}" where id="${
          (insetTransatction.insertId, insetTransatction.insertId)
        }"`;
        const updateTransaction = await query(updateRefQuery);
        res.status(200).send({
          message: `transaction created for sales order ${idForPayment}`,
          insetTransatction: insetTransatction,
          referenceNumber: referenceNumber,
          amount: totalAmount,
          transactionId: transactionId,
        });
      }
      if (firstTwoChars === "SI") {
        const invoiceIDQuery = `select id from invoices where invoiceId = "${idForPayment}"`;
        const invoiceIDQueryResponse = await query(invoiceIDQuery);
        if (invoiceIDQueryResponse.length === 0) {
          res
            .status(201)
            .send({ message: "invoiceId not found in invoices !" });
          return;
        }
        let salesorder = sales_order_Id ? sales_order_Id : null;
        var transactionInsertQuery = `insert into transaction (invoiceId,paymentMethod ,transactionId,totalAmount,paidAmount,amex_order_Id,creditNotesId,check_no,reference_no,card_type,authorization_code) values(${invoiceIDQueryResponse[0].id},"${paymentMethod}","${transactionId}",${totalAmount},${paidAmount},"${amexorderId}",${creditNotesId},"${check}","${reference}","${card_Type}","${authorization}")`;
        console.log("ttessttttt2222222");
        // if (salesorder) {
        //   const queryForgetsalesOrderId = `select id from sales_order where transactionId="${salesorder}"`;
        //   const sgaeIntacctSalesOrderId = await query(queryForgetsalesOrderId);
        //   console.log("sales order id ", sgaeIntacctSalesOrderId);
        //   salesorder = sgaeIntacctSalesOrderId[0].id;
        //   transactionInsertQuery = `insert into transaction (invoiceId,sales_order_Id,paymentMethod ,transactionId,totalAmount,paidAmount,amex_order_Id,creditNotesId) values(${invoiceIDQueryResponse[0].id},"${salesorder}","${paymentMethod}","${transactionId}",${totalAmount},${paidAmount},"${amexorderId}",${creditNotesId})`;
        // } else {
        //   transactionInsertQuery = `insert into transaction (invoiceId,paymentMethod ,transactionId,totalAmount,paidAmount,amex_order_Id,creditNotesId) values(${invoiceIDQueryResponse[0].id},"${paymentMethod}","${transactionId}",${totalAmount},${paidAmount},"${amexorderId}",${creditNotesId})`;
        // }
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
          referenceNumber: referenceNumber,
          amount: totalAmount,
          idForPayment: idForPayment,
          transactionId: transactionId,
        });
      }
      if (firstTwoChars === "CD") {
        console.log("firstTwoChars", firstTwoChars);
      }
    } catch (error) {
      res.status(400).send({
        message: error.message,
      });
    }
  },
  getTransactionByInvoiceId: async (req, res) => {
    try {
      const { invoiceId } = req.body;
      const queryForget = `select * from transaction where invoiceId = ${invoiceId} ORDER BY id DESC`;
      const queryForgetResponse = await query(queryForget);
      // console.log("queryForgetResponse =>",queryForgetResponse);
      const transactiondata = queryForgetResponse[0];
      res.status(200).send(transactiondata);
    } catch (error) {
      res.status(400).send({ message: error.message });
    }
  },
  getTransactionByInvoiceIdOrderDesc: async (req, res) => {
    try {
      const { invoiceId, paymentMethod, amex_order_Id } = req.body;
      const queryForget = `select * from transaction where invoiceId=${invoiceId} AND amex_order_Id= "${amex_order_Id}" AND paymentMethod="${paymentMethod}" ORDER BY id DESC LIMIT 1`;
      console.log("queryForgetqueryForget", queryForget);
      const queryForgetResponse = await query(queryForget);
      // console.log("queryForgetResponse =>",queryForgetResponse);
      const transactiondata = queryForgetResponse[0];
      res.status(200).send(transactiondata);
    } catch (error) {
      res.status(400).send({ message: error.message });
    }
  },
  CBQWebhook: async (req, res) => {
    try {
      console.log("CBQ webhook data Call", req.body); // Call your action on the request here

      var object = req.body;
      console.log("object!!!!!!!!!", object);
      const data = {
        paymentMethod: "Credit Card",
        totalAmount: object?.req_amount,
        paidAmount: object?.req_amount,
        transactionId: `${object?.transaction_id}`,
        idForPayment: object?.req_reference_number,
        creditNotesId: null,
        amexorderId: object?.req_reference_number,
        sales_order_Id: null,
      };
      console.log("transaction inserting =>", data);
      let newData = await saveTransaction(data, req, res);
      console.log("transaction inserted ", newData);
      // res.status(200).send(object)
    } catch (error) {
      res.status(400).send({ message: error.message });
    }
  },
  deleteTransaction: async (req, res) => {
    const id = req.params.id;
    var sql = `delete from transaction where id = ${id}`;
    mysqlconnection.query(sql, async function (err, result) {
      if (err) throw err;
      res.status(200).json({
        message: "transaction deleted successfully",
        response: result,
      });
    });
  },

  updateTransaction: async (req, res) => {
    try {
      const { id, creditNotesId } = req.body;
      if (!id) {
        res.status(201).send({ message: "transaction id required !" });
        return;
      }
      const updatesql = `update transaction set creditNotesId="${creditNotesId}" where id = ${id}`;
      const updatetransaction = await query(updatesql);
      res.status(200).send(updatetransaction);
    } catch (error) {
      res.status(400).send({ message: error.message });
    }
  },

  updateCBQTransaction: async (req, res) => {
    try {
      const { id, creditNotesId, card_type, transactionId } = req.body;
      if (!id) {
        res.status(201).send({ message: "transaction id required !" });
        return;
      }
      // let creditID = creditNotesId !== undefined ? creditNotesId : null;
      // console.log(creditNotesId,'creditIDcreditID',creditID);
      const updatesql = `update transaction set card_type="${card_type}" where id = ${id}`;
      const updatetransaction = await query(updatesql);
      res.status(200).send(updatetransaction);
    } catch (error) {
      res.status(400).send({ message: error.message });
    }
  },
  //get reports controlller
  getReport: (req, res) => {
    const {
      customerId,
      invoiceId,
      receiptNo,
      paymentmethod,
      startDate,
      endDate,
    } = req.body;

    let by_rct_num = "";
    if (receiptNo) {
      by_rct_num = `AND transaction.refrenceId = "${receiptNo}"`;
    }

    let by_cust_id = "";
    if (customerId) {
      by_cust_id = `AND invoices.customerId = "${customerId}"`;
    }

    let by_invoice_id = "";
    if (invoiceId) {
      by_invoice_id = `AND transaction.amex_order_Id = "${invoiceId}"`;
    }
    let by_payment_method = "";
    if (paymentmethod) {
      by_payment_method = `AND transaction.paymentMethod = "${paymentmethod}"`;
    }
    let by_startdate_and_enddate = "";
    if (startDate && endDate) {
      by_startdate_and_enddate = `AND ( transaction.createdAt BETWEEN '${startDate}' AND '${endDate}' ) `;
    }

    var sql = `
    select transaction.id as transactionId, transaction.refrenceId as rct_number, transaction.transactionId as generated_trx_id, transaction.paidAmount, transaction.paymentMethod, transaction.createdAt as transaction_date, invoices.id, invoices.amount, invoices.createdDate as invoice_created_date, invoices.invoiceDate as invoice_due_date, transaction.amex_order_Id as invoice_id, users.id as user_id, users.name, users.email1 as email, users.attentionTo, users.parentId as cusromerparentid, customers.customerId, parents.parentId, check_no, authorization_code, reference_no 
    FROM transaction
    inner join invoices on invoices.id = transaction.invoiceId 
    inner join users on users.id = invoices.customerId 
    left outer join customers on customers.userId = users.id 
    left outer join parents on parents.userId = users.id
    where 1=1 ${by_rct_num} ${by_invoice_id} ${by_payment_method} ${by_startdate_and_enddate} ${by_cust_id}  order by transaction.createdAt desc `;
    console.log(sql);
    mysqlconnection.query(sql, function (err, result) {
      if (err) throw err;
      res.status(200).json({ message: "ok", data: result });
    });
  },
  //get ceceipt numbers
  getReceiptNumbers: (req, res) => {
    var sql = `SELECT transaction.id, transaction.refrenceId FROM transaction`;
    mysqlconnection.query(sql, function (err, result) {
      if (err) throw err;
      res.status(200).json({ message: "ok", data: result });
    });
  },

  getTransactionbytransid: (req, res) => {
    var sql = `SELECT id,invoiceId FROM transaction WHERE transactionId="${req.params.id}";`;
    mysqlconnection.query(sql, function (err, result) {
      if (err) throw err;
      res.status(200).json({ message: "ok", data: result });
    });
  },
};

saveTransaction = async (data, req, res) => {
  console.log("transaction data =>", data);
  const {
    totalAmount,
    paidAmount,
    transactionId,
    amexorderId,
    paymentMethod,
    idForPayment,
    creditNotesId,
    sales_order_Id,
    card_type,
  } = data;
  let card_Type = card_type === undefined ? "null" : card_type;
  if (!transactionId || !amexorderId || !paymentMethod || !idForPayment) {
    res.status(400).send({ message: "All field is required" });
    return;
  }
  const firstTwoChars = idForPayment.slice(0, 2);
  if (firstTwoChars !== "SI") {
    const salesOrderID = `select id from invoices where tuition_invoice_id = "${idForPayment}"`;
    const salesOrderResponse = await query(salesOrderID);

    if (salesOrderResponse.length === 0) {
      res
        .status(201)
        .send({ message: "sales order transactionId not found !" });
      return;
    }
    const transactionInsertQuery = `insert into transaction (invoiceId,paymentMethod ,transactionId,totalAmount,paidAmount,amex_order_Id,creditNotesId,card_type) values(${salesOrderResponse[0].id},"${paymentMethod}","${transactionId}",${totalAmount},${paidAmount},"${amexorderId}",${creditNotesId},"${card_type}")`;
    const insetTransatction = await query(transactionInsertQuery);
    const referenceNumber = generateRefrenceNumber(insetTransatction.insertId);
    const updateRefQuery = `update transaction set refrenceId = "${referenceNumber}" where id="${
      (insetTransatction.insertId, insetTransatction.insertId)
    }"`;
    const updateTransaction = await query(updateRefQuery);
    console.log("teeessssss3333333333333");
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
    var transactionInsertQuery = `insert into transaction (invoiceId,paymentMethod ,transactionId,totalAmount,paidAmount,amex_order_Id,creditNotesId,card_type) values(${invoiceIDQueryResponse[0].id},"${paymentMethod}","${transactionId}",${totalAmount},${paidAmount},"${amexorderId}",${creditNotesId},"${card_type}")`;
    console.log("###########44444444");
    // if (salesorder) {
    //   const queryForgetsalesOrderId = `select id from sales_order where transactionId="${salesorder}"`;
    //   const sgaeIntacctSalesOrderId = await query(queryForgetsalesOrderId);
    //   console.log("sales order id ", sgaeIntacctSalesOrderId);
    //   salesorder = sgaeIntacctSalesOrderId[0].id;
    //   transactionInsertQuery = `insert into transaction (invoiceId,sales_order_Id,paymentMethod ,transactionId,totalAmount,paidAmount,amex_order_Id,creditNotesId) values(${invoiceIDQueryResponse[0].id},"${salesorder}","${paymentMethod}","${transactionId}",${totalAmount},${paidAmount},"${amexorderId}",${creditNotesId})`;
    // } else {
    //   transactionInsertQuery = `insert into transaction (invoiceId,paymentMethod ,transactionId,totalAmount,paidAmount,amex_order_Id,creditNotesId) values(${invoiceIDQueryResponse[0].id},"${paymentMethod}","${transactionId}",${totalAmount},${paidAmount},"${amexorderId}",${creditNotesId})`;
    // }
    console.log("salesorder =>", transactionInsertQuery);
    // const transactionInsertQuery = `insert into transaction (invoiceId,sales_order_Id,paymentMethod ,transactionId,totalAmount,paidAmount,amex_order_Id,creditNotesId) values(${invoiceIDQueryResponse[0].id},"${salesorder}","${paymentMethod}","${transactionId}",${totalAmount},${paidAmount},"${amexorderId}",${creditNotesId})`
    const insetTransatction = await query(transactionInsertQuery);
    const referenceNumber = generateRefrenceNumber(insetTransatction.insertId);
    const updateRefQuery = `update transaction set refrenceId = "${referenceNumber}" where id="${insetTransatction.insertId}"`;
    const updateTransaction = await query(updateRefQuery);

    // try {
    //   const arInvoiceId = idForPayment;
    //   console.log("ARInvoiceId =>", arInvoiceId);
    //   if (!arInvoiceId) {
    //     res.status(201).send({ message: "AR Inovice ID is required !" });
    //     return;
    //   }
    //   let query = new IA.Functions.Common.NewQuery.Query();
    //   query.fromObject = "ARINVOICE";
    //   let fields = [
    //     new IA.Functions.Common.NewQuery.QuerySelect.Field("RECORDNO"),
    //     //  new IA.Functions.Common.NewQuery.QuerySelect.Field('RECORDNO'),
    //   ];
    //   let filter = new IA.Functions.Common.NewQuery.QueryFilter.Filter(
    //     "RECORDID"
    //   ).equalTo(arInvoiceId);
    //   query.selectFields = fields;
    //   query.pageSize = 100;
    //   query.filter = filter;
    //   const response = await client.execute(query);
    //   const result = response.getResult();
    //   let json_data = result.data[0];
    //   console.log(result, "!@##########", json_data);
    //   // res.status(200).send(json_data);
    // } catch (error) {
    //   console.log("!!!!!!!!!!!!!", error);
    //   // res.status(400).send({ message: error.message });
    // }
    //////////////////////////////////
    res.status(200).send({
      message: `transaction created for the invoice ${idForPayment}`,
      insetTransatction: insetTransatction,
      idForPayment: idForPayment,
    });
  }
  if (firstTwoChars === "CD") {
    console.log("firstTwoChars", firstTwoChars);
  }
};

generateRefrenceNumber = (DBTransactionId) => {
  let gId = `${DBTransactionId.toString()}`;
  let tempRef = "RCT-000000000";
  let refrenceNumber = tempRef.slice(0, -gId.length);
  let finalGeneratedRefrenceNumber = refrenceNumber + gId;
  console.log("finalGeneratedRefrenceNumber =>", finalGeneratedRefrenceNumber);
  return finalGeneratedRefrenceNumber;
};

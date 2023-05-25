const jwt = require("jsonwebtoken");
const mysqlconnection = require("../../DB/db.config.connection");
const util = require("util");
const CreditRequestTemplate = require("../Helper/templates/creditRequestTemplate");
const sendEmails = require("../Helper/sendEmails");
const CreditNotesMailfn = require("../../commonFunction/creditNotesMailfn");
const CreditSalesMailfn = require("../../commonFunction/creditSalesMailfn");

const query = util.promisify(mysqlconnection.query).bind(mysqlconnection);
module.exports = {
  // Add credit notes Controller / add credit request
  addCreditNotesController: async (req, res) => {
    const {
      userId,
      status,
      amount,
      sageinvoiceId,
      invoiceId,
      createdBy,
      message,
    } = req.body;
    //credit note functionality
    const getuseremail = `select email1, name from users where id = ${userId}`;
    const getEmail = await query(getuseremail);
    // insert query
    const creditRequestsquery = `INSERT INTO creditrequests (userId, invoiceId, sageInvoiceId, status, amount, createdBy)VALUES(${userId},${invoiceId},"${sageinvoiceId}",${status},${amount},${createdBy})`;
    mysqlconnection.query(creditRequestsquery, function (err, result) {
      if (err) throw err;
      if (result) {
        const creditRequestMsgquery = `INSERT INTO creditrequestmsg (message,senderId,receiverId,creditReqId,amount)VALUES("${message}",${userId},0,${result.insertId},${amount})`;
        mysqlconnection.query(creditRequestMsgquery, function (err, rest) {
          if (err) throw err;
          // if (salesOrderId > 0) {
          //   const updetsales_order = `update sales_order set isRequested = 1 where sales_order.id =${salesOrderId}`;
          //   mysqlconnection.query(
          //     updetsales_order,
          //     async function (err, result) {
          //       if (err) throw err;
          //       const newData = {
          //         userName: getEmail[0]?.name,
          //         userEmail: getEmail[0]?.email1,
          //         invoiceID: getInvoice[0]?.invoiceId,
          //         amount: amount,
          //         message: message,
          //       };
          //       CreditNotesMailfn(newData, (title = ""));

          //       res.status(200).send({
          //         message: "credit request created successfully.",
          //       });
          //     }
          //   );
          // }
          if (invoiceId > 0) {
            const updetinvoices = `update invoices set isRequested = 1 where invoices.id =${invoiceId}`;
            mysqlconnection.query(updetinvoices, async function (err, result) {
              if (err) throw err;
              // const newData = {
              //   userName: getEmail[0]?.name,
              //   userEmail: getEmail[0]?.email1,
              //   invoiceID: getInvoice[0]?.invoiceId,
              //   message: message,
              //   amount: amount,
              // };
              // CreditSalesMailfn(newData, (title = ""));
              res.status(200).send({
                message: "credit request created successfully.",
              });
            });
          }
        });
      }
    });
    // }
  },

  //get sage credits Notes controller
  getSageCreditNotesController: async (req, res) => {
    const { status, sorting, customerId, startdate, enddate } = req.body;
    let bystatus = "";
    if (status === "0" || status === "1" || status === "2" || status === "3") {
      bystatus = ` and creditrequests.status = ${status}`;
    } else {
      bystatus = "";
    }
    let bysorting = "";
    if (sorting === 0) {
      bysorting = ` ORDER BY createdAt ASC`;
    } else if (sorting === 1) {
      bysorting = ` ORDER BY createdAt DESC`;
    } else if (sorting === 2) {
      bysorting = ` ORDER BY amount ASC`;
    } else if (sorting === 3) {
      bysorting = ` ORDER BY amount DESC`;
    } else {
      bysorting = "";
    }

    let BycustomerId = "";
    if (customerId) {
      BycustomerId = ` and creditrequests.userId  = ${customerId}`;
    } else {
      BycustomerId = "";
    }

    let BycustomerId_FromSageCreditNotes = "";
    if (customerId) {
      BycustomerId_FromSageCreditNotes = ` and sagecreditnotes.userId  = ${customerId}`;
    } else {
      BycustomerId_FromSageCreditNotes = "";
    }

    var sqlquery = `select creditrequests.id, users.name as "customerName", users.email1, creditrequests.status, creditrequests.is_complete, creditrequests.amount, creditrequests.invoiceId,  creditrequests.sageInvoiceId,
    creditrequests.createdAt from creditrequests
    LEFT outer join users on users.id = creditrequests.userId
    where 1=1 ${bystatus} ${BycustomerId}`;

    var sqlquery_FromSageCreditNotes = `select sagecreditnotes.id, users.name as "customerName", users.email1, sagecreditnotes.amount, sagecreditnotes.invoiceId,  sagecreditnotes.sageInvoiceId,
    sagecreditnotes.createdAt from sagecreditnotes
    LEFT outer join users on users.id = sagecreditnotes.customerId
    where 1=1 ${bystatus} ${BycustomerId}`;

    mysqlconnection.query(sqlquery_FromSageCreditNotes, function (err, result) {
      if (err) throw err;
      res.status(200).json({ message: "ok", data: result });
    });
  },


  //get credits Notes controller
  getCreditNotesController: async (req, res) => {
    const { status, sorting, customerId, startdate, enddate } = req.body;
    let bystatus = "";
    if (status === "0" || status === "1" || status === "2" || status === "3") {
      bystatus = ` and creditrequests.status = ${status}`;
    } else {
      bystatus = "";
    }
    let bysorting = "";
    if (sorting === 0) {
      bysorting = ` ORDER BY createdAt ASC`;
    } else if (sorting === 1) {
      bysorting = ` ORDER BY createdAt DESC`;
    } else if (sorting === 2) {
      bysorting = ` ORDER BY amount ASC`;
    } else if (sorting === 3) {
      bysorting = ` ORDER BY amount DESC`;
    } else {
      bysorting = "";
    }

    let BycustomerId = "";
    if (customerId) {
      BycustomerId = ` and creditrequests.userId  = ${customerId}`;
    } else {
      BycustomerId = "";
    }


    var sqlquery = `select creditrequests.id, users.name as "customerName", users.email1, creditrequests.status, creditrequests.is_complete, creditrequests.amount, creditrequests.invoiceId,  creditrequests.sageInvoiceId,
    creditrequests.createdAt from creditrequests
    LEFT outer join users on users.id = creditrequests.userId
    where 1=1 ${bystatus} ${BycustomerId}`;

   

    mysqlconnection.query(sqlquery, function (err, result) {
      if (err) throw err;
      res.status(200).json({ message: "ok", data: result });
    });
  },


  //get status updated
  getCreditNotesStatus: async (req, res) => {
    const { status, sorting, customerId, startdate, enddate } = req.body;
    let bystatus = "";
    if (status === "0" || status === "1" || status === "2" || status === "3") {
      bystatus = ` and creditrequests.status = ${status}`;
    } else {
      bystatus = "";
    }
    let bysorting = "";
    if (sorting === 0) {
      bysorting = ` ORDER BY createdAt ASC`;
    } else if (sorting === 1) {
      bysorting = ` ORDER BY createdAt DESC`;
    } else if (sorting === 2) {
      bysorting = ` ORDER BY amount ASC`;
    } else if (sorting === 3) {
      bysorting = ` ORDER BY amount DESC`;
    } else {
      bysorting = "";
    }
    let BycustomerId = "";
    if (customerId) {
      BycustomerId = ` and creditrequests.userId  = ${customerId}`;
    } else {
      BycustomerId = "";
    }

    var sqlquery = `select creditrequests.id, creditrequests.is_complete, users.name as "customerName", users.email1, creditrequests.status, creditrequests.createdAt, creditrequests.amount,creditrequests.userId as userId,
    creditrequests.invoiceId, creditrequests.sageInvoiceId, creditrequests.salesOrderId  from creditrequests LEFT outer join users on users.id = creditrequests.userId
    left outer join invoices on invoices.id = creditrequests.invoiceId
    where creditrequests.status = "4" ${bystatus} ${BycustomerId}`;
    mysqlconnection.query(sqlquery, function (err, result) {
      if (err) throw err;
      res.status(200).json({ message: "ok", data: result });
    });
  },

  //get credit notes details controller
  getCreditNotesDetailsController: async (req, res) => {
    const id = req.params.id;
    var sql = `select creditrequests.id as "creditReqId", creditrequests.is_complete as isComplete, users.name, users.email1, users.phone1, users.createdAt, users.id as "customerId", customers.customerId as sageCustomerId, parents.parentId as sageParentId, creditrequests.status, creditrequests.amount, creditrequests.invoiceId, creditrequests.sageInvoiceId, invoices.itemId ,invoices.amount_due as amount_due , invoices.status as invoiceStatus from creditrequests
    LEFT OUTER JOIN users on users.id = creditrequests.userId
    left outer join customers on customers.userId = users.id
    left outer join parents on parents.userId = users.id
    left outer join invoices on invoices.id = creditrequests.invoiceId
    where creditrequests.id = ${id}`;
    mysqlconnection.query(sql, async function (err, result) {
      if (err) throw err;
      const dtmsg = `select message,amount from creditrequestmsg where creditReqId = ${id}`;
      console.log(dtmsg);
      const approvalamtauery = `select creditnotes.createdAt, creditnotes.amount from creditnotes where creditRequestId = ${id}`;
      const appramt = await query(approvalamtauery);
      mysqlconnection.query(dtmsg, function (err, results) {
        if (err) throw err;
        res
          .status(200)
          .json({ message: "ok", data: { result, results, appramt } });
      });
    });
  },

  //update/delete credit notes
  editCreditNotesController: async (req, res) => {
    const id = req.params.id;
    const {
      status,
      amount,
      message,
      updatedBy,
      customerId,
      amountMode,
      creditRequestId,
      invoiceId,
      is_complete,
      approvedBy,
      amountReqMsg
    } = req.body;
    let ReqUser,ReqMsgAmount;

    
    if(!amountReqMsg){
      ReqMsgAmount = 0;
    }else{
      ReqMsgAmount =amountReqMsg;
    }

    if(customerId){
    sqlquery = `select creditrequests.createdBy from creditrequests where userId =  ${customerId}`;
    
    const RequestedUser = await query(sqlquery);
    
     ReqUser = RequestedUser[0].createdBy;
    }
    
    //Sending mail  note functionality
    // let getInvoice;
    // const getuseremail = `select email1,name from users where id = ${customerId}`;
    // const getEmail = await query(getuseremail);

    //update mark  is complete
    if (is_complete === 1) {
      console.log("is_complete === 1")
      const updatecreditRequestswuery = `update creditrequests set is_complete = 1 where id = ${id}`;
      mysqlconnection.query(updatecreditRequestswuery, function (err, result) {
        if (err) throw err;
        res.status(200).json({
          message: "Credit requested updated successfully",
          data: result,
        });
      });
    }

    if (status < 4) {
      console.log("status < 4")
      const updatecreditRequestswuery = `update creditrequests set status = ${status}, approvedBy = ${approvedBy} where id = ${id}`;
      mysqlconnection.query(updatecreditRequestswuery, function (err, result) {
        if (err) throw err;

        const creditRequestMsgquery = `INSERT INTO creditrequestmsg (message,senderId,receiverId,creditReqId,amount)VALUES("${message}",0,${updatedBy},${id},${ReqMsgAmount})`;
        mysqlconnection.query(creditRequestMsgquery, function (err, results) {
          if (err) throw err;
          res.status(200).json({ message: "request approved" });
        });
      });
    }

    if (status === 4) {
      console.log("status === 4")
      const updatecreditRequestswuery = `update creditrequests set status = ${status},amount = ${amount} where id = ${id}`;

      // if (salesOrderId === 0) {
      //   const getuinvoiceId = `select invoiceId from invoices where id = ${invoiceId}`;
      //   getInvoice = await query(getuinvoiceId);
      // } else {
      //   const getSalesinvoiceId = `select transactionId as invoiceId from sales_order where id = ${salesOrderId}`;
      //   getInvoice = await query(getSalesinvoiceId);
      // }

      mysqlconnection.query(updatecreditRequestswuery, function (err, result) {
        if (err) throw err;
        const creditRequestMsgquery = `INSERT INTO creditrequestmsg (message,senderId,receiverId,creditReqId,amount)VALUES("${message}",0,${updatedBy},${id},${ReqMsgAmount})`;
        mysqlconnection.query(creditRequestMsgquery, function (err, result) {
          if (err) throw err;
          const sel_query = `insert into creditnotes (customerId,amount,amountMode,creditRequestId)values(${ReqUser},${amount},${amountMode},${creditRequestId})`;
          mysqlconnection.query(sel_query, async function (err, resultt) {
            if (err) throw err;
            // if (salesOrderId > 0) {
            //   const updetsales_order = `update sales_order set isRequested = 2 where sales_order.id =${salesOrderId}`;
            //   mysqlconnection.query(
            //     updetsales_order,
            //     async function (err, result) {
            //       if (err) throw err;
            //       const newData = {
            //         userName: getEmail[0]?.name,
            //         userEmail: getEmail[0]?.email1,
            //         invoiceID: getInvoice[0]?.invoiceId,
            //         message: message,
            //         amount: amount,
            //       };
            //       CreditNotesMailfn(newData, (title = "Admin"));
            //       res
            //         .status(200)
            //         .json({ message: "credit ballance debited successfully" });
            //     }
            //   );
            // }
            if (invoiceId > 0) {
              const updetinvoices = `update invoices set isRequested = 2 where invoices.id =${invoiceId}`;
              // if (salesOrderId === 0) {
              //   const getuinvoiceId = `select invoiceId from invoices where id = ${invoiceId}`;
              //   getInvoice = await query(getuinvoiceId);
              // } else {
              //   const getSalesinvoiceId = `select transactionId as invoiceId from sales_order where id = ${salesOrderId}`;
              //   getInvoice = await query(getSalesinvoiceId);
              // }
              mysqlconnection.query(
                updetinvoices,
                async function (err, result) {
                  if (err) throw err;
                  // const newData = {
                  //   userName: getEmail[0]?.name,
                  //   userEmail: getEmail[0]?.email1,
                  //   invoiceID: getInvoice[0]?.invoiceId,
                  //   message: message,
                  //   amount: amount,
                  // };
                  // CreditSalesMailfn(newData, (title = "Admin"));
                  res
                    .status(200)
                    .json({ message: "credit balance debited successfully" });
                }
              );
            }
          });
        });
      });
    }
  },

  //get credit ballance
  getCredirBallanceController: async (req, res) => {
    const id = req.params.id;
    const credit_ballance = `select sum(amount) as "creditAmount" from creditnotes where amountMode = 1 and  customerId = ${id}`;
    const debit_ballance = `select sum(amount) as "debitAmount" from creditnotes where amountMode = 0 and  customerId = ${id}`;

    const credit_ballance_FromSageCreditNotes = `select sum(amount) as "amount" from sagecreditnotes where amountMode = 1 and  customerId = ${id}`;
    const debit_ballance_FromSageCreditNotes = `select sum(amount) as "amount" from sagecreditnotes where amountMode = 0 and  customerId = ${id}`;
    // const getCreditRequestQuery = `select creditRequestId from creditNotes where customerId =${id}`;
    const getCreditRequestQuery = `(select * from creditnotes where amountMode = '1' and customerId = ${id}) order by id desc`;

    const getCreditRequestQuery_FromSageCreditNotes = `(select * from sagecreditnotes where amountMode = '1' and customerId = ${id}) order by id desc`;

    const getCreditRequestQuery_FromPortalDB = await query(
      `select * from sagecreditnotes where amountMode = '0' and customerId = "${id}" order by id desc`
    );

    const creditamt = await query(credit_ballance);
    const debitamt = await query(debit_ballance);
    const getCreditRequestQueryResponse = await query(getCreditRequestQuery);

    const creditamt_FromSageCreditNotes = await query(
      credit_ballance_FromSageCreditNotes
    );
    const debitamt_FromSageCreditNotes = await query(
      debit_ballance_FromSageCreditNotes
    );

    const getCreditRequestQueryResponse_FromSageCreditNotes = await query(
      getCreditRequestQuery_FromSageCreditNotes
    );

    const creditAmount = creditamt[0].creditAmount;
    const debitAmount = debitamt[0].debitAmount;
    const creditBal = creditAmount - debitAmount;

    const creditAmount_FromSageCreditNotes =
      creditamt_FromSageCreditNotes[0].amount;
    const debitAmount_FromSageCreditNotes =
      debitamt_FromSageCreditNotes[0].amount;
    const creditBal_FromSageCreditNotes =
      creditAmount_FromSageCreditNotes - debitAmount_FromSageCreditNotes;
    console.log(
      creditAmount_FromSageCreditNotes,
      debitAmount_FromSageCreditNotes,
      "getCreditRequestQueryResponse =>",
      creditBal_FromSageCreditNotes,
      getCreditRequestQueryResponse
    );

    if (creditAmount_FromSageCreditNotes) {
      console.log("if");
      res.status(200).json({
        message: "ok",
        creditBal: creditBal,
        creditBal_FromSageCreditNotes: creditBal_FromSageCreditNotes,
        CreditRequestId: getCreditRequestQueryResponse[0]?.creditRequestId,
        CreditRequestId_FromSageCreditNotes:
          getCreditRequestQueryResponse_FromSageCreditNotes[0]?.id,
        getCreditRequestQuery_FromPortalDB:
          getCreditRequestQuery_FromPortalDB[0]?.id,
      });
    } else {
      res.status(200).json({
        message: "ok",
        creditBal: 0,
        creditBal_FromSageCreditNotes: 0,
      });
    }
  },

  //insert amount
  insertAmount: async (req, res) => {
    const { customerId, Amount, amountMode } = req.body;
    if (Amount > 0) {
      const query = `insert into creditnotes(customerId,amount,amountMode)values(${customerId},${Amount},${amountMode})`;
      mysqlconnection.query(query, function (err, results) {
        if (err) throw err;
        res.status(200).json({ message: "amount debited successfully" });
      });
    }
  },

  //get cedit balance by user id
  getCredirBallanceByUserController: async (req, res) => {
    const query = `SELECT creditnotes.id, creditnotes.createdAt, creditnotes.amount, creditnotes.creditrequestId,creditrequests.status, invoices.invoiceId
    FROM creditnotes
       left outer join creditrequests on creditrequests.id = creditnotes.creditrequestId
       left outer join invoices on invoices.id = creditrequests.invoiceId
       where creditnotes.customerId in(${req.params.id})`;

    const query_FromSageCreditNotes = `SELECT sagecreditnotes.id, sagecreditnotes.createdAt, sagecreditnotes.amount,sagecreditnotes.invoiceId
    FROM sagecreditnotes  where sagecreditnotes.customerId in(${req.params.id})`;

    mysqlconnection.query(query_FromSageCreditNotes, function (err, results) {
      if (err) throw err;
      res.status(200).json({ message: "ok", data: results });
    });
  },

  //get sage credit req by user id
  getSageCreditReqByuserController: (req, res) => {
    const id = req.params.id;
    var sql = `select users.name, creditrequests.id, creditrequests.amount, creditrequests.status, creditrequests.invoiceId
    , creditrequests.sageInvoiceId,creditrequests.createdAt from creditrequests left outer join users on users.id = userId
    where userId in (${id})`;

    var sql_FromSageCreditNotes = `select users.name, sagecreditnotes.id, sagecreditnotes.amount, sagecreditnotes.invoiceId
    , sagecreditnotes.sageInvoiceId,sagecreditnotes.createdAt from sagecreditnotes left outer join users on users.id = sagecreditnotes.customerId
    where sagecreditnotes.customerId in (${id})`;

    mysqlconnection.query(sql_FromSageCreditNotes, function (err, result) {
      if (err) throw err;
      res.status(200).json({ message: "ok", data: result });
    });
  },

   //get credit req by user id
   getCreditReqByuserController: (req, res) => {
    const id = req.params.id;
    var sql = `select users.name, creditrequests.id, creditrequests.amount, creditrequests.status, creditrequests.invoiceId
    , creditrequests.sageInvoiceId,creditrequests.createdAt from creditrequests left outer join users on users.id = userId
    where userId in (${id})`;

    mysqlconnection.query(sql, function (err, result) {
      if (err) throw err;
      res.status(200).json({ message: "ok", data: result });
    });
  },

  insertPortalAmount: async (req, res) => {
    const {
      sageCustomerId,
      customerId,
      Amount,
      amountMode,
      invoiceId,
      sageinvoiceId,
    } = req.body;

    if (Amount > 0) {
      const query = `INSERT INTO sagecreditnotes (sageCustomerId,customerId,amount,amountMode,recordNo,docNo,docId,invoiceId,sageInvoiceId) VALUES("${sageCustomerId}","${customerId}","${Amount}","${amountMode}",null,null,null,"${invoiceId}","${sageinvoiceId}")`;
      mysqlconnection.query(query, function (err, results) {
        if (err) throw err;
        console.log("resultsresults", results);
        res
          .status(200)
          .json({ message: "amount debited successfully", data: results });
      });
    }
  },
};

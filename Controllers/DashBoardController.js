const util = require("util");
const mysqlconnection = require("../DB/db.config.connection");
const query = util.promisify(mysqlconnection.query).bind(mysqlconnection);
module.exports = {
  calculateDataForDashboard: async (req, res) => {
    try {
      // total customer
      const queryForTotalCustomerCount = `SELECT count(users.id) as totalCustomer FROM users 
      inner join parents on parents.userId = users.id where roleId = 2 and users.isDeleted = 0`;
      const queryForTotalCustomerCountReqponse = await query(
        queryForTotalCustomerCount
      );
      const totalCustomer = queryForTotalCustomerCountReqponse[0].totalCustomer;

      // leates customers
      const queryForLeatestCustomer = `select users.name, users.email1, users.status from users 
      where roleId = 2 and users.isDeleted = 0 ORDER BY createdAt DESC LIMIT 7`;
      const queryForLeatestCustomerCountReqponse = await query(
        queryForLeatestCustomer
      );
      const leatestCustomer = queryForLeatestCustomerCountReqponse;

      // total earning
      const queryForSumAmountofInvoice = `select sum(amount) as invoiceSumAmount from invoices where status="paid"`;
      const queryForSumAmountofInvoiceResponse = await query(
        queryForSumAmountofInvoice
      );
      const invoiceSumOfAmount =
        queryForSumAmountofInvoiceResponse[0].invoiceSumAmount;
      const totalEarning = parseInt(invoiceSumOfAmount);

      // total credit amount
      const queryForTotalCreditAmount = `select sum(amount) as creditAmount from creditnotes where amountMode = 1 `;
      const queryForTotalCreditAmountResponse = await query(
        queryForTotalCreditAmount
      );
      const totalCredit = queryForTotalCreditAmountResponse[0].creditAmount;

      // total credit amount from sageCreditNotes 
      const queryForTotalCreditAmount_FromSageCreditNotes = `select sum(amount) as creditAmount from sagecreditnotes where amountMode = 1 `;
      const queryForTotalCreditAmountResponse_FromSageCreditNotes = await query(
        queryForTotalCreditAmount_FromSageCreditNotes
      );
      const totalCredit_FromSageCreditNotes = queryForTotalCreditAmountResponse_FromSageCreditNotes[0].creditAmount;

      // total pending invoice and there amount
      const queryForTotalPendingInvoiceAndAmount = `select count(id) as count, sum(amount) as sumamount from invoices where status="pending" and isDeleted = 0`;
      const queryForTotalPendingInvoiceAndAmountResponse = await query(
        queryForTotalPendingInvoiceAndAmount
      );
      const pendingInvoice =
        queryForTotalPendingInvoiceAndAmountResponse[0].count;
      const pendingInvoiceAmount =
        queryForTotalPendingInvoiceAndAmountResponse[0].sumamount;

      // leatest credit request
      const queryForLeatestcreditRequset = `SELECT cd.id as creditNoteId ,cd.amount as creditAmount,cd.customerId,cd.creditRequestId,cr.id as creditRequestId,cr.amount as requestedAmount,cr.createdAt,u.id,u.name FROM creditnotes as cd, creditrequests as cr, users as u
        WHERE cd.creditRequestId = cr.id AND 
        cd.customerId = u.id order by createdAt LIMIT 7`;
      const queryForLeatestcreditRequsetResponse = await query(
        queryForLeatestcreditRequset
      );
      const creditRequestData = queryForLeatestcreditRequsetResponse;

      // latest credit request From Sage Credit Notes
      const queryForLeatestcreditRequset_FromSageCreditNotes = `SELECT cd.id as creditNoteId ,cd.amount as creditAmount,cd.customerId,cd.amount as requestedAmount,cd.createdAt,u.id,u.name FROM sagecreditnotes as cd, users as u
        WHERE cd.customerId = u.id order by createdAt LIMIT 7`;
      const queryForLeatestcreditRequsetResponse_FromSageCreditNotes = await query(
        queryForLeatestcreditRequset_FromSageCreditNotes
      );
      const creditRequestData_FromSageCreditNotes = queryForLeatestcreditRequsetResponse_FromSageCreditNotes;

      res.status(200).send({
        totalCustomer,
        leatestCustomer,
        totalEarning,
        totalCredit,
        pendingInvoice,
        pendingInvoiceAmount,
        creditRequestData,
        totalCredit_FromSageCreditNotes,
        creditRequestData_FromSageCreditNotes
      });
    } catch (error) {
      res.status(400).send({
        message: error.message,
      });
    }
  },
};

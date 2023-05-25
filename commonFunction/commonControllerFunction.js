const util = require("util");
const mysqlconnection = require("../DB/db.config.connection");
const query = util.promisify(mysqlconnection.query).bind(mysqlconnection);

// get purchase items details function
const purchaseInvoiceItemasDetails = async (invoice_id) => {
  var invoice_items_query = `SELECT invoice_items.id, invoice_items.item_name, invoice_items.quantity, invoice_items.item_price,invoice_items.item_description,invoice_items.item_unit, invoice_items.item_total_price,invoice_items.product_line_id  FROM invoice_items WHERE invoice_items.invoice_id = ${invoice_id}`;
  const items = await query(invoice_items_query);
  return items;
};

//get customer parent details
const CusromersParentDetails = async (customer_id) => {
  const qry = `select users.name as parent_name, parents.parentId as parent_id from parents left outer join users on users.id  = parents.userId where userId = ${customer_id}`;
  parent_det = await query(qry);
  return parent_det;
};

//get invoice details
const GetInvoiceDetails = async (invoice_id) => {
  const sqld = `SELECT invoices.amount, invoices.invoiceId, invoices.tuition_invoice_id, invoices.createdDate as invoice_created_date, invoices.invoiceDate as invoice_due_date, users.id as user_id, users.name, users.parentId as cusromerparentid, customers.customerId as sageCustomerId, parents.parentId as sageParentId, users.email1 
      FROM invoices 
      INNER JOIN users ON invoices.customerId = users.id  
      left outer join customers on customers.userId = users.id
      left outer join parents on parents.userId = users.id
      WHERE invoices.id = ${invoice_id}`;
  const Getinvoice = await query(sqld);
  return Getinvoice;
};

//get invoice transaction details by transaction id
const getInvoiceTransactionDetails = async (transactionId) => {
  const invoiceTnxdetailsquert = `select transaction.refrenceId as rct_number, transaction. paidAmount, transaction.paymentMethod, transaction.createdAt as transaction_date, invoices.id, invoices.amount, invoices.amount_due, invoices.status, invoices.createdDate as invoice_created_date, invoices.invoiceDate as invoice_due_date, transaction.amex_order_Id as invoice_id, users.id as user_id, users.name, users.email1 as email, users.attentionTo, users.parentId as cusromerparentid, customers.customerId, parents.parentId, sagecreditnotes.amountMode as creditAmountMode, sagecreditnotes.amount as creditAmount
    FROM transaction
    inner join invoices on invoices.id = transaction.invoiceId
    inner join users on users.id = invoices.customerId
    left outer join customers on customers.userId = users.id
    left outer join parents on parents.userId = users.id
    left outer join sagecreditnotes on sagecreditnotes.id = transaction.creditNotesId
    where transaction.id = ${transactionId}`;
  const InvoiceTrxDet = await query(invoiceTnxdetailsquert);
  return InvoiceTrxDet;
};

//get invoice transaction details by transaction id
const getInvoiceTransactionDetailsByInvId = async (invoiceId) => {
  const invoiceTnxdetailsquert = `select transaction.refrenceId as rct_number, transaction. paidAmount, transaction.paymentMethod, transaction.createdAt as transaction_date, invoices.id, invoices.amount, invoices.amount_due, invoices.status, invoices.createdDate as invoice_created_date, invoices.invoiceDate as invoice_due_date, transaction.amex_order_Id as invoice_id, users.id as user_id, users.name, users.email1 as email, users.attentionTo, users.parentId as cusromerparentid, customers.customerId, parents.parentId, sagecreditnotes.amountMode as creditAmountMode, sagecreditnotes.amount as creditAmount 
    FROM transaction
    inner join invoices on invoices.id = transaction.invoiceId 
    inner join users on users.id = invoices.customerId 
    left outer join customers on customers.userId = users.id 
    left outer join parents on parents.userId = users.id 
    left outer join sagecreditnotes on sagecreditnotes.id = transaction.creditNotesId
    where transaction.amex_order_Id = "${invoiceId}"`;
  const InvoiceTrxDet = await query(invoiceTnxdetailsquert);
  return InvoiceTrxDet;
};

//get invoice details
const GetSalesOrderDetails = async (invoice_id) => {
  const sqld = `SELECT invoices.amount, invoices.sales_order_Id, invoices.createdDate as sales_order_created_date, users.name, customers.customerId as sageCustomerId, parents.parentId as sageParentId, users.email1 
      FROM invoices 
      INNER JOIN users ON invoices.customerId = users.id  
      left outer join customers on customers.userId = users.id
      left outer join parents on parents.userId = users.id
      WHERE invoices.id = ${invoice_id}`;
  const GetSalesOrderDet = await query(sqld);
  return GetSalesOrderDet;
};

//get invoice details
const GetEmailTemplates = async (emailtype) => {
  const sqld = `select id, templatename, emailtype, othertype, replytoname, replytoemail, status, enailsubject, emailbodytext from manageemailtemplate where manageemailtemplate.emailtype = "${emailtype}"`;
  const gettemp = await query(sqld);
  return gettemp;
};

module.exports = {
  purchaseInvoiceItemasDetails,
  CusromersParentDetails,
  GetInvoiceDetails,
  getInvoiceTransactionDetails,
  GetSalesOrderDetails,
  GetEmailTemplates,
  getInvoiceTransactionDetailsByInvId,
};

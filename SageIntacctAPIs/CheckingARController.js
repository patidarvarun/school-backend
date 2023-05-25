const util = require("util");
const { client, IA } = require("./IntacctClient");
const mysqlconnection = require("../DB/db.config.connection");
const {
  SageDownloadReceiptController,
} = require("../Controllers/reportsController");

const query = util.promisify(mysqlconnection.query).bind(mysqlconnection);
module.exports = {
  ARController: async (req, res) => {
    let recordId = req.body["RECORDNO"];

    let sagQuery = new IA.Functions.Common.Read();
    sagQuery.objectName = "ARPYMT";
    sagQuery.keys = [recordId];
    let new_key;
    let customer;
    let invoiceId;
    let status;
    let totalAmount;
    let totalDue;
    let sageCustomerId;
    let docNumber;
    var getinvoiceId;
    var getRCTNumber;
    var getSalesInvoice;
    var paymentMethod;
    var prBatch;
    let keyGen = () => {
      var i,
        key = "",
        characters =
          "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      var charactersLength = characters.length;
      for (i = 0; i < 5; i++) {
        key += characters.substr(
          Math.floor(Math.random() * charactersLength + 1),
          1
        );
      }
      return key;
    };

    let rendomTransactionId = keyGen();
    const response = await client.execute(sagQuery);
    const result = response.getResult();

    for (let index = 0; index < result._data.length; index++) {
      console.log(result._data[index], "result._data[index]");
      docNumber = result._data[index].DOCNUMBER;
      totalAmount = result._data[index].TOTALPAID;
      paymentMethod = result._data[index].PAYMENTMETHOD;
      prBatch = result._data[index].PRBATCH;
      new_key = result._data[index].ARPYMTDETAILS.ARPYMTDETAIL.RECORDKEY;
      creditNoteAddedOrNot =
        result._data[index].ARPYMTDETAILS.ARPYMTDETAIL.NEGATIVEINVOICEAMOUNT;
      arPaymentDetailsArray = result?._data[index]?.ARPYMTDETAILS?.ARPYMTDETAIL;
      let read = new IA.Functions.Common.Read();
      read.objectName = "ARINVOICE";
      read.keys = [new_key];
      const responsebyname = await client.execute(read);
      customer = responsebyname.getResult();
      let getPRBatch = prBatch?.slice(0, 8);

      if (arPaymentDetailsArray?.length) {
        for (let i = 0; i < arPaymentDetailsArray?.length; i++) {
          read.keys = [arPaymentDetailsArray[i].RECORDKEY];
          const responsebyname = await client.execute(read);
          customer = responsebyname.getResult();
          if (arPaymentDetailsArray[i].NEGATIVEINVOICEAMOUNT) {
            await creditNoteAmountUpdateInDb(customer);
          }
        }
        res.status(200).send("ok");
      }

      if (getPRBatch === "Reversed") {
        await revertInvoice(customer);
        console.log("ifff***********");
      } else {
        if (creditNoteAddedOrNot) {
          await creditNoteAmountUpdateInDb(customer);
        }
        console.log("else********");
        await checklocalDb(customer, recordId);
      }
    }

    async function creditNoteAmountUpdateInDb(data) {
      try {
        for (let index = 0; index < data._data.length; index++) {
          console.log(data._data[index], "data._data[index]");
          const getInvoiceIdFromPortalDb = await checkInvoiceIdExistInPortalDb(
            data._data[index]
          );
          if (getInvoiceIdFromPortalDb.length > 0) {
            // update existing credit notes
            console.log("updating");
            await updateCreditNotesQuery(data._data[index]);
          } else {
            // insert existing credit notes
            console.log("inserting");
            await insertCreditNotesQuery(data._data[index]);
          }
        }
      } catch (err) {
        res.status(400).send("Credit note updated failed");
      }
    }

    async function revertInvoice(data) {
      try {
        for (let index = 0; index < data._data.length; index++) {
          // console.log("revert111@@@@", data._data[index]);
          invoiceId = data._data[index].RECORDID;
          totalDue = data._data[index].TOTALDUE;
          status = data._data[index].STATE;
          sageCustomerId = data._data[index].CUSTOMERID;
        }
        await getInvoiceById(invoiceId);
        await getSalesInvoiceById(invoiceId);
        await getRCTNo(invoiceId);

        let rctno = getRCTNumber[0]?.refrenceId;
        let getsalesid = getSalesInvoice[0]?.id;
        let getinvoicebyid = getinvoiceId[0]?.id;

        if (getsalesid !== undefined) {
          let statuss = status === "Partially Paid" ? "Partially paid" : status;
          const updateQuery = `update invoices set status="${statuss}",amount_due="${totalDue}" where id ="${getsalesid}"`;

          // return false;
          await query(updateQuery);
        } else if (getinvoicebyid !== undefined) {
          let statuss = status === "Partially Paid" ? "Partially paid" : status;
          const updateQuery = `update invoices set status="${statuss}",amount_due="${totalDue}" where id ="${getinvoicebyid}"`;

          // return false;
          await query(updateQuery);
        }

        var transactionInsertQuery = `SELECT id FROM transaction WHERE paidAmount ="${totalDue}" AND amex_order_Id="${invoiceId}";`;
        const insetTransatction = await query(transactionInsertQuery);
        let getTransactionId = insetTransatction[0].id;

        var deleteTransactionId = `delete from transaction where id = ${getTransactionId}`;
        mysqlconnection.query(
          deleteTransactionId,
          async function (err, result) {
            if (err) throw err;
            res.status(200).json({
              message: "transaction deleted successfully",
              response: result,
            });
          }
        );
      } catch (error) {
        console.log("error", error);
      }
    }

    async function checklocalDb(data, recordId) {
      console.log("dataaaa", data);
      try {
        for (let index = 0; index < data._data.length; index++) {
          // console.log("@@@@@@@@@@@@@", data._data[index]);
          invoiceId = data._data[index].RECORDID;
          totalDue = data._data[index].TOTALDUE;
          status = data._data[index].STATE;
          sageCustomerId = data._data[index].CUSTOMERID;
        }
        await getInvoiceById(invoiceId);
        await getSalesInvoiceById(invoiceId);
        await getRCTNo(invoiceId);

        let rctno = getRCTNumber[0]?.refrenceId;
        let getsalesid = getSalesInvoice[0]?.id;
        let getinvoicebyid = getinvoiceId[0]?.id;

        console.log(
          getSalesInvoice,
          "totalDuetotalDue",
          totalDue,
          getinvoiceId
        );
        console.log(
          getsalesid,
          "totalAmounttotalAmount",
          totalAmount,
          getinvoicebyid
        );

        if (getsalesid !== undefined) {
          let statuss = status === "Partially Paid" ? "Partially paid" : status;
          const updateQuery = `update invoices set status="${statuss}",amount_due="${totalDue}" where id ="${getsalesid}"`;

          // return false;
          await query(updateQuery);
        } else if (getinvoicebyid !== undefined) {
          let statuss = status === "Partially Paid" ? "Partially paid" : status;
          const updateQuery = `update invoices set status="${statuss}",amount_due="${totalDue}" where id ="${getinvoicebyid}"`;

          // return false;
          await query(updateQuery);
        }

        // return false;
        let transactionId = `${paymentMethod}-${rendomTransactionId}`;
        const checktransactionId = await checkTransactionIdInPortalDB(recordId);
        if (checktransactionId.length > 0) {
          let checkLocalDb = await checkTransaction_id(
            checktransactionId[0]?.id
          );
          let checkRecordId = checkLocalDb[0]?.sageRecordKey;
          if (checkRecordId !== null) {
            await query(
              `update transaction set sageRecordKey = "${recordId}",paymentMethod="${paymentMethod}",totalAmount="${totalAmount}",paidAmount="${totalAmount}" where sageRecordKey = "${recordId}"`
            );
          } else {
            await query(
              `update transaction set sageRecordKey = "${recordId}",transactionId="${transactionId}",paymentMethod="${paymentMethod}",totalAmount="${totalAmount}",paidAmount="${totalAmount}" where sageRecordKey = "${recordId}"`
            );
          }
        } else {
          var transactionInsertQuery = `insert into transaction (invoiceId,paymentMethod ,transactionId,totalAmount,paidAmount,amex_order_Id,sageRecordKey) values(${getinvoicebyid},"${paymentMethod}","${transactionId}",${totalAmount},${totalAmount},"${invoiceId}","${recordId}")`;
          const insetTransatction = await query(transactionInsertQuery);
          const referenceNumber = generateRefrenceNumber(
            insetTransatction.insertId
          );

          const updateRefQuery = `update transaction set refrenceId = "${referenceNumber}" where id="${insetTransatction.insertId}"`;
          await query(updateRefQuery);
          console.log("@@@@@@@@@@@@@@", insetTransatction.insertId);
          SageDownloadReceiptController(insetTransatction.insertId);
        }
      } catch (error) {
        console.log("error", error);
      }
      // res.status(200).send(
      //   (data = {
      //     invoiceId: invoiceId,
      //     totalAmount: totalAmount,
      //     totalDue: totalDue,
      //     status: status,
      //   })
      // );
    }

    async function getInvoiceById(id) {
      getinvoiceId = await query(
        `SELECT id FROM invoices WHERE tuition_invoice_id="${id}"`
      );
      return getinvoiceId;
    }

    async function checkTransactionIdInPortalDB(id) {
      gettransactionId = await query(
        `SELECT id FROM transaction WHERE sageRecordKey ="${id}"`
      );
      return gettransactionId;
    }

    async function checkTransaction_id(idd) {
      get_transactionId = await query(
        `SELECT transactionId,sageRecordKey FROM transaction WHERE id ="${idd}"`
      );
      return get_transactionId;
    }

    async function getSalesInvoiceById(id) {
      getSalesInvoice = await query(
        `SELECT id FROM invoices WHERE invoiceId="${id}"`
      );
      return getSalesInvoice;
    }

    async function getRCTNo() {
      getRCTNumber = await query(
        `SELECT refrenceId FROM transaction where invoiceId="${getinvoiceId[0]?.id}"`
      );
      return getRCTNumber;
    }

    generateRefrenceNumber = (DBTransactionId) => {
      let gId = `${DBTransactionId.toString()}`;
      let tempRef = "RCT-000000000";
      let refrenceNumber = tempRef.slice(0, -gId.length);
      let finalGeneratedRefrenceNumber = refrenceNumber + gId;
      return finalGeneratedRefrenceNumber;
    };
  },
};

async function checkInvoiceIdExistInPortalDb(sageData) {
  const getInvoiceId = await query(
    `Select id from sagecreditnotes where sageInvoiceId = "${sageData.RECORDID}" AND sageCustomerId ="${sageData.CUSTOMERID}"`
  );

  return getInvoiceId;
}

async function getInvoiceIdBySageSourceId(sageInvoiceId) {
  const getInvoiceId = await query(
    `SELECT id FROM invoices WHERE invoiceId = "${sageInvoiceId}" OR tuition_invoice_id ="${sageInvoiceId}" OR sales_order_Id ="${sageInvoiceId}"`
  );
  return getInvoiceId;
}

async function getCustomerIdBySageCustomerId(sageCustomerId) {
  var getParentId;
  getParentId = await query(
    `SELECT userId FROM customers WHERE customerId = "${sageCustomerId}"`
  );

  if (getParentId.length === 0) {
    getParentId = await query(
      `SELECT userId FROM parents WHERE parentId = "${sageCustomerId}"`
    );
  } else {
    getParentId = await query(
      `SELECT parentId as userId FROM users WHERE id = "${getParentId[0].userId}"`
    );
  }
  return getParentId;
}

async function insertCreditNotesQuery(sageData) {
  let insertCreditNotes;

  // get customerId & invoiceId from portalDB check by sageData
  const customerIdInDB = await getCustomerIdBySageCustomerId(
    sageData?.CUSTOMERID
  );
  const invoiceIdInDB = await getInvoiceIdBySageSourceId(sageData?.RECORDID);

  console.log("Inserted credit notes in sageCreditNotes");
  if (customerIdInDB.length > 0) {
    insertCreditNotes = await query(
      `INSERT INTO sagecreditnotes (sageCustomerId,customerId,amount,amountMode,recordNo,docNo,docId,invoiceId,sageInvoiceId) VALUES("${sageData?.CUSTOMERID}","${customerIdInDB[0]?.userId}","${sageData?.TOTALPAID}",0,"${sageData?.RECORDNO}",null,null,"${invoiceIdInDB[0]?.id}","${sageData?.RECORDID}")`
    );
  } else {
    console.log("customer id not found at the time of insert credit note");
  }

  return insertCreditNotes;
}

async function updateCreditNotesQuery(sageData) {
  console.log("updated existing credit notes in sageCreditNotes");
  const insertCreditNotes = await query(
    `UPDATE sagecreditnotes SET amount="${sageData?.TOTALPAID}",amountMode=0 WHERE sageInvoiceId = "${sageData?.RECORDID}"`
  );

  return insertCreditNotes;
}

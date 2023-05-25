const { client, IA } = require("./IntacctClient");
const mysqlconnection = require("../DB/db.config.connection");
const util = require("util");
const query = util.promisify(mysqlconnection.query).bind(mysqlconnection);
module.exports = {
  getListOfCreditNote: async (req, res) => {
    try {
      let limit = 1000;
      let salquery = new IA.Functions.Common.ReadByQuery();

      salquery.objectName = "SODOCUMENT"; // Keep the count to just 1 for the example
      salquery.pageSize = limit;
      salquery.docParId = "Credit Note";
      const response = await client.execute(salquery);
      const result = response.getResult();
      let json_data = result.data;

      const numPage = Math.ceil(result.totalCount / limit);

      await insertCreditNotesInDbGetBySageIntacct(json_data);
      console.log(json_data, "json data");
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

        await insertCreditNotesInDbGetBySageIntacct(resultMore.data);
      }
      res.status(200).send("ok");
    } catch (error) {
      res.status(400).send({
        error: error.message,
      });
    }
  },

  getCreditNotesBySmartEvent: async (req, res) => {
    try {
      if (req.body) {
        let ItemsArr = [];

        ItemsArr.push(req.body);

        await insertCreditNotesInDbGetBySageIntacct(ItemsArr, req, res);
        res.status(200).send("OK");
      }
    } catch (error) {
      console.log("error", error);
      return error.message;
    }
  },
};

async function insertCreditNotesInDbGetBySageIntacct(sageIntacctData) {
  try {
    let insertCreditNotes;

    for (var j = 0; j < sageIntacctData.length; j++) {
      const recordNo = sageIntacctData[j]["RECORDNO"];

      let read = new IA.Functions.Common.Read();
      read.objectName = "SODOCUMENT";
      read.keys = [recordNo]; // get all credit notes

      const responsebyname = await client.execute(read);
      const creaditNoteResponse = responsebyname.getResult();

      // get sage data from sage RECORD_NO
      const creditNotes = creaditNoteResponse?._data[0];

      // get customerId from sageCustomerId
      const customerIdInDB = await getCustomerIdBySageCustomerId(
        creditNotes.CUSTVENDID
      );

      const CREATEDFROM_code = creditNotes.CREATEDFROM?.slice(
        creditNotes.CREATEDFROM?.indexOf("-") + 1
      );

      // get createdFrom_Id from sageIntacct
      const invoiceIdInDB = await getInvoiceIdBySageSourceId(CREATEDFROM_code);

      // check credit notes is already exists in db
      const getExistCreditNote = await checkSageCreditNotesAlreadyExistInDB(
        creditNotes?.DOCNO
      );

      if (getExistCreditNote.length > 0) {
        // update existing credit notes
        insertCreditNotes = await updateCreditNotesQuery(
          creditNotes,
          customerIdInDB,
          invoiceIdInDB,
          CREATEDFROM_code,
          getExistCreditNote[0]?.id
        );
      } else {
        // insert existing credit notes
        insertCreditNotes = await insertCreditNotesQuery(
          creditNotes,
          customerIdInDB,
          invoiceIdInDB,
          CREATEDFROM_code
        );
      }
    }

    return insertCreditNotes;
  } catch (error) {
    console.log("error", error);
  }
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

async function getInvoiceIdBySageSourceId(sageInvoiceId) {
  const getInvoiceId = await query(
    `SELECT id FROM invoices WHERE invoiceId = "${sageInvoiceId}" OR tuition_invoice_id ="${sageInvoiceId}" OR sales_order_Id ="${sageInvoiceId}"`
  );
  return getInvoiceId;
}

async function insertCreditNotesQuery(
  creditNotes,
  customerIdInDB,
  invoiceIdInDB,
  createdFrom
) {
  console.log(customerIdInDB, "insert");
  const insertCreditNotes = await query(
    `INSERT INTO sagecreditnotes (sageCustomerId,customerId,amount,recordNo,docNo,docId,invoiceId,sageInvoiceId) VALUES("${creditNotes?.CUSTVENDID}","${customerIdInDB[0]?.userId}","${creditNotes?.TOTAL}","${creditNotes?.RECORDNO}","${creditNotes?.DOCNO}","${creditNotes?.DOCID}","${invoiceIdInDB[0]?.id}","${createdFrom}")`
  );

  return insertCreditNotes;
}

async function updateCreditNotesQuery(
  creditNotes,
  customerIdInDB,
  invoiceIdInDB,
  createdFrom,
  creditNoteId
) {
  console.log(customerIdInDB, "update");
  const insertCreditNotes = await query(
    `UPDATE sagecreditnotes SET sageCustomerId = "${creditNotes?.CUSTVENDID}",customerId = "${customerIdInDB[0]?.userId}",amount = "${creditNotes?.TOTAL}",recordNo = "${creditNotes?.RECORDNO}",docNo = "${creditNotes?.DOCNO}",docId = "${creditNotes?.DOCID}",invoiceId = "${invoiceIdInDB[0]?.id}",sageInvoiceId = "${createdFrom}" WHERE id = "${creditNoteId}"`
  );

  return insertCreditNotes;
}

async function checkSageCreditNotesAlreadyExistInDB(sageDocNo) {
  const getExistCreditNote = await query(
    `SELECT id FROM sagecreditnotes WHERE docNo = "${sageDocNo}"`
  );
  return getExistCreditNote;
}

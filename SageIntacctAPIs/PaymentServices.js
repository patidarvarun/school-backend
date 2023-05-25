const mysqlconnection = require("../DB/db.config.connection");
const util = require("util");
const query = util.promisify(mysqlconnection.query).bind(mysqlconnection);
const { client, IA } = require("./IntacctClient");
module.exports = {
  createpaymentAndApplyOnARInvoice: async (req, res) => {
    try {
      const body = req.body;
      const {
        customerId,
        amount,
        ARinvoiceRecordNumber,
        referenceNumber,
        ARpaymentMethod,
      } = body;
      console.log(
        "req.body",
        ARinvoiceRecordNumber,
        referenceNumber,
        ARpaymentMethod
      );
      if (
        !customerId ||
        !ARinvoiceRecordNumber ||
        !referenceNumber ||
        !ARpaymentMethod
      ) {
        res.status(201).send({ message: "fileds are missing" });
        return;
      }
      let objectDate = new Date();
      let CreateDate =
        objectDate.getMonth() +
        1 +
        "/" +
        objectDate.getDate() +
        "/" +
        objectDate.getFullYear();
      // const record = new IA.Functions.AccountsReceivable.ArPaymentCreate();
      // record.customerId = "10381";
      // record.transactionPaymentAmount = 500.00;
      // record.receivedDate = new Date(CreateDate);
      // record.paymentMethod = "EFT";
      // record.bankAccountId = "100_SVB";
      // record.overpaymentLocationId = "100";
      // record.referenceNumber = "123456789";
      // const applyToRecordA = new IA.Functions.AccountsReceivable.ArPaymentItem();
      // applyToRecordA.applyToRecordId = 1352;
      // applyToRecordA.amountToApply = 75.00;
      let newDatee = req.body.ARreceiveONDate;
      let newPayDatee = req.body.ARpaymentONDate;
      //   let ARCardType = req.body.ARCardType;
      let ARCheckNo = req.body.ARCheckNo;
      let ARAuthCode = req.body.ARAuthCode;

      let check11 = newDatee === null ? new Date(CreateDate) : newDatee;
      let check22 = newPayDatee === null ? new Date(CreateDate) : newPayDatee;
      console.log(check11, "############", check22);
      const record = new IA.Functions.AccountsReceivable.ArPaymentCreate();
      console.log("recordd", record);
      record.customerId = customerId;
      record.transactionPaymentAmount = amount;
      record.receivedDate = newDatee === null ? new Date(CreateDate) : newDatee;
      record.paymentDate =
        newPayDatee === null ? new Date(CreateDate) : newPayDatee;
      record.paymentMethod = ARpaymentMethod;
      record.authorizationCode = ARAuthCode === null ? "" : ARAuthCode;
      //   record.cardType = ARCardType === null ? "" : ARCardType;
      record.checkNo = ARCheckNo === null ? "" : ARCheckNo;
      record.bankAccountId = "";
      record.undepositedFundsGlAccountNo = "10101";
      record.overpaymentLocationId = "100";
      record.referenceNumber = referenceNumber;
      const applyToRecordA =
        new IA.Functions.AccountsReceivable.ArPaymentItem();
      console.log("applyToRecordA", applyToRecordA);
      applyToRecordA.applyToRecordId = ARinvoiceRecordNumber;
      applyToRecordA.amountToApply = amount;
      record.applyToTransactions = [applyToRecordA];
      console.log("Payment Record", record);

      const response = await client.execute(record);
      const checkResponse = response.getResult();
      const cr_key = checkResponse._key;
      if (checkResponse) {
        const transactionupdateSql = `update transaction set sageRecordKey="${cr_key}" where refrenceId = "${referenceNumber}"`;
        console.log("transactionupdateSql", transactionupdateSql);
       await query(transactionupdateSql);
      }
      console.log(checkResponse, "checkResponse", checkResponse._key, response);
      // const result = response.getResult();
      let json_data = checkResponse.data;
      res.status(200).send(json_data);
    } catch (error) {
      console.log("result =>", error);
      res.status(400).send({ message: error.message });
    }
  },
};

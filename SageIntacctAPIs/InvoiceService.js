const { client, IA } = require("./IntacctClient");
module.exports = {
  createInstacctInvoice: async (req, res) => {
    try {
      let record = new IA.Functions.AccountsReceivable.InvoiceCreate();
      record.customerId = "10003";
      record.description = "Test invoice ";
      record.dueDate = new Date("9/2/2025");

      let line1 = new IA.Functions.AccountsReceivable.InvoiceLineCreate();
      // line1.lineNo = 1
      // line1.itemId = "CSS1006";
      // line1.memo =" test"

      console.log("invoice 4 ");
      // line1.lineItem.glAccountNumber = 10100
      // line1.lineItem.transactionAmount = 500.60
      console.log("invoice 5");

      record.lines = [line1];

      // create.transactionDate = new Date();
      // create.transactionCurrency = 'US'
      console.log("record =>", record);
      const createResponse = await client.execute(record).catch((error) => {
        console.log("error =>", error.message);
        res.send(error.message);
      });

      const createResult = createResponse.getResult();
      console.log("createResult => ", createResult);
      res.send(createResult);
    } catch (error) {
      return error.message;
    }
  },

  getInvoiceList: async (req, res) => {
    try {
      // let read = new IA.Functions.Common.Read();
      // read.objectName = "ARINVOICE";
      // read.keys = [
      //     '517'
      // ];
      // const inviocebyrecordNo = await client.execute(read);
      // const  invoicData= inviocebyrecordNo.getResult();
      // console.log("invoicData =>",invoicData._data);

      let query = new IA.Functions.Common.ReadByQuery();
      query.objectName = "ARINVOICE"; // Keep the count to just 1 for the example
      query.pageSize = 100;
      // query.fields=[ "RECORDID"]
      const response = await client.execute(query);
      const result = response.getResult();
      let json_data = result.data;
      res.status(200).send(json_data);
    } catch (error) {
      res.status(400).send({ message: error.message });
    }
  },

  updateInstacctInvoice: async (req, res) => {
    try {
      let record = new IA.Functions.AccountsReceivable.InvoiceUpdate();
      record.customerId = "10009";
      record.recordNo = "517";
      record.description = "Some description ";
      // record['STATE'] = "paid"
      record.dueDate = new Date("9/2/2028");

      const line1 = new IA.Functions.AccountsReceivable.InvoiceLineUpdate();
      line1.lineNo = 1;
      record.lines = [line1];
      const createResponse = await client.execute(record);
      const createResult = createResponse.getResult();
      res.send(createResult);
    } catch (error) {
      res.send(error.message);
    }
  },

  deleteInstacctInvoice: async (req, res) => {
    try {
      let deleteInvoice = new IA.Functions.AccountsReceivable.InvoiceDelete();
      deleteInvoice.recordNo = "517";
      const DeletedResponse = await client.execute(deleteInvoice);
      const deleteResult = DeletedResponse.getResult();
      console.log("deleteResult =>", deleteResult);
      res.send(deleteResult);
    } catch (error) {
      res.send(error.message);
    }
  },

  getARInvoiceRecordNumber: async (req, res) => {
    try {
      const { arInvoiceId } = req.body;
      console.log("ARInvoiceId =>", arInvoiceId);
      if (!arInvoiceId) {
        res.status(201).send({ message: "AR Inovice ID is required !" });
        return;
      }
      let query = new IA.Functions.Common.NewQuery.Query();
      query.fromObject = "ARINVOICE";
      let fields = [
        new IA.Functions.Common.NewQuery.QuerySelect.Field("RECORDNO"),
        //  new IA.Functions.Common.NewQuery.QuerySelect.Field('RECORDNO'),
      ];
      let filter = new IA.Functions.Common.NewQuery.QueryFilter.Filter(
        "RECORDID"
      ).equalTo(arInvoiceId);
      query.selectFields = fields;
      query.pageSize = 100;
      query.filter = filter;
      const response = await client.execute(query);
      const result = response.getResult();
      let json_data = result.data[0];
      res.status(200).send(json_data);
    } catch (error) {
      res.status(400).send({ message: error.message });
    }
  },

//   getCBQARInvoiceRecordNumber: async (arInvoiceId) => {
//     try {
//       // const { arInvoiceId } = req.body ;
//       console.log("ARInvoiceId =>", arInvoiceId);
//       // if(!arInvoiceId){
//       //     res.status(201).send({message:"AR Inovice ID is required !"});
//       //     return
//       // }
//       let query = new IA.Functions.Common.NewQuery.Query();
//       query.fromObject = "ARINVOICE";
//       let fields = [
//         new IA.Functions.Common.NewQuery.QuerySelect.Field("RECORDNO"),
//         //  new IA.Functions.Common.NewQuery.QuerySelect.Field('RECORDNO'),
//       ];
//       let filter = new IA.Functions.Common.NewQuery.QueryFilter.Filter(
//         "RECORDID"
//       ).equalTo(arInvoiceId);
//       query.selectFields = fields;
//       query.pageSize = 100;
//       query.filter = filter;
//       const response = await client.execute(query);
//       const result = response.getResult();
//       let json_data = result.data[0];
//       console.log("QQQQQQQQQQ", json_data);
//       return json_data;
//       // res.status(200).send(json_data)
//     } catch (error) {
//       console.log("error", error);
//       // res.status(400).send({message:error.message})
//     }
//   },
  getListARPayments: async (req, res) => {
    try {
      let query = new IA.Functions.Common.ReadByQuery();
      query.objectName = "ARPYMT"; // Keep the count to just 1 for the example
      query.pageSize = 100;
      const response = await client.execute(query);
      const result = response.getResult();
      let json_data = result.data;
      res.status(200).send(json_data);
    } catch (error) {
      res.status(400).send({
        message: error.message,
      });
    }
  },
};

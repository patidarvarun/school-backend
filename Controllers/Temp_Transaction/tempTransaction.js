const util = require("util");
const mysqlconnection = require("../../DB/db.config.connection");
const query = util.promisify(mysqlconnection.query).bind(mysqlconnection);
module.exports = {
  createTempTransaction: async (req, res) => {
    try {
      console.log("body =>", req.body);
      const { transaction_id, invoice_array } = req.body;
      const array_data = JSON.stringify(invoice_array);

      const invoicedata = `INSERT INTO temp_transaction(transaction_id,invoice_array)VALUES('${transaction_id}','${array_data}')`;

      mysqlconnection.query(invoicedata, function (err, respo) {
        if (err) console.log('error ',err); 
        res.status(200).send({
          data: respo,
          message: "Data insert successfully.",
        });
      });
    } catch (error) {
      res.status(400).send({
        message: error.message,
      });
    }
  },

  getTempTransactionByid: (req, res) => {
    const id = req.params.id;
    var sql = `select * from temp_transaction where id = '${id}'`;
    mysqlconnection.query(sql, function (err, result) {
      if (err) console.log('error ',err); 
      let data = {
        id: result[0].id,
        transaction_id: result[0].transaction_id,
        invoice_array: JSON.parse(result[0].invoice_array),
      };
      res.status(200).json({ message: "ok", data: data });
    });
  },

  deleteTempTransaction: async (req, res) => {
    let id = req.params.id;
    var sql = `delete FROM temp_transaction WHERE id = '${id}'`;
    mysqlconnection.query(sql, function (err, result) {
      if (err) console.log('error ',err); 
      res.status(200).json({ message: "ok", message: "delete transaction" });
    });
    // const item = await query(sql);
    // console.log('###########',item);
    // res.status(200).json({ message: "delete transaction" });
  },
};

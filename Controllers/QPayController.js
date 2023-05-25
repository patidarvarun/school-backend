const util = require("util");
const mysqlconnection = require("../DB/db.config.connection");
const query = util.promisify(mysqlconnection.query).bind(mysqlconnection);
module.exports = {
  QpayController: async (req, res) => {
    let amount = req.body["Response.Amount"];
    let pun = req.body["Response.PUN"];
    let ConfirmationID = req.body["Response.ConfirmationID"];
    let StatusMessage = req.body["Response.StatusMessage"];

    const firstTwoChars = pun?.slice(0, 2);
    if (firstTwoChars === "SO") {
      res
        .writeHead(301, {
          Location: `${process.env.REACTURL}/qpay_thankyou?amount=${amount}&PUN=${pun}&confirmationId=${ConfirmationID}&StatusMessage=${StatusMessage}`,
        })
        .end();
    } else {
      res
        .writeHead(301, {
          Location: `${process.env.REACTURL}/qpay_invoice_thankyou?amount=${amount}&PUN=${pun}&confirmationId=${ConfirmationID}&StatusMessage=${StatusMessage}`,
        })
        .end();
    }
  },
};

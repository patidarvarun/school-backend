const mysqlconnection = require("../DB/db.config.connection");
const util = require("util");
const query = util.promisify(mysqlconnection.query).bind(mysqlconnection);
const moment = require("moment");
const sendEmails = require("../Controllers/Helper/sendEmails");
const ChasingEmailFormat = require("../Controllers/Helper/chasingEmailTemp");
const { createInvoicePdf } = require("../Controllers/Helper/invoicepdf");
const {
  CusromersParentDetails,
} = require("../commonFunction/commonControllerFunction");
const { response } = require("express");

module.exports = {
  sendChasingEmails: async (req, res) => {
    const pendingTuitionInvoices = await getPendingTuitionInvoices();
    const getAllChasingEvents = await sendChasingEvents();

    var currDate = moment(new Date()).format("DD/MM/YYYY");

    for (let i = 0; i < pendingTuitionInvoices.length; i++) {
      for (let j = 0; j < getAllChasingEvents.length; j++) {
        const sendMailDate = moment()
          .add(getAllChasingEvents[j].days, "days")
          .format("DD/MM/YYYY");
		  const invoiceItem = await getItemsbyTuitionInvoiceId(
			  pendingTuitionInvoices[i].id
			  );
        const parentDetail = await CusromersParentDetails(
          pendingTuitionInvoices[i].customerId
        );
        await createInvoicePdf(
          [pendingTuitionInvoices[i]],
          invoiceItem,
          parentDetail
        );
        const ChasingEmailFormatResponse = await ChasingEmailFormat(
          [pendingTuitionInvoices[i]],
          invoiceItem
        );

        if (
          getAllChasingEvents[j].name === "After invoice issue date" &&
          pendingTuitionInvoices[i].createdDate === currDate &&
          currDate === sendMailDate
        ) {
          sendEmails(
            [pendingTuitionInvoices[i]].email1,
            "Invoice Details From QIS✔",
            ChasingEmailFormatResponse,
            (title = "INVOICE")
          );
          //   console.log("mail sent After invoice issue date",sendMailDate)
        } else if (
          getAllChasingEvents[j].name === "Before invoice due date" &&
          pendingTuitionInvoices[i].invoiceDate === currDate &&
          currDate === sendMailDate
        ) {
          sendEmails(
            [pendingTuitionInvoices[i]].email1,
            "Invoice Details From QIS✔",
            ChasingEmailFormatResponse,
            (title = "INVOICE")
          );
          // console.log("Before invoice due date",sendMailDate)
        } else if (
          getAllChasingEvents[j].name === "After invoice due date" &&
          pendingTuitionInvoices[i].invoiceDate === currDate &&
          currDate === sendMailDate
        ) {
          sendEmails(
            [pendingTuitionInvoices[i]].email1,
            "Invoice Details From QIS✔",
            ChasingEmailFormatResponse,
            (title = "INVOICE")
          );
          // console.log("After invoice due date",sendMailDate)
        } else if (
          getAllChasingEvents[j].name ===
            "Repeat reminder Before invoice due date" &&
          pendingTuitionInvoices[i].invoiceDate === currDate &&
          currDate === sendMailDate
        ) {
          sendEmails(
            [pendingTuitionInvoices[i]].email1,
            "Invoice Details From QIS✔",
            ChasingEmailFormatResponse,
            (title = "INVOICE")
          );
          // console.log("Repeat reminder Before invoice due date",sendMailDate)
        } else if (
          getAllChasingEvents[j].name ===
            "Repeat reminder After invoice due date" &&
          pendingTuitionInvoices[i].invoiceDate === currDate &&
          currDate === sendMailDate
        ) {
          sendEmails(
            [pendingTuitionInvoices[i]].email1,
            "Invoice Details From QIS✔",
            ChasingEmailFormatResponse,
            (title = "INVOICE")
          );
          // console.log("Repeat reminder After invoice due date",sendMailDate)
        } else if (
          getAllChasingEvents[j].name ===
            "Repeat reminder After invoice issue date" &&
          pendingTuitionInvoices[i].createdDate === currDate &&
          currDate === sendMailDate
        ) {
          sendEmails(
            [pendingTuitionInvoices[i]].email1,
            "Invoice Details From QIS✔",
            ChasingEmailFormatResponse,
            (title = "INVOICE")
          );
          //   console.log("Repeat reminder After invoice issue date",sendMailDate);
        }
      }
    }

	if(pendingTuitionInvoices.length > 0 && getAllChasingEvents.length > 0) {
		res.status(200).send({message: "Mail sent"});
	}else{
        res.status(400).send({ message: "Something went wrong, not getting invoice or chasing events" });
	}
  },
  getChasingTriggers: async (req, res) => {
    await query(`SELECT id, name FROM chasingtriggers`)
      .then((chasingtriggers) => {
        res.status(200).send(chasingtriggers);
      })
      .catch((err) => {
        res.status(400).send({ message: "Something went wrong" });
      });
  },
  addChasingTrigger: async (req, res) => {
    const { trigger_id, days, time } = req.body;
    if (trigger_id === "" || days === "" || time === "") {
      return res.status(400).send({ message: "All feild is required" });
    } else {
      var sql = `INSERT INTO chasingevents (trigger_id,days,time)VALUES("${trigger_id}","${days}","${time}")`;
      await query(sql, function (err, result) {
        if (err) throw err;
        res
          .status(201)
          .json({ message: "chasing event inserted", data: result });
      });
    }
  },
  getChasingEvents: async (req, res) => {
    await sendChasingEvents()
      .then((chasingevents) => {
        res.status(200).send(chasingevents);
      })
      .catch((err) => {
        res.status(400).send({ message: "Something went wrong", err });
      });
  },
  editChasingEvent: async (req, res) => {
    const getChasingEventIdResponse = await query(
      `select * from chasingevents where id = "${req.params.id}"`
    );
    const { trigger_id, days, time } = req.body;

    if (getChasingEventIdResponse.length > 0) {
      await query(
        `update chasingevents set trigger_id = "${trigger_id}", days = "${days}", time = ${time} where id = ${req.params.id}`
      )
        .then((chasingEventUpdate) => {
          res.status(200).send({
            message: "Event updated successfully",
            chasingEventUpdate,
          });
        })
        .catch((err) => {
          res.status(400).send({ message: "Something went wrong", err });
        });
    } else {
      res.status(400).send({ message: "Id not found" });
    }
  },
  delChasingEvent: async (req, res) => {
    const getChasingEventIdResponse = await query(
      `select * from chasingevents where id = "${req.params.id}"`
    );
    if (getChasingEventIdResponse.length > 0) {
      await query(`DELETE FROM chasingevents WHERE id="${req.params.id}"`)
        .then((chasingEventDelete) => {
          res.status(200).send({
            message: "Event deleted successfully",
            chasingEventDelete,
          });
        })
        .catch((err) => {
          res.status(400).send({ message: "Something went wrong", err });
        });
    } else {
      res.status(400).send({ message: "Id not found" });
    }
  },
};

async function getPendingTuitionInvoices() {
  const getTuitionInvoices = await query(
    `SELECT i.id, amount, i.status, invoiceDate , createdDate, itemId, tuition_invoice_id, note, customerId, quantity, name, email1 FROM invoices as i INNER JOIN users u on i.customerId = u.id WHERE i.status = 'Pending' AND tuition_invoice_id !="null" AND i.isDeleted =0`
  );
  return getTuitionInvoices;
}

async function sendChasingEvents() {
  const sendEvents = await query(
    `SELECT chasingevents.id, name ,days ,time FROM chasingevents INNER JOIN chasingtriggers ON chasingevents.trigger_id = chasingtriggers.id `
  );
  return sendEvents;
}

async function getItemsbyTuitionInvoiceId(invoiceId) {
  const getInvoiceItems = await query(
    `SELECT id, invoice_id, item_id, item_name, item_description, item_unit, quantity, item_price, item_total_price, itemId FROM invoice_items WHERE invoice_id = "${invoiceId}"`
  );
  return getInvoiceItems;
}

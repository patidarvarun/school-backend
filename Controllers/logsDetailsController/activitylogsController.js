const express = require("express");
const app = express();
const mysqlconnection = require("../../DB/db.config.connection");
const util = require("util");
const {
  createSageIntacctItem,
  getListOfItems,
} = require("../../SageIntacctAPIs/ItemServices");
const query = util.promisify(mysqlconnection.query).bind(mysqlconnection);

module.exports = {
  addActivityLogsController: (req, res) => {
    try {
      const { userid, message } = req.body;
      if (!userid) {
        return res.status(400).send({ message: "userId field is required" });
      }
      var sql = `INSERT INTO activity_logs(userid,message)VALUES("${userid}","${message}")`;
      mysqlconnection.query(sql, async function (err, result) {
        if (err) res.status(404);
        res
          .status(201)
          .json({ message: "Data inserted successfully", data: result });
      });
    } catch (err) {
      console.log(err, "catch");
    }
  },

  getActivityLogsController: async (req, res) => {
    const { name, email1 } = req.body;

    let byName = "";
    if (name) {
      byName = ` and name = "${name}"`;
    } else {
      byName = "";
    }

    let byEmail = "";
    if (email1) {
      byEmail = ` and email1 = "${email1}"`;
    } else {
      byEmail = "";
    }

    var sql = `select activity_logs.id, users.name as userName,users.email1 as userEmail, message, activity_logs.createdAt from activity_logs INNER JOIN users ON users.id = activity_logs.userid where 1=1 ${byName}${byEmail}`;

    mysqlconnection.query(sql, function (err, result) {
      if (err) throw err;
      res.status(200).json({ message: "ok", data: result });
    });
  },
};

const mysqlconnection = require("../../DB/db.config.connection");
const util = require("util");
const query = util.promisify(mysqlconnection.query).bind(mysqlconnection);

module.exports = {
  //add email type
  AddEmailType: async (req, res) => {
    const { emailtype } = req.body;
    if (!emailtype) {
      return res.status(400).send({ message: "emailtype is required" });
    }
    const check_query = `select emailtypes from emailtypes where emailtypes = "${emailtype}"`;
    mysqlconnection.query(check_query, function (err, result) {
      if (result.length == 0) {
        var sql = `INSERT INTO emailtypes (emailtypes,createdBy) VALUES('${emailtype}',1)`;
        mysqlconnection.query(sql, function (err, result) {
          if (err) throw err;
          res
            .status(201)
            .send({ message: "emailtype inserted successfully", data: result });
        });
      } else {
        res.status(409).send({ message: "emailtype Allready Registred" });
      }
    });
  },

  //get  email templates
  AddEmailTemplate: async (req, res) => {
    const {
      templatename,
      emailtype,
      othertype,
      replytoname,
      replytoemail,
      enailsubject,
      emailbodytext,
      createdBy,
    } = req.body;
    var sql = `INSERT INTO manageemailtemplate (templatename,emailtype,othertype,replytoname,replytoemail,enailsubject,emailbodytext, createdBy, status) VALUES('${templatename}','${emailtype}','${othertype}','${replytoname}','${replytoemail}','${enailsubject}','${emailbodytext}','${createdBy}','1')`;
    const getemailtemplates = await query(sql);
    res.status(200).json({ message: "ok", data: getemailtemplates });
  },

  //get  email templates
  GetEmailTemplate: async (req, res) => {
    let sql = `select id, templatename, emailtype, othertype, replytoname, replytoemail, status,enailsubject, emailbodytext from manageemailtemplate`;
    const getemailtemplates = await query(sql);
    res.status(200).json({ message: "ok", data: getemailtemplates });
  },

  //get email content by id
  GetEmailTemplateById: async (req, res) => {
    let sql = `select id, templatename, emailtype, othertype, replytoname, replytoemail, status, enailsubject, emailbodytext from manageemailtemplate where manageemailtemplate.id = ${req.params.id} `;
    const getemailtemplates = await query(sql);
    res.status(200).json({ message: "ok", data: getemailtemplates });
  },

  //get email types
  GetEmailtypes: async (req, res) => {
    let sql = `select DISTINCT(emailtypes) from emailtypes`;
    const getemailtypes = await query(sql);
    res.status(200).json({ message: "ok", data: getemailtypes });
  },

  //update email content
  UpdateEmailTemplate: async (req, res) => {
    const {
      templatename,
      emailtype,
      othertype,
      replytoname,
      replytoemail,
      enailsubject,
      emailbodytext,
    } = req.body;
    const updt_query = `update manageemailtemplate set templatename = "${templatename}",emailtype="${emailtype}", othertype="${othertype}", replytoname="${replytoname}", replytoemail="${replytoemail}", enailsubject="${enailsubject}", emailbodytext='${emailbodytext}' where manageemailtemplate.id = ${req.params.id}`;
    mysqlconnection.query(updt_query, function (err, result) {
      if (err) throw err;
      res.status(200).json({ message: "ok", data: result });
    });
  },
};

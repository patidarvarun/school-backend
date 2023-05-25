const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mysqlconnection = require("../../DB/db.config.connection");
const ResetEmailFormat = require("../Helper/templates/ResetEmailTemp");
const Passdsetconformationemail = require("../Helper/templates/Passdsetconformationemail");
const sendEmails = require("../Helper/sendEmails");
const moment = require("moment");
const ComposerTemplate = require("../Helper/templates/composerTemplate");
const {
  GetEmailTemplates,
} = require("../../commonFunction/commonControllerFunction");
const {
  ReplaceEmailTemplate,
} = require("../../commonFunction/connonfunctions");
module.exports = {
  // user login controller
  userlogincontroller: (req, res) => {
    const { email1, password, identifier } = req.body;
    const check_email_query = `select id, name, email1, password, status, roleId from  users where email1 = "${email1}" `;
    if (identifier) {
      mysqlconnection.query(check_email_query, function (err, result) {
        if (result?.length > 0) {
          const loginToken = jwt.sign(
            {
              email1: result[0].email1,
              id: result[0].id,
              name: result[0].name,
            },
            process.env.JWT_SECRET_KEY,
            {
              expiresIn: "4h",
            }
          );
          res.status(200).send({
            message: "User login successfully",
            loginToken: loginToken,
            data: {
              id: result[0].id,
              fname: result[0].name,
              email: result[0].email1,
              role_id: result[0].roleId,
              name: result[0].name,
            },
          });
        }
      });
    } else {
      if (!email1 || !password) {
        return res
          .status(400)
          .send({ message: "Email and Password field is required" });
      } else {
        mysqlconnection.query(check_email_query, function (err, result) {
          if (result?.length > 0) {
            bcrypt
              .compare(password, result[0]?.password)
              .then((responce) => {
                if (responce) {
                  const loginToken = jwt.sign(
                    {
                      email1: result[0].email1,
                      id: result[0].id,
                      name: result[0].name,
                    },
                    process.env.JWT_SECRET_KEY,
                    {
                      expiresIn: "4h",
                    }
                  );
                  res.status(200).send({
                    message: "User login successfully",
                    loginToken: loginToken,
                    data: {
                      id: result[0].id,
                      fname: result[0].name,
                      email: result[0].email1,
                      role_id: result[0].roleId,
                      name: result[0].name,
                    },
                  });
                } else {
                  res.status(400).send({ message: "invalid credentials1" });
                }
              })
              .catch((error) => {
                res.status(400).send({ message: error?.message });
              });
          } else {
            res.status(400).send({ message: "invalid credentials2" });
          }
        });
      }
    }
  },

  //forgot password controller
  forgotpasswordcontroller: async (req, res) => {
    const { email1 } = req.body;
    if (!email1) {
      return res.status(400).send({ message: "Email field is required" });
    }
    const check_email = `select id, email1, name from users where email1 = "${email1}" and parentId = 0`;
    mysqlconnection.query(check_email, async function (err, result) {
      if (result.length > 0) {
        //create reset password token
        const resetPasswordtoken = jwt.sign(
          { email1: result[0].email1, id: result[0].id, name: result[0].name },
          process.env.JWT_SECRET_KEY
        );
        //send emails
        const ReasetEmailTemp = await GetEmailTemplates(
          (emailtype = "Forgot_Password")
        );
        var translations = {
          customername: result[0].name,
          customeremail: email1,
          resetpasswordlink: `${process.env.REACTURL}/auth/reset_password.html?key=${resetPasswordtoken}`,
        };
        const translatedHtml = await ReplaceEmailTemplate(
          translations,
          ReasetEmailTemp[0].emailbodytext
        );
        sendEmails(email1, ReasetEmailTemp[0].enailsubject, translatedHtml);
        // const dt = await ResetEmailFormat(resetPasswordtoken);
        // sendEmails(email1, "Reset Password Link From QIS✔", dt);
        res.status(200).json({
          msg: "Link send successfully for reset password",
          data: result,
        });
      } else {
        res.status(401).json({ message: "Email Not Registred" });
      }
    });
  },

  //reset password controller
  resetpasswordcontroller: async (req, res) => {
    const { token, password } = req.body;
    if (!password || !token) {
      return res
        .status(400)
        .send({ message: "Password and Token is  Required" });
    }
    const secure_pass = await bcrypt.hash(password, 12);
    try {
      decodedtoken = jwt.verify(token, process.env.JWT_SECRET_KEY);
      if (decodedtoken) {
        const email1 = decodedtoken.email1;
        const name = decodedtoken.name;
        const id = decodedtoken.id;
        var check_email = `select id, email1,name from users where email1 = "${email1}"`;
        mysqlconnection.query(check_email, function (err, result) {
          if (result.length > 0) {
            const updtsql = `update users set password ="${secure_pass}" where email1 = "${result[0].email1}" and id = ${result[0].id}`;
            mysqlconnection.query(updtsql, async function (err, result) {
              if (err) throw err;
              //esnd emails
              const ReasetEmailTemp = await GetEmailTemplates(
                (emailtype = "Reset_Password")
              );
              var translations = {
                customername: name,
                loginurl: process.env.REACTURL,
              };
              const translatedHtml = await ReplaceEmailTemplate(
                translations,
                ReasetEmailTemp[0].emailbodytext
              );
              sendEmails(
                email1,
                ReasetEmailTemp[0].enailsubject,
                translatedHtml
              );
              // const dt = await Passdsetconformationemail(name);
              // sendEmails(email1, "Login Link From QIS✔", dt);
              res.status(200).json({
                message: "Password updated successfully",
              });
            });
          } else {
            res.status(400).json({ message: "Link Experied" });
          }
        });
      }
    } catch (err) {
      return res.status(400).send({ message: "Link Experied" });
    }
  },

  sendComposerMailcontroller: async (req, res) => {
    const { composer, subject, descontent } = req.body;
    let todaynewdate = moment(new Date()).format("MMM DD, YYYY");

    for (i = 0; i < composer.length; i++) {
      const newData = {
        subject: subject,
        descontent: descontent,
        name: composer[i]?.name,
        date: todaynewdate,
      };

      const mailsend = await ComposerTemplate(newData);
      sendEmails(composer[i]?.email1, subject, mailsend);
    }
    res.status(200).json({
      message: "Composer mail send successfully",
    });
  },
};

var { generateHashPass } = require("../Controllers/Helper/generatePassword");
const bcrypt = require("bcryptjs");
const mysqlconnection = require("../DB/db.config.connection");
const util = require("util");
const query = util.promisify(mysqlconnection.query).bind(mysqlconnection);
const jwt = require("jsonwebtoken");

const WelcomrEmailFormat = require("../Controllers/Helper/templates/welcomeEmailTemp");
const sendEmails = require("../Controllers/Helper/sendEmails");

console.log(generateHashPass);
module.exports = {
  sendWelcomeEmail: async (req, res) => {
    const genPass = JSON.parse(await generateHashPass());
    console.log("generatePassword", genPass);
    console.log(genPass.pass, genPass.encPass);

    const parent = await query(
      `SELECT id, name, email1  FROM users WHERE parentId = 0 and roleId =2 `
    );
    const parentLength = parent.length;
    for (let i = 0; i < parentLength; i++) {
      const custData = {
        name: parent[i].name,
        email: parent[i].email1,
        pass: genPass.pass,
      };
      const mailCont = WelcomrEmailFormat(custData);
      sendEmails(parent[i].email1, "Welcome From QIS✔", mailCont);
      
      await query(`update users set password ="${genPass.encPass}" where email1 = "${parent[i].email1}" and id = ${parent[i].id}`) 

      //const custData = { name: "Govind Namdev", email: "govind.mangoitsolutions@gmail.com", pass: genPass.pass };
      //sendEmails("govind.mangoitsolutions@gmail.com", "Welcome From QIS✔", mailCont);

    }
    res.status(200).send("OK");
  },
};

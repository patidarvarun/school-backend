const mysql = require("mysql");

//database info
const username = process.env.dbusername;
const password = process.env.password;
const dbname = process.env.dbname;

var mysqlconnection = mysql.createConnection({
  host: "localhost",
  user: username,
  password: password,
  database: dbname,
  charset: "utf8mb4",
  insecureAuth: true,
  acquireTimeout: 6000000,
});

mysqlconnection.connect((err) => {
  if (!err) {
    console.log("DB connected");
  } else {
    console.log(err);
  }
});
module.exports = mysqlconnection;

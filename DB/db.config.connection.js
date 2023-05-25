const mysql = require("mysql");

var mysqlconnection = mysql.createConnection({
  host: process.env.dbhostname,
  user: process.env.dbusername,
  password: process.env.password,
  database: process.env.dbname,
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

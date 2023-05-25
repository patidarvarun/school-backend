const express = require("express");
const nodeCron = require("node-cron");
const app = express();
const body_parser = require("body-parser");
const cors = require("cors");
require("dotenv").config();
const { createMonthlyReports } = require("./Controllers/reportsController");

//dependies middlewares
app.use(express.json());
app.use(cors());
app.use(body_parser.json());
app.use(body_parser.text());
app.use(body_parser.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));
app.use("/uploads", express.static("uploads"));
const dev = process.env.NODE_ENV === "production";

const PORT = process.env.PORT || 5003;

app.get("/", (req, res) => {
  res.send("working fine..");
});

//monthly reports
nodeCron.schedule("0 0 1 * *", async function () {
  createMonthlyReports();
});

//testing run this fun every 2 seconds
// nodeCron.schedule("*/2 * * * * *", async function () {
//     createMonthlyReports();
// });

//create server
app.listen(PORT, () => {
  console.log(`Server running at ${PORT}`);
});

//require database file connect db
require("./DB/db.config.connection");

//require routes file
const router = require("./Routers/Routers");
app.use("/api", router);

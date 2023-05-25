const bcrypt = require("bcryptjs");
const express = require("express");
const app = express();
const mysqlconnection = require("../../DB/db.config.connection");

module.exports = {
  //add activity controller
  addactivitycontroller: (req, res) => {
    //console.log(req.body, req.file);
    //console.log("image file", req.file);
    //console.log("data", req.body);
    if (!req.file) {
      return res.status(400).send({ message: "Image feild is required" });
    }
    if (
      req.file.originalname.split(".").pop() !== "png" &&
      req.file.originalname.split(".").pop() !== "jpeg"
    ) {
      return res
        .status(400)
        .send({ message: "Please upload png and jpeg image formats " });
    }
    const {
      name,
      description,
      shortdescription,
      type,
      price,
      startdate,
      enddate,
      status,
    } = req.body;
    if (
      !name ||
      !description ||
      !shortdescription ||
      !type ||
      !price ||
      !startdate ||
      !enddate ||
      !status
    ) {
      return res.status(400).send({ message: "All feild is required" });
    }
    const check_name_query = `select * from  activites where name = "${name}" `;
    mysqlconnection.query(check_name_query, function (err, result) {
      if (result.length > 0) {
        res.status(409).send({ message: "Activity allready registred" });
      } else {
        var sql = `INSERT INTO activites (name,image,description,shortdescription,type,price,startdate,enddate,status)VALUES("${name}","${req.file.path}","${description}","${shortdescription}","${type}",${price},"${startdate}","${enddate}","${status}")`;
        //console.log(sql);
        mysqlconnection.query(sql, function (err, result) {
          if (err) throw err;
          //console.log(result);
          res.status(201).json({ message: "data inserted", data: result });
        });
      }
    });
  },

  //get activity controller
  getactivitycontroller: (req, res) => {
    const { offset, limit } = req.body;
    //console.log(offset, limit);
    var sql = `select * from activites limit ${offset}, ${limit}`;
    //console.log(sql);
    mysqlconnection.query(sql, function (err, result) {
      if (err) throw err;
      //console.log(result);
      res.status(200).json({ message: "ok", data: result });
    });
  },

  //get activity details controller
  getactivitydetailscontroller: (req, res) => {
    const id = req.params.id;
    var sql = `select * from activites where id = ${id}`;
    //console.log(sql);
    mysqlconnection.query(sql, function (err, result) {
      if (err) throw err;
      //console.log(result);
      res.status(200).json({ message: "ok", data: result });
    });
  },

  //edit activity controller
  editactivitycontroller: (req, res) => {
    const id = req.params.id;
    //console.log(req.file, req.body);
    if (
      req.file.originalname.split(".").pop() !== "png" &&
      req.file.originalname.split(".").pop() !== "jpeg"
    ) {
      return res
        .status(400)
        .send({ message: "Please upload png and jpeg image formats " });
    }
    const {
      name,
      description,
      shortdescription,
      type,
      price,
      startdate,
      enddate,
      status,
    } = req.body;

    var selectsql = `select *from activites where id = ${id}`;
    //console.log(selectsql);
    mysqlconnection.query(selectsql, function (err, result) {
      //console.log(result);
      if (result.length > 0) {
        let new_name,
          new_desc,
          new_short_desc,
          new_type,
          new_price,
          new_start_date,
          new_end_date,
          new_status;

        if (name !== "") {
          new_name = name;
        } else {
          new_name = result[0].name;
        }
        if (description !== "") {
          new_desc = description;
        } else {
          new_desc = result[0].description;
        }
        if (shortdescription !== "") {
          new_short_desc = shortdescription;
        } else {
          new_short_desc = result[0].shortdescription;
        }
        if (type !== "") {
          new_type = type;
        } else {
          new_type = result[0].type;
        }
        if (price !== "") {
          new_price = price;
        } else {
          new_price = result[0].price;
        }
        if (startdate !== "") {
          new_start_date = startdate;
        } else {
          new_start_date = result[0].startdate;
        }
        if (enddate !== "") {
          new_end_date = enddate;
        } else {
          new_end_date = result[0].enddate;
        }
        if (status !== "") {
          new_status = status;
        } else {
          new_status = result[0].status;
        }

        const updt_query = `update activites set name = "${new_name}", description = "${new_desc}", shortdescription = "${new_short_desc}", type = "${new_type}", price = ${new_price}, startdate = "${new_start_date}", enddate = "${new_end_date}", status = "${new_status}" where id = ${id}`;
        console.log(updt_query);
        mysqlconnection.query(updt_query, function (err, result) {
          //console.log(result);
          if (err) throw err;
          //console.log(result);
          res
            .status(200)
            .json({ message: "data updated successfully", data: result });
        });
      }
    });
  },

  //delete user controller
  deleteactivitycontroller: (req, res) => {
    const id = req.params.id;
    var sql = `delete from activites where id = ${id}`;
    //console.log(sql);
    mysqlconnection.query(sql, function (err, result) {
      if (err) throw err;
      //console.log(result);
      res
        .status(200)
        .json({ message: "data deleted successfully", responce: result });
    });
  },
};

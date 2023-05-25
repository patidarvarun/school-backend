const express = require("express");
const app = express();
const moment = require("moment");
const mysqlconnection = require("../../DB/db.config.connection");
const util = require("util");
const {
  createSageIntacctItem,
  deleteSageIntacctItemAsActivity,
  updateSageIntacctItemAsActivity,
  getListOfItems,
} = require("../../SageIntacctAPIs/ItemServices");
const query = util.promisify(mysqlconnection.query).bind(mysqlconnection);

module.exports = {
  //add activity controller
  addActivityController: (req, res) => {
    const {
      name,
      description,
      short_description,
      type,
      price,
      startdate,
      enddate,
      status,
    } = req.body;
    if (!name || !type || !startdate || !enddate || !status) {
      return res.status(400).send({ message: "All field is required" });
    }
    console.log(req.body, "reqDatareqDatareqData", description);
    const sDate = startdate.split(".");
    const eDate = enddate.split(".");
    // var start = moment("2013-11-03");
    // var end = moment("2013-11-04");
    var start = moment(`"${sDate[0]}-${sDate[1]}-${sDate[2]}"`);
    var end = moment(`"${eDate[0]}-${eDate[1]}-${eDate[2]}"`);
    const numberOfDays = end.diff(start, "days");
    const check_name_query = `select id, name from  items where name = "${name}"`;
    mysqlconnection.query(check_name_query, function (err, result) {
      if (err) throw err;
      if (result.length > 0) {
        res.status(409).send({ message: "Activity Name already registred" });
      } else {
        var sql = `INSERT INTO items (name,type,price,startdate,enddate,status,description,short_description,product_line_id)VALUES("${name}","${type}",${price},"${startdate}","${enddate}","${status}","${description}","${short_description}","activities")`;
        console.log( "sql ",sql )
        mysqlconnection.query(sql, async function (err, result) {
          if (err) throw err;

          // var sql = `INSERT INTO items (name,description,price) VALUES('${name}','${description}','${price}')`;
          // const item = await query(sql);
          let itemId = "";
          if (status === "Active") {
            const intacctItem = {
              id: name,
              name: name,
              price: price,
              itemType: "Inventory",
              produceLineId: "Activities",
              itemGlGroupName: "Accessories",
              short_description: short_description,
              description: description,
              numberOfDays: numberOfDays === 0 ? 1 : numberOfDays,
            };
            console.log("addActivityController", intacctItem)
            const sageIntacctItem = await createSageIntacctItem(intacctItem);
            itemId = sageIntacctItem?._data[0]["ITEMID"];
            if (itemId) {
              const updateSql = `UPDATE items SET itemID = "${itemId}" WHERE id="${result.insertId}"`;
              const updateItem = await query(updateSql);
            } else {
              res.status(201).send({
                message: `I${result.insertId} already registerd in sage intacct`,
              });
            }
          }

          res.status(201).json({
            message: "Data inserted successfully",
            data: result,
            itemid: itemId,
          });
        });
      }
    });
  },

  //get activity controller
  getActivityController: async (req, res) => {
    const { status, type } = req.body;
    let byStatus = "";
    if (status === "Active") {
      byStatus = ` and status = "${status}"`;
    } else if (status === "Upcoming") {
      byStatus = ` and status = "${status}"`;
    } else if (status === "Draft") {
      byStatus = ` and status = "${status}"`;
    } else {
      byStatus = "";
    }
    let byType = "";
    if (type === "Free") {
      byType = ` and type = "${type}"`;
    } else if (type === "Paid") {
      byType = ` and type = "${type}"`;
    } else {
      byType = "";
    }

    var sql = `select id, name, type, status,short_description, description,startDate, endDate, price  from items where product_line_id ='activities' OR product_line_id ='Activities' ${byStatus}${byType}`;
    // var sql = `select activites.id , activites.name, activites.type, activites.status,short_description, activites.description,startDate, endDate, activites.price,items.itemId ,items.id as Iid,items.price as Iprice,items.description as Idescription ,items.name as Iname,items.activityId  from activites,items where items.activityId = activites.id and  1=1 ${byStatus}${byType} `;
    //  const schedulerExist = await getListOfItems();
    mysqlconnection.query(sql, function (err, result) {
      if (err) throw err;
      res.status(200).json({ message: "ok", data: result });
    });
  },

  //get activity details controller
  getActivityDetailsController: (req, res) => {
    const id = req.params.id;
    var sql = `select id, name,short_description,description, type, status, startDate, endDate, price from items where id = ${id}`;
    mysqlconnection.query(sql, function (err, result) {
      if (err) {
        res.status(400).json({ message: "ok", data: result });
      } else {
        res.status(200).json({ message: "ok", data: result });
      }
    });
  },

  getActivityDataController: (req, res) => {
    const id = req.params.id;
    // var sql = `select activites.id as id,activites.name as name,activites.short_description as short_description,activites.description as description, type, status, startDate, endDate,activites.price as price,items.id as Iid from activites,items where activites.id = ${id} and items.activityId =activites.id`;

    var sql = `select items.id as id,items.name as name,items.short_description as short_description,items.description as description, type, status, startDate, endDate,items.price as price,items.id as Iid from items where items.id = ${id}`;

    mysqlconnection.query(sql, function (err, result) {
      if (err) {
        res.status(400).json({ message: "ok", data: result });
      } else {
        res.status(200).json({ message: "ok", data: result });
      }
    });
  },

  //edit activity controller
  editActivityController: async (req, res) => {
    const id = req.params.id;
    // if (
    //   req.file.originalname.split(".").pop() !== "png" &&
    //   req.file.originalname.split(".").pop() !== "jpeg"
    // ) {
    //   return res
    //     .status(400)
    //     .send({ message: "Please upload png and jpeg image formats " });
    // }
    const {
      name,
      type,
      price,
      startdate,
      enddate,
      status,
      short_description,
      description,
    } = req.body;

    

    const updt_query = `update items set name = "${name}",type = "${type}", price = ${price}, startdate = "${startdate}", enddate = "${enddate}", status = "${status}",short_description="${short_description}",description="${description}" where id = ${id}`;
    mysqlconnection.query(updt_query, async function (err, result) {
      if (err) throw err;

      const alreadyActivesql = `select * from items where id=${id} `;
      const alreadyActivesqlRes = await query(alreadyActivesql);

      let itemId;
      if (alreadyActivesqlRes[0].status === "Draft" && status === "Active") {
        const sDate = alreadyActivesqlRes[0].startdate.split(".");
        const eDate = alreadyActivesqlRes[0].enddate.split(".");
        var start = moment(`"${sDate[0]}-${sDate[1]}-${sDate[2]}"`);
        var end = moment(`"${eDate[0]}-${eDate[1]}-${eDate[2]}"`);
        const numberOfDays = end.diff(start, "days");
        const intacctItem = {
          id: name,
          name: name,
          price: price,
          itemType: "Inventory",
          produceLineId: "Activities",
          itemGlGroupName: "Accessories",
          short_description: alreadyActivesqlRes[0].short_description,
          description: alreadyActivesqlRes[0].description,
          //numberOfDays: numberOfDays === 0 ? 1 : numberOfDays,
        };

        const sageIntacctItem = await createSageIntacctItem(intacctItem);
        itemId = sageIntacctItem?._data[0]["ITEMID"];
        const updateSql = `UPDATE items SET  itemID = "${itemId}" WHERE id="${id}"`;
        const updateItem = await query(updateSql);
      } else {
        const getItemIDQuery = `SELECT itemID FROM items where id = "${id}"`;
        itemId = await query(getItemIDQuery);
        const itemUpdateQuery = `update items set name="${name}",description="${description}",price =${price} where id ="${id}"`;
        const updateItemAsActivity = await query(itemUpdateQuery);
        const active = status === "active" ? true : false;
        const data = {
          itemId: itemId[0].itemID,
          itemName: name,
          active: active,
          basePrice: price,
        };
        const update = await updateSageIntacctItemAsActivity(data);
      }

      res.status(200).json({
        message: "data updated successfully",
        data: result,
        itemid: itemId,
      });
    });
  },

  //delete activity controller
  deleteActivityController: async (req, res) => {
    const id = req.params.id;
    const getItemIDQuery = `SELECT itemID FROM items where id = "${id}"`;
    const itemId = await query(getItemIDQuery);
    await deleteSageIntacctItemAsActivity(itemId[0]?.itemID);
    var sql = `delete from items where id = ${id}`;
    // const deleteItemAsActivity = `delete from items where  activityId = "${id}"`;

    mysqlconnection.query(sql, async function (err, result) {
      if (err) throw err;

      // const deleteActivityItem = await query(deleteItemAsActivity);
      res.status(200).json({
        message: "data deleted successfully",
        responce: result,
        itemid: itemId[0].itemID,
      });
    });
  },
};

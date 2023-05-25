const { client, IA } = require("./IntacctClient");
const mysqlconnection = require("../DB/db.config.connection");
const util = require("util");
const query = util.promisify(mysqlconnection.query).bind(mysqlconnection);
module.exports = {
  getListOfItems: async (req, res) => {
    try {
      let limit = 1000;
      let itmquery = new IA.Functions.Common.ReadByQuery();
      itmquery.objectName = "ITEM"; // Keep the count to just 1 for the example
      itmquery.pageSize = limit;

      const response = await client.execute(itmquery);
      const result = response.getResult();
      let json_data = result.data;

      const numPage = Math.ceil(result.totalCount / limit);

      await isItemsExistInDB(json_data, req, res);
      let i = 1;
      while (
        result.numRemaining > 0 &&
        i < numPage &&
        result.resultId != null
      ) {
        i++;
        let more = new IA.Functions.Common.ReadMore();
        more.resultId = result.resultId;

        const responseMore = await client.execute(more);
        const resultMore = responseMore.getResult();

        await isItemsExistInDB(resultMore.data, req, res);
      }

      res.status(200);
    } catch (error) {
      res.status(400).send({
        error: error.message,
      });
    }
  },
  getListOfItemsByFilter: async (req, res) => {
    try {
      let query = new IA.Functions.Common.NewQuery.Query();
      query.fromObject = "ITEM";
      let fields = [
        new IA.Functions.Common.NewQuery.QuerySelect.Field("ITEMID"),
        new IA.Functions.Common.NewQuery.QuerySelect.Field("NAME"),
        new IA.Functions.Common.NewQuery.QuerySelect.Field("STATUS"),
        new IA.Functions.Common.NewQuery.QuerySelect.Field("GLGROUP"),
        new IA.Functions.Common.NewQuery.QuerySelect.Field("BASEPRICE"),
        new IA.Functions.Common.NewQuery.QuerySelect.Field("PRODUCTLINEID"),
      ];
      let filter = new IA.Functions.Common.NewQuery.QueryFilter.Filter(
        "PRODUCTLINEID"
      ).notEqualTo("''");
      query.selectFields = fields;
      query.pageSize = 100;
      query.filter = filter;
      const response = await client.execute(query);
      const result = response.getResult();
      let json_data = result.data;
      res.status(200).send(json_data);
    } catch (error) {
      res.status(400).send({
        error: error.message,
      });
    }
  },

  createSageIntacctItem: async (data) => {
    try {
      let record = new IA.Functions.InventoryControl.ItemCreate();
      // record.controlId = "unittest";
      record.itemId = `I${data.name}`;
      record.itemName = data.name;
      record.itemType = data.itemType;
      record.itemGlGroupName = data.itemGlGroupName;
      record.produceLineId = data.produceLineId;
      record.basePrice = data.price;
      record.itemStartEndDateEnabled = true;
      record.periodsMeasuredIn = "Days";
      record.numberOfPeriods = parseInt(data.numberOfDays);
      // record.purchasingDescription = data.description;
      // record.extendedDescription = data.description;
      // record.salesDescription = data.description;
      record.purchasingDescription = "";
      record.extendedDescription = "";
      record.salesDescription = "";
      const createResponse = await client.execute(record).catch((error) => {
        console.log("error.message", error.message);
        return error.message;
      });
      const createResult = createResponse.getResult();
      return createResult;
    } catch (error) {
      console.log("error", error);
      return error.message;
    }
  },

  updateSageIntacctItem: async (req, res) => {
    try {
      const body = req.body;
      const itemid = body.itemId;
      if (!itemid) {
        res.status(201).send({ message: "item id is required !" });
        return;
      }
      let record = new IA.Functions.InventoryControl.ItemUpdate();
      const keys = Object.keys(body);
      for (var i = 0; i < keys.length; i++) {
        record[keys[i]] = body[keys[i]];
      }

      const createResponse = await client.execute(record).catch((error) => {
        res.send(error.message);
        return;
      });
      const createResult = createResponse.getResult();
      res.send(createResult);
    } catch (error) {
      res.send(error.message);
    }
  },
  deleteSageIntacctItem: async (req, res) => {
    try {
      const itemid = req.body.itemid;
      if (!itemid) {
        res.status(201).send({ message: "item id is required !" });
        return;
      }
      let record = new IA.Functions.InventoryControl.ItemDelete();
      record.itemId = itemid;
      const createResponse = await client.execute(record);

      const createResult = createResponse.getResult();
      res.status(200).send(createResult);
    } catch (error) {
      res.status(400).send(error.message);
    }
  },

  deleteSageIntacctItemAsActivity: async (itemId) => {
    try {
      if (!itemId) {
        res.status(201).send({ message: "item id is required !" });
        return;
      }
      let record = new IA.Functions.InventoryControl.ItemDelete();
      record.itemId = itemId;
      const createResponse = await client.execute(record);
      const createResult = createResponse.getResult();
      return createResult;
    } catch (error) {
      return error.message;
    }
  },
  updateSageIntacctItemAsActivity: async (data) => {
    try {
      const itemid = data.itemId;
      if (!itemid) {
        res.status(201).send({ message: "item id is required !" });
        return;
      }
      let record = new IA.Functions.InventoryControl.ItemUpdate();
      const keys = Object.keys(data);
      for (var i = 0; i < keys.length; i++) {
        record[keys[i]] = data[keys[i]];
      }

      const createResponse = await client.execute(record);
      const createResult = createResponse.getResult();
      return createResult;
    } catch (error) {
      return error.message;
    }
  },

  getItemBySmartEvent: async (req, res) => {
    try {
      // const Items_array = req.body.split("&");
      // let ItemsObj = {};
      // //let ItemsArr = [];

      // for (var i = 0; i < Items_array.length; i++) {
      //   let Item = Items_array[i].split("=");

      //   if (Item.length == 2) {
      //     ItemsObj[Item[0]] = Item[1];
      //   }
      // }

      // //ItemsArr.push(ItemsObj);
      if (req.body) {
        await isItemExistInDB(JSON.stringify(req.body), req, res);
        res.status(200).send("OK");
      }
    } catch (error) {
      return error.message;
    }
  },

  /****** Product Line *********/
  getProductLineBySmartEvent: async (req, res) => {},
  getListOfProductLines: async (req, res) => {
    try {
      let query = new IA.Functions.Common.ReadByQuery();
      query.objectName = "PRODUCTLINE";
      query.pageSize = 1000; // Keep the count to just 2 for the example
      query.fields = ["RECORDNO"];
      const response = await client.execute(query);
      const result = response.getResult();
      let json_data = result.data;
      console.log("getListOfProductLines ", result);
      await manageProductLinesInDB(json_data, req, res);
      res.status(200).send("OK");
    } catch (error) {
      res.status(400).send({
        error: error.message,
      });
    }
  },
};

async function isItemsExistInDB(sageIntacctItems, req, res) {
  try {
    let alreadyItemsInDB = [];

    const alreadyDBItem = `SELECT items.itemID AS itemID FROM items where items.itemID IS NOT NULL`;
    const DBitem = await query(alreadyDBItem);
    for (var k = 0; k < DBitem.length; k++) {
      alreadyItemsInDB.push(DBitem[k]["itemID"]);
    }

    for (var j = 0; j < sageIntacctItems.length; j++) {
      const item = sageIntacctItems[j];

      let startDate = "";
      let endDate = "";

      const toogleOfTime = item["TERMPERIOD"];
      const totalNumberOfPeriods = item["TOTALPERIODS"];
      const itemCreatedDate = item["WHENCREATED"];

      const now = new Date(itemCreatedDate);
      let nowdatesplit = now.toISOString().split("T")[0];
      nowdatesplit = nowdatesplit.split("-");
      startDate =
        nowdatesplit[0] + "." + nowdatesplit[1] + "." + nowdatesplit[2];

      if (toogleOfTime === "Days" && totalNumberOfPeriods != "") {
        const nextdays = new Date(
          now.setDate(now.getDate() + parseInt(totalNumberOfPeriods))
        );
        let enddatesplit = nextdays.toISOString().split("T")[0];
        enddatesplit = enddatesplit.split("-");
        endDate =
          enddatesplit[0] + "." + enddatesplit[1] + "." + enddatesplit[2];
      }
      if (toogleOfTime === "Weeks" && totalNumberOfPeriods != "") {
        const nextweekNumber = parseInt(6 * totalNumberOfPeriods);
        const nextweekdate = new Date(
          now.setDate(now.getDate() - (now.getDay() - 1) + nextweekNumber)
        );
        let enddatesplit = nextweekdate.toISOString().split("T")[0];
        enddatesplit = enddatesplit.split("-");
        endDate =
          enddatesplit[0] + "." + enddatesplit[1] + "." + enddatesplit[2];
      }
      if (toogleOfTime === "Months" && totalNumberOfPeriods != "") {
        const nextmonthNumber = parseInt(30 * totalNumberOfPeriods);
        const nextmonthdate = new Date(
          now.setDate(now.getDate() - (now.getMonth() - 1) + nextmonthNumber)
        );
        let enddatesplit = nextmonthdate.toISOString().split("T")[0];
        enddatesplit = enddatesplit.split("-");
        endDate =
          enddatesplit[0] + "." + enddatesplit[1] + "." + enddatesplit[2];
      }
      if (toogleOfTime === "Years" && totalNumberOfPeriods != "") {
        const nextyearNumber = parseInt(totalNumberOfPeriods);
        const nextyeardate = new Date(
          now.setFullYear(now.getFullYear() + nextyearNumber)
        );
        let enddatesplit = nextyeardate.toISOString().split("T")[0];
        enddatesplit = enddatesplit.split("-");
        endDate =
          enddatesplit[0] + "." + enddatesplit[1] + "." + enddatesplit[2];
      }

      if (alreadyItemsInDB.includes(sageIntacctItems[j]["ITEMID"])) {
        const itemExist = `select id from items where itemID ="${item["ITEMID"]}"`;
        const itemExistResponse = await query(itemExist);
        if (itemExistResponse.length > 0) {
          //const updateSql = `UPDATE items SET  name = "${item["NAME"]}", description="${item["EXTENDED_DESCRIPTION"]}", price="${item["BASEPRICE"]}", type="Paid", status="${item["STATUS"]}", short_description = "${item["SODESCRIPTION"]}", startdate="${startDate}", enddate="${endDate}", product_line_id="${item["PRODUCTLINEID"]}" WHERE itemID="${item["ITEMID"]}"`;
          const updateSql = `UPDATE items SET  name = "${item["NAME"]}", description="${item["EXTENDED_DESCRIPTION"]}", price="${item["BASEPRICE"]}", type="Paid", status="${item["STATUS"]}", short_description = "${item["SODESCRIPTION"]}", product_line_id="${item["PRODUCTLINEID"]}" WHERE itemID="${item["ITEMID"]}"`;
          const insert = await query(updateSql);
        } else {
          //const InsertSql = `INSERT INTO items (name,description,price,itemID, product_line_id, type,status,short_description,startdate,enddate) VALUES("${item["NAME"]}","${item["EXTENDED_DESCRIPTION"]}","${item["BASEPRICE"]}","${item["ITEMID"]}", "${item["PRODUCTLINEID"]}", "Paid", "${item["STATUS"]}", "${item["SODESCRIPTION"]}","${startDate}","${endDate}")`;
          const InsertSql = `INSERT INTO items (name,description,price,itemID, product_line_id, type,status,short_description) VALUES("${item["NAME"]}","${item["EXTENDED_DESCRIPTION"]}","${item["BASEPRICE"]}","${item["ITEMID"]}", "${item["PRODUCTLINEID"]}", "Paid", "${item["STATUS"]}", "${item["SODESCRIPTION"]}")`;
          const insert = await query(InsertSql);
        }
      } else {
        //const InsertSql = `INSERT INTO items (name,description,price,itemID, product_line_id, type,status,short_description,startdate,enddate) VALUES("${item["NAME"]}","${item["EXTENDED_DESCRIPTION"]}","${item["BASEPRICE"]}","${item["ITEMID"]}", "${item["PRODUCTLINEID"]}", "Paid", "${item["STATUS"]}", "${item["SODESCRIPTION"]}" ,"${startDate}","${endDate}")`;
        const InsertSql = `INSERT INTO items (name,description,price,itemID, product_line_id, type,status,short_description) VALUES("${item["NAME"]}","${item["EXTENDED_DESCRIPTION"]}","${item["BASEPRICE"]}","${item["ITEMID"]}", "${item["PRODUCTLINEID"]}", "Paid", "${item["STATUS"]}", "${item["SODESCRIPTION"]}" )`;

        const insert = await query(InsertSql);
      }
    }
    res.status(200).send("OK");
  } catch (error) {
    return error.message;
  }
}

async function isItemExistInDB(sageIntacctItem, req, res) {
  try {
    let alreadyItemsInDB = [];

    const alreadyDBItem = `SELECT items.itemID AS itemID FROM items where items.itemID IS NOT NULL`;
    const DBitem = await query(alreadyDBItem);
    for (var k = 0; k < DBitem.length; k++) {
      alreadyItemsInDB.push(DBitem[k]["itemID"]);
    }

    //for (var j = 0; j < sageIntacctItems.length; j++) {

    const item = JSON.parse(sageIntacctItem);

    let startDate = "";
    let endDate = "";

    const toogleOfTime = item.TERMPERIOD;
    const totalNumberOfPeriods = item.TOTALPERIODS;
    let itemCreatedDate = decodeURIComponent(item.WHENCREATED);
    itemCreatedDate = itemCreatedDate.replace("+", " ");

    const now = new Date(itemCreatedDate);
    let nowdatesplit = now.toISOString().split("T")[0];
    nowdatesplit = nowdatesplit.split("-");
    startDate = nowdatesplit[0] + "." + nowdatesplit[1] + "." + nowdatesplit[2];

    if (toogleOfTime === "Days" && totalNumberOfPeriods != "") {
      const nextdays = new Date(
        now.setDate(now.getDate() + parseInt(totalNumberOfPeriods))
      );
      let enddatesplit = nextdays.toISOString().split("T")[0];
      enddatesplit = enddatesplit.split("-");
      endDate = enddatesplit[0] + "." + enddatesplit[1] + "." + enddatesplit[2];
    }
    if (toogleOfTime === "Weeks" && totalNumberOfPeriods != "") {
      const nextweekNumber = parseInt(6 * totalNumberOfPeriods);
      const nextweekdate = new Date(
        now.setDate(now.getDate() - (now.getDay() - 1) + nextweekNumber)
      );
      let enddatesplit = nextweekdate.toISOString().split("T")[0];
      enddatesplit = enddatesplit.split("-");
      endDate = enddatesplit[0] + "." + enddatesplit[1] + "." + enddatesplit[2];
    }
    if (toogleOfTime === "Months" && totalNumberOfPeriods != "") {
      const nextmonthNumber = parseInt(30 * totalNumberOfPeriods);
      const nextmonthdate = new Date(
        now.setDate(now.getDate() - (now.getMonth() - 1) + nextmonthNumber)
      );
      let enddatesplit = nextmonthdate.toISOString().split("T")[0];
      enddatesplit = enddatesplit.split("-");
      endDate = enddatesplit[0] + "." + enddatesplit[1] + "." + enddatesplit[2];
    }
    if (toogleOfTime === "Years" && totalNumberOfPeriods != "") {
      const nextyearNumber = parseInt(totalNumberOfPeriods);
      const nextyeardate = new Date(
        now.setFullYear(now.getFullYear() + nextyearNumber)
      );
      let enddatesplit = nextyeardate.toISOString().split("T")[0];
      enddatesplit = enddatesplit.split("-");
      endDate = enddatesplit[0] + "." + enddatesplit[1] + "." + enddatesplit[2];
    }
    const itemStatus =
      item.STATUS.charAt(0).toUpperCase() + item.STATUS.slice(1);
    if (alreadyItemsInDB.includes(item.ITEMID)) {
      const itemExist = `select id from items where itemID ="${item.ITEMID}"`;
      const itemExistResponse = await query(itemExist);
      if (itemExistResponse.length > 0) {
        //const updateSql = `UPDATE items SET  name = "${item.NAME}", description="${item.EXTENDED_DESCRIPTION}", price="${item.BASEPRICE}", type="Paid", status="${itemStatus}", short_description = "${item.SODESCRIPTION}", startdate="${startDate}", enddate="${endDate}", product_line_id="${item.PRODUCTLINEID}" WHERE itemID="${item.ITEMID}"`;
        const updateSql = `UPDATE items SET  name = "${item.NAME}", description="${item.EXTENDED_DESCRIPTION}", price="${item.BASEPRICE}", type="Paid", status="${itemStatus}", short_description = "${item.SODESCRIPTION}", product_line_id="${item.PRODUCTLINEID}" WHERE itemID="${item.ITEMID}"`;
        const insert = await query(updateSql);
      } else {
        //const InsertSql = `INSERT INTO items (name,description,price,itemID, product_line_id, type,status,short_description,startdate,enddate) VALUES("${item.NAME}","${item.EXTENDED_DESCRIPTION}","${item.BASEPRICE}","${item.ITEMID}", "${item.PRODUCTLINEID}", "Paid", "${itemStatus}", "${item.SODESCRIPTION}","${startDate}","${endDate}")`;
        const InsertSql = `INSERT INTO items (name,description,price,itemID, product_line_id, type,status,short_description) VALUES("${item.NAME}","${item.EXTENDED_DESCRIPTION}","${item.BASEPRICE}","${item.ITEMID}", "${item.PRODUCTLINEID}", "Paid", "${itemStatus}", "${item.SODESCRIPTION}")`;
        const insert = await query(InsertSql);
      }
    } else {
      //const InsertSql = `INSERT INTO items (name,description,price,itemID, product_line_id, type,status,short_description,startdate,enddate) VALUES("${item.NAME}","${item.EXTENDED_DESCRIPTION}","${item.BASEPRICE}","${item.ITEMID}", "${item.PRODUCTLINEID}", "Paid", "${itemStatus}", "${item.SODESCRIPTION}" ,"${startDate}","${endDate}")`;
      const InsertSql = `INSERT INTO items (name,description,price,itemID, product_line_id, type,status,short_description) VALUES("${item.NAME}","${item.EXTENDED_DESCRIPTION}","${item.BASEPRICE}","${item.ITEMID}", "${item.PRODUCTLINEID}", "Paid", "${itemStatus}", "${item.SODESCRIPTION}" )`;

      const insert = await query(InsertSql);
    }
    // }
    res.status(200).send("OK");
  } catch (error) {
    return error.message;
  }
}

async function manageProductLinesInDB(sageLineId, req, res) {
  try {
    console.log("sageLineId", sageLineId);
    let alreadyDBItem = [];
    const DBLines =
      await `SELECT id, product_line_id, description, status, record_no FROM  productlineids`;
    for (let i = 0; i < DBLines.length; i++) {
      alreadyDBItem.push(DBLines[i]["record_no"]);
    }

    for (var j = 0; j < sageLineId.length; j++) {
      console.log(" sageLineId = ", sageLineId[j].RECORDNO);
      let sagQuery = new IA.Functions.Common.NewQuery.Query();
      sagQuery.fromObject = "PRODUCTLINE";
      let fields = [
        new IA.Functions.Common.NewQuery.QuerySelect.Field("RECORDNO"),
        new IA.Functions.Common.NewQuery.QuerySelect.Field("PRODUCTLINEID"),
        new IA.Functions.Common.NewQuery.QuerySelect.Field("DESCRIPTION"),
        new IA.Functions.Common.NewQuery.QuerySelect.Field("STATUS"),
      ];
      let filter = new IA.Functions.Common.NewQuery.QueryFilter.Filter(
        "RECORDNO"
      ).equalTo(sageLineId[j].RECORDNO);
      sagQuery.selectFields = fields;
      sagQuery.pageSize = 1000;
      sagQuery.filter = filter;
      const response = await client.execute(sagQuery);
      const result = response.getResult();
      let lineIdData = result.data[0];
      console.log("json_data", lineIdData);

      const existsLine = await query(
        `select id from productlineids where record_no = "${lineIdData["RECORDNO"]}"`
      );
      if (existsLine.length > 0) {
        await query(
          `UPDATE productlineids SET product_line_id="${lineIdData["PRODUCTLINEID"]}",description="${lineIdData["DESCRIPTION"]}",status="${lineIdData["STATUS"]}" WHERE record_no="${lineIdData["RECORDNO"]}" `
        );
      } else {
        await query(`insert into productlineids (product_line_id, description, status, record_no) 
          values( "${lineIdData["PRODUCTLINEID"]}", "${lineIdData["DESCRIPTION"]}", "${lineIdData["STATUS"]}", "${lineIdData["RECORDNO"]}" ) `);
      }
    }
  } catch (error) {
    console.log("error", error);
    return error.message;
  }
}

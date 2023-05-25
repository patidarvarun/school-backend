const mysqlconnection = require("../../DB/db.config.connection");
const util = require("util");
const { createSageIntacctItem } = require("../../SageIntacctAPIs/ItemServices");

const query = util.promisify(mysqlconnection.query).bind(mysqlconnection);
module.exports = {
  //create item
  CreateItem: async (req, res) => {
    const { name, price, description, itemtype } = req.body;
    var sql = `INSERT INTO items (name,description,price,product_line_id)VALUES('${name}','${description}','${price}','${itemtype}')`;
    console.log(" sql ", sql);
    const item = await query(sql);
    const intacctItem = {
      id: item.insertId,
      name: name,
      price: price,
      itemType: "Inventory",
      produceLineId: itemtype,
      itemGlGroupName: "Accessories",
      shortDescription: "",
      description: description,
      numberOfDays: 1,
    };
    console.log(" intacctItem ", intacctItem);
    const sageIntacctItem = await createSageIntacctItem(intacctItem);
    const itemId = sageIntacctItem._data[0]["ITEMID"];
    const updateSql = `UPDATE items SET  itemID = "${itemId}" WHERE id="${item.insertId}"`;
    const updateItem = await query(updateSql);
    res.status(200).json({
      message: "Item created successfully",
      data: item,
      itemid: itemId,
    });
  },

  //get all items
  GetItem: async (req, res) => {
    var sql = `SELECT id, name, price, description, product_line_id FROM items`;
    const item = await query(sql);
    res.status(200).json({ data: item });
  },

  GetProdctLineIds: async (req, res) => {
    var sql = `SELECT id, product_line_id, description, status, record_no FROM  productlineids where product_line_id!='Activities'`;
    const item = await query(sql);
    res.status(200).json({ data: item });
  },

  //get item by id for view after purchase invoices
  GetItembyid: async (req, res) => {
    var sql = `SELECT invoice_items.id, invoice_items.item_name, invoice_items.quantity, invoice_items.item_price,invoice_items.item_description,invoice_items.item_unit, invoice_items.item_total_price, invoice_items.product_line_id FROM invoice_items WHERE invoice_items.invoice_id = ${req.params.id}`;
    console.log('sqlsql@@@@@@@@@@',sql);
    const item = await query(sql);
    res.status(200).json({ data: item });
  },

  //get credit applied for selected invoice item
  GetCreditApplied: async (req, res) => {
    var sql = `SELECT amountMode, amount FROM sagecreditnotes WHERE invoiceId = "${req.params.id}"`;
    const item = await query(sql);
    res.status(200).json({ data: item });
  },

  //get credit applied for selected invoice item
  GetTransactionAmount: async (req, res) => {
    var sql = `SELECT paidAmount FROM transaction WHERE invoiceId = "${req.params.id}"`;
    const item = await query(sql);
    res.status(200).json({ data: item });
  },

  //get item for creating invoice
  GetItembyidforCreateInvoice: async (req, res) => {
    var sql = `SELECT items.id, items.name, items.description, items.price as amount, items.itemID, product_line_id FROM items WHERE items.id in(${req.params.id})`;
    const item = await query(sql);
    res.status(200).json({ data: item });
  },

  GetItemUnits: async (req, res) => {
    var sql = `SELECT id, name, is_system, record_no, podefaultkey, sodefaultkey, invuom, pouom, oeuom FROM unitofmeasure `;
    const item = await query(sql);
    res.status(200).json({ data: item });
  },

  //delete  item by id
  DeletItembyid: async (req, res) => {
    let id = req.params.id;
    var sql = `delete FROM items WHERE id  = ${id}`;
    const item = await query(sql);
    res.status(200).json({ data: item });
  },

  GetItemData: async (req, res) => {
    var sql = `SELECT id, name, price, description, itemID, product_line_id, status FROM items`;
    const item = await query(sql);
    res.status(200).json({ data: item });
  },
};

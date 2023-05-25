const mysqlconnection = require("../../DB/db.config.connection");

module.exports = {
  // add role controller
  addTypeController: (req, res) => {
    const { name } = req.body;
    if (!name) {
      return res.status(400).send({ message: "All field is required" });
    }
    const check_query = `select name from types where name = "${name}"`;
    mysqlconnection.query(check_query, function (err, result) {
      if (result.length == 0) {
        const sql = `INSERT INTO types (name) VALUES ("${name}")`;
        mysqlconnection.query(sql, function (err, result) {
          if (err) throw err;
          res
            .status(201)
            .send({ message: "Type inserted successfully", data: result });
        });
      } else {
        res.status(409).send({ message: "Type Name Allready Registred" });
      }
    });
  },

  //get type controller
  getTypeController: (req, res) => {
    var sqlquery = `select t.id, t.name,
    count(u.id) as user_count
    from types as t
    left join users as u on t.id = u.typeId where t.isDeleted = 0
    group by t.id, t.name`;
    mysqlconnection.query(sqlquery, function (err, result) {
      if (err) throw err;
      res.status(200).json({ message: "ok", data: result });
    });
  },

  //delete type controller
  deleteTypeController: (req, res) => {
    const id = req.params.id;
    var sql = `update types set isDeleted = 1 where id = ${id}`;
    mysqlconnection.query(sql, function (err, result) {
      if (err) throw err;
      if (result.affectedRows === 1) {
        res
          .status(200)
          .json({ message: "Data deleted successfully", responce: result });
      }
    });
  },

  // type details controller
  TypeDetController: (req, res) => {
    const id = req.params.id;
    var sql = `select id, name from types where id = ${id}`;
    mysqlconnection.query(sql, function (err, result) {
      if (err) throw err;
      res.status(200).json({ message: "ok", data: result });
    });
  },

  //edit type controller
  TypeEditController: (req, res) => {
    const id = req.params.id;
    const { name } = req.body;
    var sql = `update types set name = "${name}" where id = ${id}`;
    mysqlconnection.query(sql, function (err, result) {
      if (err) throw err;
      if (result.affectedRows === 1) {
        res
          .status(200)
          .json({ message: "Data updated successfully", responce: result });
      }
    });
  },

  // find  type controller
  TypeEditController: (req, res) => {
    const id = req.params.id;
    const { name } = req.body;
    var sql = `update types set name = "${name}" where id = ${id}`;
    mysqlconnection.query(sql, function (err, result) {
      if (err) throw err;
      if (result.affectedRows === 1) {
        res
          .status(200)
          .json({ message: "Data updated successfully", responce: result });
      }
    });
  },
};

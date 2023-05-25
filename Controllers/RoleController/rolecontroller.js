const mysqlconnection = require("../../DB/db.config.connection");

module.exports = {
  // add role controller
  addRoleController: (req, res) => {
    const { name } = req.body;
    if (!name) {
      return res.status(400).send({ message: "All field is required" });
    }
    const check_query = `select name from roles where name = "${name}"`;
    mysqlconnection.query(check_query, function (err, result) {
      if (result.length == 0) {
        const sql = `INSERT INTO roles (name) VALUES ("${name}")`;
        mysqlconnection.query(sql, function (err, result) {
          if (err) throw err;
          res
            .status(201)
            .send({ message: "Role inserted successfully", data: result });
        });
      } else {
        res.status(409).send({ message: "Role Name Allready Registred" });
      }
    });
  },

  //get role controller
  getRoleController: (req, res) => {
    var sql = `select id, name from roles where id !=1 and id !=2`;
    mysqlconnection.query(sql, function (err, result) {
      if (err) throw err;
      res.status(200).json({ message: "ok", data: result });
    });
  },
};

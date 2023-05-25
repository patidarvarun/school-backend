const mysqlconnection = require("../DB/db.config.connection");
const util = require("util");
const query = util.promisify(mysqlconnection.query).bind(mysqlconnection);
const { client, IA } = require("./IntacctClient");
const WelcomeTemplate = require("../Controllers/Helper/templates/welcomeTemplate");
const sendEmails = require("../Controllers/Helper/sendEmails");

module.exports = {
  getListCustomersLegacy: async (req, res) => {
    try {
      const sage_api_sql = `SELECT name, offset, no_crons FROM sage_api_logs WHERE name = 'customers' ;`;
      const sage_api_res = await query(sage_api_sql);

      console.log("sage_api_res", sage_api_res);
      if (sage_api_res[0].no_crons >= sage_api_res[0].offset) {
        let limit = 300;
        let cusquery = new IA.Functions.Common.ReadByQuery();
        cusquery.objectName = "CUSTOMER"; // Keep the count to just 1 for the example
        // cusquery.fields = ["DISPLAYCONTACT.EMAIL1", "PARENTID", "CUSTOMERID"];
        cusquery.pageSize = limit;
        // cusquery.offset = 0;
        const response = await client.execute(cusquery);
        const result = response.getResult();

        const numPage = Math.ceil(result.totalCount / limit);
        const offset = sage_api_res[0].offset + limit;

        await query(
          `update sage_api_logs set no_crons = "${result.totalCount}", offset = "${offset}" where name = 'customers'`
        );

        isCustomersExistInPortalDB(result.data, req, res);
      } else {
        await query(
          `update sage_api_logs set no_crons = "0", offset = "0" where name = 'customers'`
        );
      }

      res.status(200);
    } catch (error) {
      // res.status(400).send({
      //     error:error.message
      // })
      console.log("Error in customer scheduler =>", error?.message);
    }
  },

  createIntacctCustomer: async (data) => {
    try {
      const {
        email1,
        email2,
        phoneNumber1,
        phoneNumber2,
        active,
        name,
        parentCustomerId,
        customerTypeId,
      } = data;
      if (!email1 || !phoneNumber1 || !name) {
        return { message: "required data not provided !" };
      }

      let create = new IA.Functions.AccountsReceivable.CustomerCreate();
      create.customerName = name;
      create.active = active;
      create.primaryEmailAddress = email1;
      create.secondaryEmailAddress = email2;
      create.primaryPhoneNo = phoneNumber1;
      create.secondaryPhoneNo = phoneNumber2;
      create.parentCustomerId = parentCustomerId;
      create.customerTypeId = customerTypeId;
      // create.primaryContactName =primaryContactName;
      create.addressLine1 = "300 Park Ave";
      create.addressLine2 = "Ste 1400";
      create.city = "San Jose";
      create.stateProvince = "CA";
      create.zipPostalCode = "95110";
      const createResponse = await client.execute(create).catch((err) => {
        console.log(err.messge);
      });
      const createResult = createResponse.getResult();
      return createResult;
    } catch (error) {
      // res.status(400).send({error:error.message});
      return error.message;
    }
  },

  updateIntacctCustomer: async (data) => {
    try {
      const body = data;
      const keys = Object.keys(body);
      let update = new IA.Functions.AccountsReceivable.CustomerUpdate();
      for (var i = 0; i < keys.length; i++) {
        update[keys[i]] = body[keys[i]];
      }
      const updateResponse = await client.execute(update);
      const updateResult = updateResponse.getResult();
      // res.status(200).send(updateResult);
      return updateResult;
    } catch (error) {
      return { message: error.message };
    }
  },

  deleteIntacctCustomer: async (data) => {
    try {
      const body = data;
      const customerId = body.customerId;
      let del = new IA.Functions.AccountsReceivable.CustomerDelete();
      del.customerId = customerId;
      const deleteResponse = await client.execute(del);
      const deleteResult = deleteResponse.getResult();

      if (deleteResult._status === "success") {
        // res.status(200).send({message:'customer deleted successfully !'})
        return { message: "customer deleted successfully !" };
      }
    } catch (error) {
      return { message: error.message };
    }
  },

  getIntacctCustomerById: async (req, res) => {
    try {
      const { recordId } = req.body;
      let read = new IA.Functions.Common.Read();
      read.objectName = "CUSTOMER";
      read.keys = [recordId];
      const responsebyname = await client.execute(read);
      const customer = responsebyname.getResult();
      res.status(200).send(customer);
    } catch (error) {
      return { message: error.message };
    }
  },

  getListofCustomersType: async (req, res) => {
    try {
      let query = new IA.Functions.Common.ReadByQuery();
      query.objectName = "CUSTTYPE"; // Keep the count to just 1 for the example
      query.pageSize = 100;
      const response = await client.execute(query);
      const result = response.getResult();
      let json_data = result.data;
      isCustomerTypeExistInDB(json_data, req, res);
    } catch (error) {
      res.status(400).send({
        error: error.message,
      });
    }
  },
};

async function isCustomersExistInPortalDB(SageIntacctCustomers, req, res) {
  try {
    var dbCustomersId = [];
    var sgaeIntacctCustomers = [];
    var pureParentOnly = [];
    const sql = `(SELECT customerId FROM customers where customerId IS NOT NULL) order by customerId ASC ;`;
    const alreadyCustomerInDB = await query(sql);

    const typesSql = `SELECT id,name FROM types where isDeleted !=1 ;`;
    const alreadyTypesInDB = await query(typesSql);

    for (var j = 0; j < alreadyCustomerInDB.length; j++) {
      dbCustomersId.push(alreadyCustomerInDB[j].customerId);
    }

    for (var i = 0; i < SageIntacctCustomers.length; i++) {
      if (
        SageIntacctCustomers[i]["DISPLAYCONTACT.EMAIL1"] != "" &&
        SageIntacctCustomers[i]["PARENTID"] != ""
      ) {
        pureParentOnly.push(SageIntacctCustomers[i]["PARENTID"]);
      }
      if (SageIntacctCustomers[i]["DISPLAYCONTACT.EMAIL1"] != "") {
        sgaeIntacctCustomers.push(SageIntacctCustomers[i]["CUSTOMERID"]);
      }
    }
    // insert parent only
    pureParentOnly = pureParentOnly.filter(
      (item, index) => pureParentOnly.indexOf(item) === index
    );
    for (var parent = 0; parent < pureParentOnly.length; parent++) {
      try {
        let sagQuery = new IA.Functions.Common.NewQuery.Query();
        sagQuery.fromObject = "CUSTOMER";
        let fields = [
          new IA.Functions.Common.NewQuery.QuerySelect.Field("NAME"),
          new IA.Functions.Common.NewQuery.QuerySelect.Field("STATUS"),
          new IA.Functions.Common.NewQuery.QuerySelect.Field("RECORDNO"),
          new IA.Functions.Common.NewQuery.QuerySelect.Field("PARENTID"),
          new IA.Functions.Common.NewQuery.QuerySelect.Field("CREATEDBY"),
          new IA.Functions.Common.NewQuery.QuerySelect.Field("MODIFIEDBY"),
          new IA.Functions.Common.NewQuery.QuerySelect.Field("CUSTOMERID"),
          new IA.Functions.Common.NewQuery.QuerySelect.Field("CUSTTYPE"),
          new IA.Functions.Common.NewQuery.QuerySelect.Field(
            "DISPLAYCONTACT.EMAIL1"
          ),
          new IA.Functions.Common.NewQuery.QuerySelect.Field(
            "DISPLAYCONTACT.EMAIL2"
          ),
          new IA.Functions.Common.NewQuery.QuerySelect.Field(
            "DISPLAYCONTACT.PHONE1"
          ),
          new IA.Functions.Common.NewQuery.QuerySelect.Field(
            "DISPLAYCONTACT.PHONE2"
          ),
          new IA.Functions.Common.NewQuery.QuerySelect.Field(
            "DISPLAYCONTACT.CONTACTNAME"
          ),
        ];
        let filter = new IA.Functions.Common.NewQuery.QueryFilter.Filter(
          "CUSTOMERID"
        ).equalTo(pureParentOnly[parent]);
        sagQuery.selectFields = fields;
        sagQuery.pageSize = 1000;
        sagQuery.filter = filter;
        const response = await client.execute(sagQuery);
        const result = response.getResult();
        let parentDataOfSageIntact = result.data[0];
        let dbTypeId = { id: 0 };
        if (parentDataOfSageIntact["CUSTTYPE"] != "") {
          dbTypeId = alreadyTypesInDB.find((obj) => {
            return obj.name === parentDataOfSageIntact["CUSTTYPE"];
          });
        }

        let userAsParentExistSql = `SELECT * FROM users where email1="${parentDataOfSageIntact["DISPLAYCONTACT.EMAIL1"]}"`;
        let parentExist = await query(userAsParentExistSql);
        let userAsParentInParentDB = `select * from parents where parentId = ${pureParentOnly[parent]}`;
        let parentDBExist = await query(userAsParentInParentDB);
        if (parentExist.length > 0 && parentDBExist.length > 0) {
          console.log("user as parent updating ..", pureParentOnly[parent]);

          const userAsParentUpdate = `update users set
                        name = "${
                          parentDataOfSageIntact["NAME"]
                            ? parentDataOfSageIntact["NAME"]
                            : ""
                        }",
                        email1 = "${
                          parentDataOfSageIntact["DISPLAYCONTACT.EMAIL1"]
                        }", 
                        email2 = "${
                          parentDataOfSageIntact["DISPLAYCONTACT.EMAIL2"]
                            ? parentDataOfSageIntact["DISPLAYCONTACT.EMAIL2"]
                            : ""
                        }",
                        phone1 = ${
                          parentDataOfSageIntact["DISPLAYCONTACT.PHONE1"]
                            ? parentDataOfSageIntact["DISPLAYCONTACT.PHONE1"]
                            : 0
                        },
                        phone2 = ${
                          parentDataOfSageIntact["DISPLAYCONTACT.PHONE2"]
                            ? parentDataOfSageIntact["DISPLAYCONTACT.PHONE2"]
                            : 0
                        },
                        contactName="${
                          parentDataOfSageIntact["DISPLAYCONTACT.CONTACTNAME"]
                            ? parentDataOfSageIntact[
                                "DISPLAYCONTACT.CONTACTNAME"
                              ]
                            : ""
                        }",
                        status= ${
                          parentDataOfSageIntact["STATUS"] === "active" ? 1 : 0
                        },
                        parentId=${0},
                        createdBy=${1},
                        updatedBy=${1},
                        typeId=${dbTypeId.id}
                        where id ="${parentExist[0]?.id}"`;

          const updateUser = await query(userAsParentUpdate);

          console.log("user as parent updated ..", pureParentOnly[parent]);
        } else {
          console.log("parents inserting ...", pureParentOnly[parent]);
          console.log(
            "user as parent registerd with this parent id ",
            pureParentOnly[parent]
          );
          let userAsParentExistSql = `SELECT * FROM users where email1="${parentDataOfSageIntact["DISPLAYCONTACT.EMAIL1"]}"`;
          const userAsParentWithEmailCheck = await query(userAsParentExistSql);
          if (userAsParentWithEmailCheck.length > 0) {
            // console.log("already email is used so we can't create user as parent",parentDataOfSageIntact["DISPLAYCONTACT.EMAIL1"]);
            const getcustomerId = `select * from customers where customerId = "${pureParentOnly[parent]}"`;
            const getcustomerIdResponse = await query(getcustomerId);
            const insertparentid = `insert into parents(userId,parentId,record_no)values(${getcustomerIdResponse[0]?.userId},${parentDataOfSageIntact["CUSTOMERID"]},${parentDataOfSageIntact["RECORDNO"]})`;
            const insertparentidResponse = await query(insertparentid);
            // dbCustomerParentUserId = getcustomerIdResponse[0]?.userId;
            const siftCustomer = `DELETE FROM customers WHERE customerId="${pureParentOnly[parent]}"`;
            const siftcustomerRecord = await query(siftCustomer);
          } else {
            const insertUserForParent = `INSERT INTO users (name,email1,email2,phone1,phone2,contactName,status,typeId,createdBy,updatedBy,parentId,roleId) VALUES(
                "${
                  parentDataOfSageIntact["NAME"]
                    ? parentDataOfSageIntact["NAME"]
                    : ""
                }",
                "${parentDataOfSageIntact["DISPLAYCONTACT.EMAIL1"]}",
                "${
                  parentDataOfSageIntact["DISPLAYCONTACT.EMAIL2"]
                    ? parentDataOfSageIntact["DISPLAYCONTACT.EMAIL2"]
                    : ""
                }",
                 ${
                   parentDataOfSageIntact["DISPLAYCONTACT.PHONE1"]
                     ? parentDataOfSageIntact["DISPLAYCONTACT.PHONE1"]
                     : 0
                 },
                 ${
                   parentDataOfSageIntact["DISPLAYCONTACT.PHONE2"]
                     ? parentDataOfSageIntact["DISPLAYCONTACT.PHONE2"]
                     : 0
                 },
                 "${
                   parentDataOfSageIntact["DISPLAYCONTACT.CONTACTNAME"]
                     ? parentDataOfSageIntact["DISPLAYCONTACT.CONTACTNAME"]
                     : ""
                 }",
                 ${parentDataOfSageIntact["STATUS"] === "active" ? 1 : 0},
                 ${dbTypeId.id},
                 ${1},
                 ${1},
                 ${0},
                 ${2}
                 )`;
            const insetUserparent = await query(insertUserForParent);
            const insertparentid = `insert into parents(userId,parentId,record_no)values(${insetUserparent.insertId},${parentDataOfSageIntact["CUSTOMERID"]},${parentDataOfSageIntact["RECORDNO"]})`;
            const insertparentidResponse = await query(insertparentid);
            console.log("parent inserted !", pureParentOnly[parent]);
          }
        }
      } catch (error) {
        console.log("error =>", error.message);
      }
    }

    // customer insertation
    for (var k = 0; k < sgaeIntacctCustomers.length; k++) {
      if (dbCustomersId.includes(sgaeIntacctCustomers[k])) {
        console.log("customer exist in potral DB =>", sgaeIntacctCustomers[k]);
        const recordNoSql = `SELECT record_no,userId FROM customers where customerId=${parseInt(
          sgaeIntacctCustomers[k]
        )};`;
        const recordNo = await query(recordNoSql);
        const userId = recordNo[0].userId;
        let read = new IA.Functions.Common.Read();
        read.objectName = "CUSTOMER";
        read.keys = [recordNo[0].record_no];
        const responsebyname = await client.execute(read);
        const customerResponse = responsebyname.getResult();
        const customer = customerResponse._data[0];
        const name = customer["NAME"];
        const email1 = customer["DISPLAYCONTACT"]["EMAIL1"];
        const email2 = customer["DISPLAYCONTACT"]["EMAIL2"];
        const phone1 = customer["DISPLAYCONTACT"]["PHONE1"];
        const phone2 = customer["DISPLAYCONTACT"]["PHONE2"];
        const contactName = customer["DISPLAYCONTACT"]["CONTACTNAME"];
        const status = customer["STATUS"];
        const parentId = customer["PARENTID"];
        const createdBy = customer["CREATEDBY"];
        const updatedBy = customer["MODIFIEDBY"];
        const typeId = customer["CUSTTYPE"];
        let dbTypeId = { id: 0 };
        if (typeId != "") {
          dbTypeId = alreadyTypesInDB.find((obj) => {
            return obj.name === typeId;
          });
        }

        var dbCustomerParentUserId = 0;
        if (parentId === "") {
          dbCustomerParentUserId = 0;
          try {
            console.log("updating user ....");
            const updt_query = `update users set
                      name = "${name}",
                      email1 = "${email1}", 
                      email2 = "${email2 ? email2 : ""}",
                      phone1 = ${phone1 ? phone1 : 0},
                      phone2 = ${phone2 ? phone2 : 0},
                      contactName="${contactName}",
                      status= ${status === "active" ? 1 : 0},
                      parentId=${dbCustomerParentUserId},
                      createdBy=${1},
                      updatedBy=${1},
                      typeId=${dbTypeId.id}
                      where id ="${userId}"`;
            // console.log("updt_query =>",updt_query);
            const updateUser = await query(updt_query);
            console.log("updated user !");
          } catch (error) {
            console.log("error =>", error.message);
          }
        } else {
          console.log("parent is there ", parentId);
          const getcustomerparentId = `select userId from parents where parentId = "${parentId}"`;
          const getcustomerparentIdResponse = await query(getcustomerparentId);

          if (getcustomerparentIdResponse.length > 0) {
            console.log(
              "parents is already available in parents table",
              parentId
            );
            const parentIdForCustomer = getcustomerparentIdResponse[0]?.userId;
            dbCustomerParentUserId = parentIdForCustomer;
          }

          try {
            console.log("updating user ....");
            const updt_query = `update users set
                      name = "${name}",
                      email1 = "${email1}", 
                      email2 = "${email2 ? email2 : ""}",
                      phone1 = ${phone1 ? phone1 : 0},
                      phone2 = ${phone2 ? phone2 : 0},
                      contactName="${contactName}",
                      status= ${status === "active" ? 1 : 0},
                      parentId=${dbCustomerParentUserId},
                      createdBy=${1},
                      updatedBy=${1},
                      typeId=${dbTypeId.id}
                      where id ="${userId}"`;
            // console.log("updt_query =>",updt_query);
            const updateUser = await query(updt_query);
            console.log("updated user !");
          } catch (error) {
            console.log("error =>", error.message);
          }
        }
      } else {
        console.log(
          "customer not exist in potral DB =>",
          sgaeIntacctCustomers[k]
        );
        const recordNo = SageIntacctCustomers[k]["RECORDNO"];
        let read = new IA.Functions.Common.Read();
        read.objectName = "CUSTOMER";
        read.keys = [recordNo];
        const responsebyname = await client.execute(read);
        const customerResponse = responsebyname.getResult();
        const customer = customerResponse._data[0];
        const customerId = customer["CUSTOMERID"];
        const name = customer["NAME"];
        const email1 = customer["DISPLAYCONTACT"]["EMAIL1"];
        const email2 = customer["DISPLAYCONTACT"]["EMAIL2"];
        const phone1 = customer["DISPLAYCONTACT"]["PHONE1"];
        const phone2 = customer["DISPLAYCONTACT"]["PHONE2"];
        const contactName = customer["DISPLAYCONTACT"]["CONTACTNAME"];
        const status = customer["STATUS"];
        const parentId = customer["PARENTID"];
        const createdBy = customer["CREATEDBY"];
        const updatedBy = customer["MODIFIEDBY"];
        const typeId = customer["CUSTTYPE"];

        let dbTypeId = { id: 0 };
        let dbCustomerParentUserId = 0;
        let isCustomerinsert = false;
        if (typeId != "") {
          dbTypeId = alreadyTypesInDB.find((obj) => {
            console.log(obj.name, "===", typeId);
            return obj.name === typeId;
          });
        }
        const customerExistSql = `SELECT * FROM users where email1="${email1}" and parentId = 0;`;
        const customerExist = await query(customerExistSql);
        if (parentId === "") {
          dbCustomerParentUserId = 0;
          // if (customerExist.length > 0) {
          //   console.log(
          //     "user as customer already exist with this email!",
          //     email1
          //   );
          // } else {
          console.log(
            customerId,
            "user inserting as customer with parent id =>",
            dbCustomerParentUserId
          );
          const insert_user = `INSERT INTO users (name,email1,email2,phone1,phone2,contactName,status,typeId,createdBy,updatedBy,parentId,roleId)
                  VALUES(
                      "${name ? name : ""}", 
                      "${email1}",
                      "${email2}",
                       ${phone1 ? phone1 : 0}, 
                       ${phone2 ? phone2 : 0},
                      "${contactName ? contactName : ""}",
                       ${status === "active" ? 1 : 0}, 
                       ${dbTypeId.id},
                       ${createdBy ? createdBy : 1}, 
                       ${updatedBy ? updatedBy : 1},
                       ${dbCustomerParentUserId},
                       ${2}
                       )`;

          const insetUser = await query(insert_user);
          const insert_customer_sql = `INSERT INTO customers (userId,customerId,record_no)VALUES(${insetUser.insertId},${customerId},${recordNo})`;
          const insert_customer = await query(insert_customer_sql);
          // }
        } else {
          console.log(
            customerId,
            "user as customer inserting with parent id",
            parentId
          );
          const getcustomerparentId = `select userId from parents where parentId = "${parentId}"`;
          const getcustomerparentIdResponse = await query(getcustomerparentId);
          if (getcustomerparentIdResponse.length > 0) {
            dbCustomerParentUserId = getcustomerparentIdResponse[0]?.userId;
          }

          // if (customerExist.length > 0) {
          //   console.log("customer already exist with this email!", email1);
          // } else {
          const insert_user = `INSERT INTO users (name,email1,email2,phone1,phone2,contactName,status,typeId,createdBy,updatedBy,parentId,roleId)
                  VALUES(
                      "${name ? name : ""}", 
                      "${email1}",
                      "${email2}",
                       ${phone1 ? phone1 : 0}, 
                       ${phone2 ? phone2 : 0},
                      "${contactName ? contactName : ""}",
                       ${status === "active" ? 1 : 0}, 
                       ${dbTypeId.id},
                       ${createdBy ? createdBy : 1}, 
                       ${updatedBy ? updatedBy : 1},
                       ${dbCustomerParentUserId},
                       ${2}
                       )`;

          const insetUser = await query(insert_user);
          console.log(
            "user inserted as customer  with assignable parent id",
            dbCustomerParentUserId
          );
          const insert_customer_sql = `INSERT INTO customers (userId,customerId,record_no)VALUES(${insetUser.insertId},${customerId},${recordNo})`;
          const insert_customer = await query(insert_customer_sql);
          console.log("customer inserted for user ", insert_customer?.insertId);
          const custData = {
            name: "Avinash",
            email: email1,
          };
          // const mailid = WelcomeTemplate(custData);
          // sendEmails(email1, "Welcome From QIS✔", mailid);
          // }
        }
      }
    }
    res.status(200).send("ok");
  } catch (error) {
    return error.message;
  }
}

async function isCustomerTypeExistInDB(sageIntacctCustomerType, req, res) {
  try {
    const dbCustomerType = [];
    const sageintacctCustomerTypeName = [];
    const dbCustomerTypeQuery = ` select name from types`;
    const dbCustomerResponse = await query(dbCustomerTypeQuery);
    for (var i = 0; i < dbCustomerResponse.length; i++) {
      dbCustomerType.push(dbCustomerResponse[i].name);
    }

    for (var j = 0; j < sageIntacctCustomerType.length; j++) {
      sageintacctCustomerTypeName.push(sageIntacctCustomerType[j]["NAME"]);
    }
    console.log("dbCustomerType", dbCustomerType);
    console.log("sageintacctCustomerTypeName", sageintacctCustomerTypeName);

    for (k = 0; k < sageIntacctCustomerType.length; k++) {
      const typeName = sageintacctCustomerTypeName[k];
      const status = sageIntacctCustomerType[k]["STATUS"] === "active" ? 0 : 1;

      if (dbCustomerType.includes(sageintacctCustomerTypeName[k])) {
        console.log(
          "customer type already exist",
          sageintacctCustomerTypeName[k]
        );
        const updateQuery = `update types set name="${typeName}",isDeleted=${status} where name ="${typeName}"`;
        const updateQueryResponse = await query(updateQuery);
      } else {
        console.log("customer type not exist", sageintacctCustomerTypeName[k]);
        const insertQuery = `insert into types(name,isDeleted)values("${typeName}",${status})`;
        console.log("insert query =>", insertQuery);
        const insertQueryResponse = await query(insertQuery);
      }
    }
    res.status(200).send("ok");
  } catch (error) {
    console.log("error", error.message);
  }
}

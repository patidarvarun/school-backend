const mysqlconnection = require("../DB/db.config.connection");
const util = require("util");
const query = util.promisify(mysqlconnection.query).bind(mysqlconnection);
const { client, IA } = require("./IntacctClient");
const WelcomeTemplate = require("../Controllers/Helper/templates/welcomeTemplate");
const WelcomrEmailFormat = require("../Controllers/Helper/templates/welcomeEmailTemp");
const sendEmails = require("../Controllers/Helper/sendEmails");

const { generateHashPass } = require("../Controllers/Helper/generatePassword");
const {
  AbstractWarehouse,
} = require("@intacct/intacct-sdk/dist/Functions/InventoryControl");
const {
  migrateEmailToHubSpot,
  migrateCustomersToHubSpot,
} = require("../hubSpotContacts/hubSpotContacts");

module.exports = {
  getListCustomersLegacy: async (req, res) => {
    try {
      let limit = 1000;
      let cusquery = new IA.Functions.Common.ReadByQuery();
      cusquery.objectName = "CUSTOMER"; // Keep the count to just 1 for the example

      cusquery.pageSize = limit;

      const response = await client.execute(cusquery);
      const result = response.getResult();

      const numPage = Math.ceil(result.totalCount / limit);

      await isCustomersExistInPortalDB(result.data, req, res);

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

        await isCustomersExistInPortalDB(resultMore.data, req, res);
      }

      res.status(200);
    } catch (error) {}
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
        address,
      } = data;

      if (!email1 || !phoneNumber1 || !name) {
        return { message: "required data not provided !" };
      }
      let CustAdd = JSON.parse(address);
      let create = new IA.Functions.AccountsReceivable.CustomerCreate();
      create.customerName = name;
      create.active = active;
      create.primaryEmailAddress = email1;
      create.secondaryEmailAddress = email2;
      create.primaryPhoneNo = phoneNumber1;
      create.secondaryPhoneNo = phoneNumber2 ? phoneNumber2 : "";
      create.parentCustomerId = parentCustomerId;
      create.customerTypeId = customerTypeId;
      // create.primaryContactName =primaryContactName;
      create.addressLine1 = CustAdd ? CustAdd.add1 : "";
      create.addressLine2 = CustAdd ? CustAdd.add2 : "";
      create.city = CustAdd ? CustAdd.city : "";
      create.stateProvince = CustAdd ? CustAdd.state : "";
      create.zipPostalCode = CustAdd ? CustAdd.postalcode : "";
      console.log("create customer ", create);
      const createResponse = await client.execute(create).catch((err) => {
        console.log("Error", err);
      });
      const createResult = createResponse.getResult();
      return createResult;
    } catch (error) {
      console.log("Error", error);
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

  getCustomerBySmartEvent: async (req, res) => {
    try {
      // const Items_array = req.body.split("&");
      // let ItemsObj = {};
      // let ItemsArr = [];

      // for (var i = 0; i < Items_array.length; i++) {
      //   let Item = Items_array[i].split("=");

      //   if (Item.length == 2) {
      //     ItemsObj[Item[0]] = decodeURIComponent(Item[1]).replace("+", " ");
      //   }
      // }

      // ItemsArr.push(ItemsObj);
      if (req.body) {
        await customersSyncBySmartEvent(req.body, req, res);
        res.status(200).send("OK");
      }
    } catch (error) {
      return error.message;
    }
  },
};

async function customersSyncBySmartEvent(customerData, req, res) {
  const {
    RECORDNO,
    CUSTOMERID,
    NAME,
    FIRSTNAME,
    LASTNAME,
    EMAIL1,
    EMAIL2,
    PHONE1,
    PHONE2,
    ADDRESS1,
    ADDRESS2,
    CITY,
    STATE,
    ZIP,
    CONTACTNAME,
    STATUS,
    PARENTID,
    CUSTTYPE,
  } = customerData;

  let typeId = "";
  let status = 0;

  if (STATUS) {
    status = STATUS == "active" ? 1 : 0;
  }
  if (CUSTTYPE) {
    const cusTypRes = await query(
      `select id from types where name="${CUSTTYPE}"`
    );
    typeId = cusTypRes[0].id;
  }

  const userIdResponse = await query(
    `select userId from customers where customerId = "${CUSTOMERID}"`
  );
  let userID;
  if (userIdResponse.length > 0) {
    userID = userIdResponse[0]?.userId;
  } else {
    const userIdResponse = await query(
      `select userId from parents where parentId = "${CUSTOMERID}"`
    );
    userID = userIdResponse[0]?.userId;
  }

  let parentId = 0;
  if (PARENTID) {
    const parentIdResponse = await query(
      `select userId from customers where customerId = "${PARENTID}"`
    );

    if (parentIdResponse.length > 0) {
      parentId = parentIdResponse[0]?.userId;
    } else {
      const parentIdResponse = await query(
        `select userId from parents where parentId = "${PARENTID}"`
      );
      parentId = parentIdResponse[0]?.userId;
    }
  } else {
    parentId = 0;
  }
  const address = JSON.stringify({
    add1: ADDRESS1,
    add2: ADDRESS2,
    city: CITY,
    state: STATE,
    postalcode: ZIP,
  });

  if (userID) {
    let sql = `select id, name, email1, email2, phone1, phone2, roleId, typeId, parentId, contactName, printUs, status, agegroup, updatedBy, attentionTo from users where id=${userID}`;
    const result = await query(sql);

    const updt_query = `update users set 
        name = "${NAME ? NAME : result[0].name}", 
        email1 = "${EMAIL1 ? EMAIL1 : result[0].email1}", 
        email2 = "${EMAIL2 ? EMAIL2 : result[0].email2}",
        phone1 = ${PHONE1 ? PHONE1 : result[0].phone1}, 
        phone2 = ${PHONE2 ? PHONE2 : result[0].phone2}, 
        contactName="${CONTACTNAME ? CONTACTNAME : result[0].contactName}",
        status= ${status ? status : result[0].status},
        typeId= ${typeId ? typeId : result[0].typeId}, 
        parentId = ${parentId ? parentId : result[0].parentId}  
        where id = ${userID}`;

    await query(updt_query);

    const checkdtt = await query(
      `select keyname, value from metaoptions where userId = ${userID}`
    );
    if (checkdtt.length > 0) {
      const dtt = await query(
        `update metaoptions set value = '${address}' where userId = ${userID}`
      );
    } else {
      const dt = await query(
        `insert into metaoptions(userId, keyname, value)values(${userID},"Address",'${address}')`
      );
    }
    res.status(200).send({
      message: "User updated successfully.",
      // usersageid:userSage
    });
  } else {
    const insert_query = `INSERT INTO users (name, email1, email2, phone1, phone2, contactName, status, roleId, typeId, parentId, createdBy)VALUES("${
      NAME ? NAME : ""
    }", "${EMAIL1 ? EMAIL1 : ""}","${EMAIL2 ? EMAIL2 : ""}","${
      PHONE1 ? PHONE1 : 0
    }", "${PHONE2 ? PHONE2 : 0}","${CONTACTNAME ? CONTACTNAME : ""}", "${
      status ? status : 0
    }", ${2}, ${typeId ? typeId : 0}, ${parentId ? parentId : 0}, ${1})`;
    //insert customer (Child)
    if (parentId === 0 || parentId > 0) {
      //create customer
      const ResInsertdUserId = await query(insert_query);
      const InsertdUserId = ResInsertdUserId.insertId;
      const insertmeta = `insert into metaoptions(userId, keyname, value)values(${InsertdUserId},"Address",'${address}')`;
      await query(insertmeta);
      if (InsertdUserId) {
        if (parentId > 0) {
          const insert_cust = `INSERT INTO customers (userId, customerId, record_no)VALUES(${InsertdUserId}, ${CUSTOMERID}, ${RECORDNO})`;
          await query(insert_cust);
        }
        if (parentId == 0) {
          const insert_cust = `INSERT INTO parents (userId, parentId, record_no)VALUES(${InsertdUserId},${CUSTOMERID}, ${RECORDNO})`;
          await query(insert_cust);
          //insert data into hubspot
          const hubdata = {
            name: NAME ? NAME : "",
            email1: EMAIL1 ? EMAIL1 : "",
            phoneNumber1: PHONE1 ? PHONE1 : 0,
          };
          await migrateCustomersToHubSpot(hubdata, CUSTOMERID, InsertdUserId);
        }
      }
      // Send Welcome email
      if (parentId == 0) {
        const genPass = JSON.parse(await generateHashPass());
        const updaPass = `UPDATE users SET password="${genPass.encPass}" WHERE id="${InsertdUserId}"`;
        await query(updaPass);
        const custData = {
          name: NAME ? NAME : "",
          email: EMAIL1,
          pass: genPass.pass,
        };
        const mailCont = WelcomrEmailFormat(custData);
        //send emails
        sendEmails(EMAIL1, "Welcome From QIS✔", mailCont);
        //add email activity logs in hubspot
        const hubspotemaildata = {
          userid: InsertdUserId,
          email: EMAIL1,
          subject: "WELCOME TO QIS✔",
          bodyofemail: mailCont,
        };
        await migrateEmailToHubSpot(hubspotemaildata);
      }
      res.status(200).send({
        message: "Customer Registration successfully with inactive status.",
      });
    }
  }
}

async function isCustomersExistInPortalDB(SageIntacctCustomers, req, res) {
  try {
    var dbCustomersId = [];
    var sgaeIntacctCustomers = [];
    var pureParentOnly = [];
    const sql = `SELECT customerId FROM customers ;`;
    const alreadyCustomerInDB = await query(sql);

    const typesSql = `SELECT id,name FROM types where isDeleted !=1 ;`;
    const alreadyTypesInDB = await query(typesSql);

    for (var j = 0; j < alreadyCustomerInDB.length; j++) {
      dbCustomersId.push(alreadyCustomerInDB[j].customerId);
    }

    for (var i = 0; i < SageIntacctCustomers.length; i++) {
      // console.log("Customer id = ", SageIntacctCustomers[i]["CUSTOMERID"], " Record no", SageIntacctCustomers[i]["RECORDNO"], " Parent ID ", SageIntacctCustomers[i]["PARENTID"])
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
          new IA.Functions.Common.NewQuery.QuerySelect.Field(
            "DISPLAYCONTACT.CONTACTNAME"
          ),
          new IA.Functions.Common.NewQuery.QuerySelect.Field(
            "DISPLAYCONTACT.MAILADDRESS.ADDRESS1"
          ),
          new IA.Functions.Common.NewQuery.QuerySelect.Field(
            "DISPLAYCONTACT.MAILADDRESS.ADDRESS2"
          ),
          new IA.Functions.Common.NewQuery.QuerySelect.Field(
            "DISPLAYCONTACT.MAILADDRESS.ADDRESS2"
          ),
          new IA.Functions.Common.NewQuery.QuerySelect.Field(
            "DISPLAYCONTACT.MAILADDRESS.CITY"
          ),
          new IA.Functions.Common.NewQuery.QuerySelect.Field(
            "DISPLAYCONTACT.MAILADDRESS.STATE"
          ),
          new IA.Functions.Common.NewQuery.QuerySelect.Field(
            "DISPLAYCONTACT.MAILADDRESS.ZIP"
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

        const address = JSON.stringify({
          add1: parentDataOfSageIntact["ADDRESS1"],
          add2: parentDataOfSageIntact["ADDRESS2"],
          city: parentDataOfSageIntact["CITY"],
          state: parentDataOfSageIntact["STATE"],
          postalcode: parentDataOfSageIntact["ZIP"],
        });

        let userAsParentExistSql = `SELECT * FROM users where email1="${parentDataOfSageIntact["DISPLAYCONTACT.EMAIL1"]}" and parentId =0 `;
        let parentExist = await query(userAsParentExistSql);
        let userAsParentInParentDB = `select * from parents where parentId = "${pureParentOnly[parent]}"`;
        let parentDBExist = await query(userAsParentInParentDB);
        if (parentExist.length > 0 && parentDBExist.length > 0) {
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

          const checkdtt = await query(
            `select keyname, value from metaoptions where userId = ${parentExist[0]?.id}`
          );
          if (checkdtt.length > 0) {
            const dtt = await query(
              `update metaoptions set value = '${address}' where userId = ${parentExist[0]?.id}`
            );
          } else {
            const dt = await query(
              `insert into metaoptions(userId, keyname, value)values(${parentExist[0]?.id},"Address",'${address}')`
            );
          }
        } else {
          let userAsParentExistSql = `SELECT * FROM users where email1="${parentDataOfSageIntact["DISPLAYCONTACT.EMAIL1"]}" and parentId =0 `;
          const userAsParentWithEmailCheck = await query(userAsParentExistSql);
          if (userAsParentWithEmailCheck.length > 0) {
            const getcustomerId = `select * from customers where customerId = "${pureParentOnly[parent]}"`;
            const getcustomerIdResponse = await query(getcustomerId);
            if (getcustomerIdResponse.length > 0) {
              const insertparentid = `insert into parents(userId,parentId,record_no)values("${getcustomerIdResponse[0]?.userId}","${parentDataOfSageIntact["CUSTOMERID"]}","${parentDataOfSageIntact["RECORDNO"]}")`;
              const insertparentidResponse = await query(insertparentid);
              // dbCustomerParentUserId = getcustomerIdResponse[0]?.userId;
              const siftCustomer = `DELETE FROM customers WHERE customerId="${pureParentOnly[parent]}"`;
              const siftcustomerRecord = await query(siftCustomer);
            }
          } else {
            if (parentDataOfSageIntact["DISPLAYCONTACT.EMAIL1"] !== "") {
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
              if (insetUserparent.insertId) {
                const insertparentid = `insert into parents(userId,parentId,record_no)values("${insetUserparent.insertId}","${parentDataOfSageIntact["CUSTOMERID"]}","${parentDataOfSageIntact["RECORDNO"]}")`;
                const insertparentidResponse = await query(insertparentid);

                const checkdtt = await query(
                  `select keyname, value from metaoptions where userId = ${insetUserparent.insertId}`
                );
                if (checkdtt.length > 0) {
                  const dtt = await query(
                    `update metaoptions set value = '${address}' where userId = ${insetUserparent.insertId}`
                  );
                } else {
                  const dt = await query(
                    `insert into metaoptions(userId, keyname, value)values(${insetUserparent.insertId},"Address",'${address}')`
                  );
                }
              }
            }
          }
        }
      } catch (error) {
        console.log("error", error);
      }
    }

    // customer insertation
    for (var k = 0; k < SageIntacctCustomers.length; k++) {
      if (dbCustomersId.includes(SageIntacctCustomers[k])) {
        const recordNoSql = `SELECT record_no,userId FROM customers where customerId="${SageIntacctCustomers[k]}";`;
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

        const Address1 = customer["DISPLAYCONTACT"]["MAILADDRESS"]["ADDRESS1"];
        const Address2 = customer["DISPLAYCONTACT"]["MAILADDRESS"]["ADDRESS2"];
        const City = customer["DISPLAYCONTACT"]["MAILADDRESS"]["CITY"];
        const State = customer["DISPLAYCONTACT"]["MAILADDRESS"]["STATE"];
        const Zip = customer["DISPLAYCONTACT"]["MAILADDRESS"]["ZIP"];

        let dbTypeId = { id: 0 };
        if (typeId != "") {
          dbTypeId = alreadyTypesInDB.find((obj) => {
            return obj.name === typeId;
          });
        }

        const address = JSON.stringify({
          add1: Address1,
          add2: Address2,
          city: City,
          state: State,
          postalcode: Zip,
        });

        var dbCustomerParentUserId = 0;
        if (parentId === "") {
          dbCustomerParentUserId = 0;
          try {
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

            const updateUser = await query(updt_query);

            const checkdtt = await query(
              `select keyname, value from metaoptions where userId = ${userId}`
            );
            if (checkdtt.length > 0) {
              const dtt = await query(
                `update metaoptions set value = '${address}' where userId = ${userId}`
              );
            } else {
              const dt = await query(
                `insert into metaoptions(userId, keyname, value)values(${userId},"Address",'${address}')`
              );
            }
          } catch (error) {
            console.log("error", error);
          }
        } else {
          const getcustomerparentId = `select userId from parents where parentId = "${parentId}"`;
          const getcustomerparentIdResponse = await query(getcustomerparentId);

          if (getcustomerparentIdResponse.length > 0) {
            const parentIdForCustomer = getcustomerparentIdResponse[0]?.userId;
            dbCustomerParentUserId = parentIdForCustomer;
          }

          try {
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

            const updateUser = await query(updt_query);

            const checkdtt = await query(
              `select keyname, value from metaoptions where userId = ${userId}`
            );
            if (checkdtt.length > 0) {
              const dtt = await query(
                `update metaoptions set value = '${address}' where userId = ${userId}`
              );
            } else {
              const dt = await query(
                `insert into metaoptions(userId, keyname, value)values(${userId},"Address",'${address}')`
              );
            }
          } catch (error) {
            console.log("error", error);
          }
        }
      } else {
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

        const Address1 = customer["DISPLAYCONTACT"]["MAILADDRESS"]["ADDRESS1"];
        const Address2 = customer["DISPLAYCONTACT"]["MAILADDRESS"]["ADDRESS2"];
        const City = customer["DISPLAYCONTACT"]["MAILADDRESS"]["CITY"];
        const State = customer["DISPLAYCONTACT"]["MAILADDRESS"]["STATE"];
        const Zip = customer["DISPLAYCONTACT"]["MAILADDRESS"]["ZIP"];

        let dbTypeId = { id: 0 };
        let dbCustomerParentUserId = 0;
        let isCustomerinsert = false;
        if (typeId != "") {
          dbTypeId = alreadyTypesInDB.find((obj) => {
            return obj.name === typeId;
          });
        }

        const address = JSON.stringify({
          add1: Address1,
          add2: Address2,
          city: City,
          state: State,
          postalcode: Zip,
        });

        const customerExistSql = `SELECT * FROM users where email1="${email1}" and parentId != 0;`;
        const customerExist = await query(customerExistSql);
        if (parentId === "") {
          dbCustomerParentUserId = 0;
          if (email1 !== "") {
            const checkPar = await query(
              `SELECT id, parentId FROM parents WHERE parentId = "${customerId}"`
            );
            if (checkPar.length == 0) {
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
              if (insetUser.insertId) {
                const insert_parent_sql = `INSERT INTO parents (userId,parentId,record_no)VALUES("${insetUser.insertId}","${customerId}","${recordNo}")`;
                const insert_customer = await query(insert_parent_sql);

                const checkdtt = await query(
                  `select keyname, value from metaoptions where userId = ${insetUser.insertId}`
                );
                if (checkdtt.length > 0) {
                  const dtt = await query(
                    `update metaoptions set value = '${address}' where userId = ${insetUser.insertId}`
                  );
                } else {
                  const dt = await query(
                    `insert into metaoptions(userId, keyname, value)values(${insetUser.insertId},"Address",'${address}')`
                  );
                }
              }
            }
          }
        } else {
          console.log(
            "Customer id = ",
            SageIntacctCustomers[k]["CUSTOMERID"],
            " Record no",
            SageIntacctCustomers[k]["RECORDNO"],
            " Parent ID ",
            SageIntacctCustomers[k]["PARENTID"]
          );

          const getcustomerparentId = `select userId from parents where parentId = "${parentId}"`;
          const getcustomerparentIdResponse = await query(getcustomerparentId);
          if (getcustomerparentIdResponse.length > 0) {
            dbCustomerParentUserId = getcustomerparentIdResponse[0]?.userId;
          }
          if (email1 !== "") {
            console.log("email1 ", email1, " customerId ", customerId);
            const checkCust = await query(
              `SELECT id, customerId FROM customers WHERE customerId = "${customerId}"`
            );
            console.log("checkCust ", checkCust);
            if (checkCust.length == 0) {
              console.log("checkCust ");
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
              console.log("insert_user ", insert_user);
              const insetUser = await query(insert_user);
              if (insetUser.insertId) {
                const insert_customer_sql = `INSERT INTO customers (userId,customerId,record_no)VALUES("${insetUser.insertId}","${customerId}","${recordNo}")`;
                console.log("insert_customer_sql ", insert_customer_sql);
                const insert_customer = await query(insert_customer_sql);

                const checkdtt = await query(
                  `select keyname, value from metaoptions where userId = ${insetUser.insertId}`
                );
                if (checkdtt.length > 0) {
                  const dtt = await query(
                    `update metaoptions set value = '${address}' where userId = ${insetUser.insertId}`
                  );
                } else {
                  const dt = await query(
                    `insert into metaoptions(userId, keyname, value)values(${insetUser.insertId},"Address",'${address}')`
                  );
                }
              }
            }
          }

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
    console.log("error", error);
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

    for (k = 0; k < sageIntacctCustomerType.length; k++) {
      const typeName = sageintacctCustomerTypeName[k];
      const status = sageIntacctCustomerType[k]["STATUS"] === "active" ? 0 : 1;

      if (dbCustomerType.includes(sageintacctCustomerTypeName[k])) {
        const updateQuery = `update types set name="${typeName}",isDeleted=${status} where name ="${typeName}"`;
        const updateQueryResponse = await query(updateQuery);
      } else {
        const insertQuery = `insert into types(name,isDeleted)values("${typeName}",${status})`;

        const insertQueryResponse = await query(insertQuery);
      }
    }
    res.status(200).send("ok");
  } catch (error) {}
}

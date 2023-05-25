const jwt = require("jsonwebtoken");
const mysqlconnection = require("../../DB/db.config.connection");
const {
  createIntacctCustomer,
  deleteIntacctCustomer,
  updateIntacctCustomer,
} = require("../../SageIntacctAPIs/CustomerServices");
const util = require("util");
const query = util.promisify(mysqlconnection.query).bind(mysqlconnection);
const ResetEmailFormat = require("../Helper/templates/ResetEmailTemp");
const sendEmails = require("../Helper/sendEmails");
const WelcomrEmailFormat = require("../Helper/templates/welcomeEmailTemp");
var {
  generateHashPass,
  hashPassword,
} = require("../../Controllers/Helper/generatePassword");

const CustomerUpdateEamilFormat = require("../Helper/templates/customerupdateemailformat");
const {
  migrateCustomersToHubSpot,
  migrateEmailToHubSpot,
} = require("../../hubSpotContacts/hubSpotContacts");
const {
  GetEmailTemplates,
} = require("../../commonFunction/commonControllerFunction");
const {
  ReplaceEmailTemplate,
} = require("../../commonFunction/connonfunctions");

module.exports = {
  // Add user Controller
  addUserController: async (req, res) => {
    const {
      name,
      email1,
      email2,
      phone1,
      phone2,
      printUs,
      contactName,
      status,
      roleId,
      typeId,
      parentId,
      userRole,
      createdBy,
      previlegs,
      useraddress,
      agegroup,
      attentionto,
    } = req.body;

    const user_permition = previlegs;
    const per = JSON.stringify({ user_permition });
    const addr = JSON.stringify(useraddress);
    var customerId;
    var recordNo;

    const genPass = JSON.parse(await generateHashPass());
    if (parentId === 0 && (userRole === "parent" || userRole === "user")) {
      let = password = genPass.encPass;
    } else {
      let = password = "";
    }
    //check email query
    const check_email_query = `select id, email1 from users where email1 = "${email1}" and parentId = 0`;
    //insert query
    const insert_query = `INSERT INTO users (name, email1, email2, phone1, phone2, password, printUs, contactName, status, agegroup,roleId, typeId, parentId, createdBy, attentionTo, userRoles)VALUES("${
      name ? name : ""
    }", "${email1 ? email1 : ""}","${email2 ? email2 : ""}","${
      phone1 ? phone1 : 0
    }", "${phone2 ? phone2 : 0}","${password}","${printUs ? printUs : ""}","${
      contactName ? contactName : ""
    }", "${status ? status : 0}", "${agegroup ? agegroup : 0}", "${
      roleId ? roleId : 2
    }", "${typeId ? typeId : 0}", "${parentId ? parentId : 0}", "${
      createdBy ? createdBy : 1
    }","${attentionto ? attentionto : ""}","${userRole ? userRole : ""}")`;

    //insert customer (Child)
    if (parentId > 0 && userRole === "customer") {
      console.log("request: 1");
      //create customer
      mysqlconnection.query(insert_query, async function (err, responce) {
        if (err) throw err;
        const insertmeta = `insert into metaoptions(userId, keyname, value)values(${responce.insertId},"Address",'${addr}')`;
        mysqlconnection.query(insertmeta, function (err, result) {
          if (err) throw err;
        });
        if (responce) {
          //create customer
          var getParentId = "";
          if (parentId > 0) {
            const sqlToGetparentId = `select customerId from customers where userId = ${parentId}`;
            // mysqlconnection.query(sqlToGetparentId, function (err, result) {
            //   getParentId = result[0].id;
            // });
            const customerIdres = await query(sqlToGetparentId);
            if (customerIdres.length > 0) {
              getParentId = customerIdres[0]?.customerId;
            } else {
              const sqlToGetparentId = `select parentId from parents where userId = ${parentId}`;
              const sqlToGetparentIdRes = await query(sqlToGetparentId);
              getParentId = sqlToGetparentIdRes[0]?.parentId;
            }
          }
          let typeName = "";
          if (typeId > 0) {
            const getcustomertypename = `select name from types where id=${typeId}`;
            const getcustomertypenameResponse = await query(
              getcustomertypename
            );
            typeName = getcustomertypenameResponse[0].name;
          }
          const active = status === 0 ? false : true;
          const data = {
            name,
            email1,
            email2,
            phoneNumber1: phone1,
            phoneNumber2: phone2,
            active: active,
            parentCustomerId: getParentId,
            customerTypeId: typeName ? typeName : "",
            address: addr,
          };
          // if (status === 1 || status === "1") {
          console.log("createIntacctCustomer data", data);
          const instacctCustomer = await createIntacctCustomer(data);
          console.log("instacctCustomer =>", instacctCustomer);
          customerId = instacctCustomer._data[0]["CUSTOMERID"];
          recordNo = parseInt(instacctCustomer.data[0]["RECORDNO"]);
          const getCustuser = `select id from users where roleId = 2 and id = ${responce.insertId}`;
          mysqlconnection.query(getCustuser, function (err, result) {
            if (err) throw err;
            if (result.length > 0) {
              const insert_cust = `INSERT INTO customers (userId)VALUES(${result[0].id})`;
              mysqlconnection.query(insert_cust, function (err, custResult) {
                if (err) throw err;
                if (custResult) {
                  // const updtCust = `update customers set customerId = "CUST-000${custResult.insertId}" where id =${custResult.insertId}`;
                  const updtCust = `update customers set customerId = "${customerId}",record_no="${recordNo}" where id =${custResult.insertId}`;
                  mysqlconnection.query(updtCust, async function (err, result) {
                    if (err) throw err;
                    res.status(200).send({
                      data: custResult,
                      sageuserid: customerId,
                      message: "Customer Registration successfully.",
                    });
                  });
                }
              });
            }
          });
          // }
        }
        // res.status(200).send({
        //   data: responce,
        //   message:
        //     "Customer Registration successfully with inactive status.",
        // });
      });
    }
    //check email for users and parent
    if (userRole !== "customer") {
      mysqlconnection.query(check_email_query, function (err, result) {
        //insert child
        if (err) throw err;
        if (result.length > 0) {
          return res
            .status(400)
            .send({ message: "Email1 already registered." });
        } else {
          //insert user from user management
          if (userRole === "user") {
            mysqlconnection.query(insert_query, function (err, responce) {
              if (err) throw err;
              if (responce) {
                // const resetPasswordtoken = jwt.sign(
                //   { email1: email1, id: responce.insertId },
                //   process.env.JWT_SECRET_KEY
                // );

                // const custData = {
                //   name: name,
                //   email: email1,
                //   pass: genPass.pass,
                // };
                // const dt = ResetEmailFormat(resetPasswordtoken);
                // const mailid = WelcomrEmailFormat(custData);
                const insert_permition = `INSERT INTO metaoptions (userId,previlegs)VALUES(${responce.insertId},'${per}')`;
                mysqlconnection.query(
                  insert_permition,
                  async function (err, responce) {
                    if (err) throw err;
                    //send emails
                    const welcomeEmailTemp = await GetEmailTemplates(
                      (emailtype = "New_Customer")
                    );
                    var translations = {
                      customername: name,
                      customeremail: email1,
                      temporarypassword: genPass.pass,
                      companyloginurl: process.env.REACTURL,
                    };
                    const translatedHtml = await ReplaceEmailTemplate(
                      translations,
                      welcomeEmailTemp[0].emailbodytext
                    );
                    sendEmails(
                      email1,
                      welcomeEmailTemp[0].enailsubject,
                      translatedHtml
                    );
                    //sendEmails(email1, "Reset Password Link From QIS✔", dt);
                    //sendEmails(email1, "WELCOME TO QIS✔", mailid);
                    res.status(200).send({
                      data: responce,
                      message: "User Registration successfully.",
                    });
                  }
                );
              }
            });
          }
          //insert parent
          if (parentId === 0 && userRole === "parent") {
            mysqlconnection.query(insert_query, async function (err, responce) {
              const insertmeta = `insert into metaoptions(userId, keyname, value)values(${responce.insertId},"Address",'${addr}')`;
              mysqlconnection.query(insertmeta, function (err, result) {
                if (err) throw err;
              });
              let typeName = "";
              if (typeId > 0) {
                const getcustomertypename = `select name from types where id=${typeId}`;
                const getcustomertypenameResponse = await query(
                  getcustomertypename
                );
                typeName = getcustomertypenameResponse[0].name;
              }
              if (err) throw err;
              if (responce) {
                const active = status === 0 ? false : true;
                const data = {
                  name,
                  email1,
                  email2,
                  phoneNumber1: phone1,
                  phoneNumber2: phone2,
                  active: active,
                  // parentCustomerId: "",
                  customerTypeId: typeName ? typeName : "",
                  address: addr,
                };
                const instacctCustomer = await createIntacctCustomer(data);
                console.log("instacctCustomer =>", instacctCustomer);
                customerId = instacctCustomer._data[0]["CUSTOMERID"];
                recordNo = parseInt(instacctCustomer.data[0]["RECORDNO"]);

                //insert data into hubspot
                await migrateCustomersToHubSpot(
                  data,
                  customerId,
                  responce.insertId
                );

                //create parent
                const insert_parnt = `INSERT INTO parents (userId)VALUES(${responce.insertId})`;
                mysqlconnection.query(
                  insert_parnt,
                  async function (err, parntResult) {
                    if (err) throw err;
                    if (parntResult) {
                      // const updtparnt = `update parents set parentId = "PARNT-000${parntResult.insertId}" where id =${parntResult.insertId}`;
                      const updtparnt = `update parents set parentId = "${customerId}",record_no="${recordNo}" where id =${parntResult.insertId}`;
                      mysqlconnection.query(
                        updtparnt,
                        async function (err, result) {
                          if (err) throw err;
                          //create reset password token
                          // const resetPasswordtoken = jwt.sign(
                          //   {
                          //     email1: email1,
                          //     id: responce.insertId,
                          //     name: name,
                          //   },
                          //   process.env.JWT_SECRET_KEY
                          // );
                          // const custData = {
                          //   name: name,
                          //   email: email1,
                          //   pass: genPass.pass,
                          // };

                          const welcomeEmailTemp = await GetEmailTemplates(
                            (emailtype = "New_Customer")
                          );
                          var translations = {
                            customername: name,
                            customeremail: email1,
                            temporarypassword: genPass.pass,
                            companyloginurl: process.env.REACTURL,
                          };
                          const translatedHtml = await ReplaceEmailTemplate(
                            translations,
                            welcomeEmailTemp[0].emailbodytext
                          );
                          sendEmails(
                            email1,
                            welcomeEmailTemp[0].enailsubject,
                            translatedHtml
                          );

                          //welcome email
                          // const mailid = WelcomrEmailFormat(custData);
                          // sendEmails(email1, "WELCOME TO QIS✔", mailid);
                          //reset password email
                          // const dt = await ResetEmailFormat(resetPasswordtoken);
                          // sendEmails(
                          //   email1,
                          //   "Reset Password Link From QIS✔",
                          //   dt
                          // );
                          res.status(200).json({
                            data: result,
                            sageuserid: customerId,
                            msg1: "Parent Registration successfully.",
                          });
                          //add activity logs in hubspot
                          const emaildata = {
                            userid: responce.insertId,
                            email: email1,
                            subject: "WELCOME TO QIS✔",
                            bodyofemail: translatedHtml,
                          };
                          await migrateEmailToHubSpot(emaildata);
                        }
                      );
                    }
                  }
                );
              }
            });
          }
        }
      });
    }
  },

  //get users controller
  getUserController: async (req, res) => {
    const {
      status,
      customerType,
      contactName,
      number,
      sorting,
      ParentId,
      typeId,
      childId,
      isUser,
      isParent,
    } = req.body;

    let bystatus = "";
    if (status === 1) {
      bystatus = ` and status = ${status}`;
    } else if (status === 0) {
      bystatus = ` and status = ${status}`;
    } else {
      bystatus = "";
    }

    let bycontactName = "";
    if (contactName) {
      bycontactName = ` and contactName = "${contactName}"`;
    }

    let bytypeId = "";
    if (typeId) {
      bytypeId = ` and typeId = "${typeId}"`;
    }

    let bynumber = "";
    if (number) {
      bynumber = ` and phone1 = ${number}`;
    }

    let bysorting = "";
    if (sorting === 0) {
      bysorting = ` ORDER BY users.createdAt ASC`;
    } else if (sorting === 1) {
      bysorting = ` ORDER BY users.createdAt DESC`;
    } else if (sorting === 2) {
      bysorting = ` ORDER BY name ASC`;
    } else if (sorting === 3) {
      bysorting = ` ORDER BY name DESC`;
    } else {
      bysorting = "";
    }

    let bycustType = "";
    if (customerType) {
      bycustType = ` and typeId = ${customerType}`;
    }

    let ByparentId = "";
    if (ParentId) {
      ByparentId = ` and users.parentId  = ${ParentId}`;
    } else {
      ByparentId = "";
    }

    let isUser_SQL = " and users.roleId = 2";
    if (isUser) {
      isUser_SQL = ` and users.roleId not in (1,2)`;
    } else {
      isUser_SQL = " and users.roleId = 2";
    }

    let isParentUser_SQL = "";
    if (isParent) {
      isParentUser_SQL = ` and users.parentId  = '0' `;
    } else {
      isParentUser_SQL = "";
    }

    if (childId) {
      const qry = `select users.parentId from users where users.id = ${childId}`;
      mysqlconnection.query(qry, async function (err, result) {
        if (err) throw err;
        if (result) {
          const child_sql_query = `select users.id, roles.id as "roleId", customers.customerId, users.typeId, users.name, users.email1, users.email2, users.phone1, users.phone2, types.name as "CustomerType", users.contactName, users.status, users.printUs, users.parentId from users
              LEFT outer join roles on roles.id = users.roleId 
              LEFT outer join types on types.id = users.typeId 
              left outer join customers on customers.userId = users.id  
              where users.parentId = ${result[0].parentId}`;
          const child_Data = await query(child_sql_query);
          const childoutstamt = await query(
            `select customerId as id, SUM(amount) AS outstdamount from invoices where invoices.status = "Pending" and customerId = ${child_Data[0]?.id};`
          );
          const parent_sql_query = `select users.id, roles.id as "roleId", parents.parentId as isParentId, users.parentId, users.typeId, users.name, users.email1, users.email2, users.phone1, users.phone2, types.name as "CustomerType", users.contactName, users.status, users.printUs from users 
              LEFT outer join roles on roles.id = users.roleId
              LEFT outer join types on types.id = users.typeId 
              left outer join parents on parents.userId = users.id
              where users.id = ${result[0].parentId}`;
          const parent_Data = await query(parent_sql_query);
          const parentoutstamts = await query(
            `select customerId as id, SUM(amount) AS outstdamount from invoices where invoices.status = "Pending" and customerId = ${parent_Data[0]?.id}`
          );
          let userData = {};
          Object.assign(
            userData,
            { users: parent_Data.concat(child_Data) },
            {
              usersOut: childoutstamt.concat(parentoutstamts),
            }
          );
          return res.status(200).json({ message: "ok", data: userData });
        }
      });
    } else {
      var sqlquery = `select users.id, roles.id as "roleId", customers.customerId, parents.parentId as isParentId, users.typeId, parents.parentId as 'GeneratedParentId', users.parentId, users.name, users.email1, users.email2,
      users.phone1, users.phone2, types.name as "CustomerType", users.contactName,
      users.status, users.printUs, roles.name as "UserRole" from users
      LEFT outer join roles on roles.id = users.roleId
      LEFT outer join types on types.id = users.typeId
      left outer join customers on customers.userId = users.id
      left outer join parents on parents.userId = users.id
      where users.isDeleted = 0 ${bystatus}${bycontactName}${bynumber}${bycustType}${ByparentId}${isUser_SQL}${isParentUser_SQL}${bysorting}${bytypeId}`;
      let userData = {};
      mysqlconnection.query(sqlquery, async function (err, result) {
        if (err) throw err;
        const useroutstamt = await query(
          `select customerId as id, SUM(amount) AS outstdamount from invoices where invoices.status = "Pending" group by customerId ;`
        );
        Object.assign(userData, { users: result }, { usersOut: useroutstamt });
        return res.status(200).json({ message: "ok", data: userData });
      });
    }
  },

  getParentUserController: async (req, res) => {
    var sqlquery = `select  users.id as id ,  CONCAT(users.name, " (", parents.parentId, ")") as title, users.email1 as email 
      from users
      left join parents on parents.userId = users.id
      where users.isDeleted = 0  and users.parentId  = '0' and users.roleId = 2 order by id desc`;
    mysqlconnection.query(sqlquery, function (err, result) {
      if (err) throw err;
      return res.status(200).json({ message: "ok", data: result });
    });
  },

  //get user details controller
  getUserDetailsController: (req, res) => {
    const id = req.params.id;
    var sql = `select users.id, users.parentId,users.password, parents.parentId as sageParentId, users.name, users.email1, users.email2, users.phone1, users.phone2, users.typeId, users.contactName, users.printUs as printus, users.status, agegroup, users.createdAt, generatedId, users.attentionTo, roles.name as "role", roles.id as "roleId", metaoptions.previlegs as "userPrevilegs", metaoptions.value as "address", customers.customerId as sageCustomerId from users left outer join customers on customers.userId = users.id LEFT outer join roles on roles.id = users.roleId left outer join metaoptions on metaoptions.userId = users.id left outer join parents on parents.userId = users.id where users.id = ${id}`;
    mysqlconnection.query(sql, function (err, result) {
      if (err) throw err;
      res.status(200).json({ message: "ok", data: result });
    });
  },

  //edit user details controller
  editUserController: async (req, res) => {
    const id = req.params.id;
    const {
      name,
      email1,
      email2,
      phone1,
      phone2,
      printUs,
      contactName,
      status,
      typeId,
      roleId,
      parentId,
      previlegs,
      updatedBy,
      agegroup,
      password,
      pregeneratedid,
      useraddress,
      attentionto,
    } = req.body;

    let passwordEncode;
    if (password && password !== null) {
      passwordEncode = await hashPassword(password);
    }

    const user_permition = req.body.previlegs;
    const per = JSON.stringify({ user_permition });
    const addr = JSON.stringify(useraddress);

    let sql = `select id, name, email1, email2,password, phone1, phone2, roleId, typeId, parentId, contactName, printUs, status, agegroup, updatedBy, attentionTo from users where id=${id}`;
    mysqlconnection.query(sql, async function (err, result) {
      let RoleId = result ? result[0].roleId : "";
      if (err) throw err;
      if (RoleId == 2) {
        const queryUserId = `select customerId from customers where userId = "${id}"`;
        const userIdResponse = await query(queryUserId);
        let customerId;
        if (userIdResponse.length > 0) {
          customerId = userIdResponse[0]?.customerId;
        } else {
          const queryUserId = `select parentId from parents where userId = "${id}"`;
          const userIdResponse = await query(queryUserId);
          customerId = userIdResponse[0]?.parentId;
        }
        data = {
          customerId: customerId,
          customerName: name,
          active: true,
          primaryEmailAddress: email1,
          secondaryEmailAddress: email2,
          primaryPhoneNo: phone1,
          secondaryPhoneNo: phone2,
          addressLine1: useraddress?.add1,
          addressLine2: useraddress?.add2,
          city: useraddress?.city,
          stateProvince: useraddress?.state,
          zipPostalCode: useraddress?.postalcode,
          // parentCustomerId: parentIdOfCustomer[0].customerId,
        };
        await updateIntacctCustomer(data);
        //sending emails after updated customer details
        const UpdateEmailTemp = await GetEmailTemplates(
          (emailtype = "Update_Customer")
        );
        var translations = {
          customername: name,
          loginurl: process.env.REACTURL,
        };
        const translatedHtml = await ReplaceEmailTemplate(
          translations,
          UpdateEmailTemp[0].emailbodytext
        );
        sendEmails(
          result[0].email1,
          UpdateEmailTemp[0].enailsubject,
          translatedHtml
        );
        // const mailid = CustomerUpdateEamilFormat(data);
        // sendEmails(email1, "CUSTOMER DETAILDS UPDATED FROM QIS✔", mailid);
      }

      // if (roleId === 2 && result[0].status === 0 && status === 1) {
      //   const instacctCustomer = await createIntacctCustomer(data);
      //   console.log("instacctCustomer =>", instacctCustomer);
      //   customerId = instacctCustomer._data[0]["CUSTOMERID"];
      //   recordNo = parseInt(instacctCustomer.data[0]["RECORDNO"]);

      //   const getCustuser = `select id from users where roleId = 2 and id = ${result[0].id}`;
      //   mysqlconnection.query(getCustuser, function (err, userresult) {
      //     if (err) throw err;
      //     if (userresult.length > 0) {
      //       const insert_cust = `INSERT INTO customers (userId)VALUES(${userresult[0].id})`;
      //       mysqlconnection.query(insert_cust, function (err, custResult) {
      //         if (err) throw err;
      //         if (custResult) {
      //           // const updtCust = `update customers set customerId = "CUST-000${custResult.insertId}" where id =${custResult.insertId}`;
      //           const updtCust = `update customers set customerId = "${customerId}",record_no="${recordNo}" where id =${custResult.insertId}`;
      //           mysqlconnection.query(updtCust, async function (err, result) {
      //             if (err) throw err;
      //             //create reset password token
      //             const resetPasswordtoken = jwt.sign(
      //               { email1: email1, id: result[0].id },
      //               process.env.JWT_SECRET_KEY
      //             );
      //             const custData = {
      //               name: name,
      //               email: email1,
      //             };
      //             const mailid = WelcomrEmailFormat(custData);
      //             const dt = await ResetEmailFormat(resetPasswordtoken);
      //             sendEmails(email1, "Reset Password Link From QIS✔", dt);
      //             sendEmails(email1, "WELCOME TO QIS✔", mailid);
      //           });
      //         }
      //       });
      //     }
      //   });
      // }

      const updt_query = `update users set name = "${
        name ? name : result[0].name
      }", email1 = "${email1 ? email1 : result[0].email1}", email2 = "${
        email2 ? email2 : result[0].email2
      }", phone1 = ${phone1 ? phone1 : result[0].phone1}, phone2 = ${
        phone2 ? phone2 : result[0].phone2
      }, contactName="${
        contactName ? contactName : result[0].contactName
      }",password = "${password ? passwordEncode : result[0].password}",
      printUs = "${printUs ? printUs : result[0].printUs}", status= ${
        status ? status : 0
      } , agegroup = ${agegroup ? agegroup : result[0].agegroup}, typeId= ${
        typeId ? typeId : result[0].typeId
      }, 
       parentId = ${parentId ? parentId : result[0].parentId}, updatedBy = ${
        updatedBy ? updatedBy : result[0].updatedBy
      }, attentionTo = "${
        attentionto ? attentionto : result[0].attentionTo
      }", roleId = ${roleId ? roleId : result[0].roleId}  where id = ${id}`;

      mysqlconnection.query(updt_query, async function (err, result) {
        if (err) throw err;
        const checkdt = `select keyname, value from metaoptions where userId = ${id}`;
        const checkdtt = await query(checkdt);
        if (checkdtt.length > 0) {
          if (user_permition?.length > 0) {
            const update_permition = `update metaoptions set previlegs ='${per}', value = '${addr}' where userId = ${id}`;
            console.log("update_permition", update_permition);
            const dtt = await query(update_permition);
          }
        } else {
          const insertmeta = `insert into metaoptions(userId, keyname, value)values(${id},"Address",'${addr}')`;
          console.log("insertmeta", insertmeta);
          const dt = await query(insertmeta);
        }
        res.status(200).send({
          message: "User updated successfully.",
          // usersageid:userSage
        });
      });
    });
  },

  //delete user controller
  deleteUserController: (req, res) => {
    const id = req.params.id;
    // const idd = "";
    // var sql = `delete from users where id = ${id}`;
    var sqlquery = `SELECT * FROM customers where userId = ${id}`;
    var sql = `update users set isDeleted = 1 where id = ${id}`;
    mysqlconnection.query(sql, function (err, result) {
      if (err) throw err;
      // delete the Instacct customer
      mysqlconnection.query(sqlquery, async function (err, result) {
        if (err) throw err;
        if (result) {
          console.log("result =>", result[0].customerId);
          idd = result[0].customerId;
          await deleteIntacctCustomer({ customerId: result[0].customerId });
        }
      });
      res.status(200).json({
        message: "Data deleted successfully",
        responce: result,
        // deleteid: idd,
      });

      // if (result.affectedRows === 1) {
      //   const qwery = `select id, invoiceId from invoices where customerId = ${id}`;
      //   mysqlconnection.query(qwery, function (err, result) {
      //     if (err) throw err;
      //     const deleteinvoice = `update invoives set isDeleted = 1 where customerId = ${id}`;
      //     mysqlconnection.query(deleteinvoice, function (err, result) {
      //       if (err) throw err;
      //       res
      //         .status(200)
      //         .json({ message: "Data deleted successfully", responce: result });
      //     });
      //   });
      // }
    });
  },

  //get user by parent id
  GetUserByPidController: (req, res) => {
    const pid = req.params.id;
    var sql = `select users.id as id, users.name as name, users.typeId,  users.email1,  
    users.phone1, users.phone2, users.contactName,types.name as CustomerType,customers.customerId,parents.parentId as isParentId,
    users.status, users.printUs from users LEFT outer join types on types.id = users.typeId LEFT outer join customers on customers.userId = users.id  left outer join parents on parents.userId = users.id where users.id = ${pid}`;
    let userData = {};
    mysqlconnection.query(sql, async function (err, result) {
      if (err) throw err;
      const useroutstamt = await query(
        `select customerId as id, SUM(amount) AS outstdamount from invoices where invoices.status = "Pending" and customerId  = ${result[0]?.id}`
      );
      Object.assign(userData, { users: result }, { usersOut: useroutstamt });
      res.status(200).json({ message: "ok", data: userData });
    });
  },

  //get user by multiple ids id
  GetUserByMultipleIdController: (req, res) => {
    const ids = req.params.id;
    var sql = `select users.name, users.email1, users.email2, users.phone1, users.phone2, types.name as "CustomerType", users.contactName, users.status, users.printUs from users LEFT outer join types on types.id = users.typeId where users.id IN(${ids})`;
    mysqlconnection.query(sql, function (err, result) {
      if (err) throw err;
      res.status(200).json({ message: "ok", data: result });
    });
  },

  //get last insert id
  GetLastInsertIdController: (req, res) => {
    var sql = `select id from users order by id desc limit 1`;
    mysqlconnection.query(sql, function (err, result) {
      if (err) throw err;
      res.status(200).json({ message: "ok", data: result });
    });
  },

  //send user emails
  SendUserEmailController: async (req, res) => {
    const { id } = req.body;
    const genPass = JSON.parse(await generateHashPass());
    let = password = genPass.encPass;
    var sql = `select users.id, users.name, users.email1 FROM users where id = ${id}`;
    mysqlconnection.query(sql, async function (err, result) {
      if (err) throw err;
      var sql = `update users set password="${password}" WHERE users.email1="${result[0].email1}" && users.id=${id}`;
      await query(sql);
      //send emails
      const welcomeEmailTemp = await GetEmailTemplates(
        (emailtype = "New_Customer")
      );
      var translations = {
        customername: result[0].name,
        customeremail: result[0].email1,
        temporarypassword: genPass.pass,
        companyloginurl: process.env.REACTURL,
      };
      const translatedHtml = await ReplaceEmailTemplate(
        translations,
        welcomeEmailTemp[0].emailbodytext
      );
      sendEmails(
        result[0].email1,
        welcomeEmailTemp[0].enailsubject,
        translatedHtml
      );
      //reset mail
      // const resetPasswordtoken = jwt.sign(
      //   { email1: result[0].email1, id: result[0].id, name: result[0].name },
      //   process.env.JWT_SECRET_KEY
      // );
      // const dt = await ResetEmailFormat(resetPasswordtoken);
      // sendEmails(result[0].email1, "Reset Password Link From QIS✔", dt);
      res.status(200).json({ message: "ok", data: result });
    });
  },

  //get sage intact customer id
  GetCustomerId: (req, res) => {
    const ids = req.params.id;
    var sql = `select customerId FROM customers where userId = ${ids}`;
    mysqlconnection.query(sql, function (err, result) {
      if (err) throw err;
      res.status(200).json({ message: "ok", data: result });
    });
  },

  //select childs from parent id
  GetChildsByParentId: (req, res) => {
    const ids = req.params.id;
    var sql = `select users.id, users.name, users.email1, users.phone1, users.status, customers.customerId FROM users left outer join customers on customers.userId = users.id where parentId = ${ids}`;
    mysqlconnection.query(sql, function (err, result) {
      if (err) throw err;
      res.status(200).json({ message: "ok", data: result });
    });
  },

  //Cusromers Parent Details
  CusromersParentDetails: (req, res) => {
    var sql = `select users.name as parent_name, parents.parentId as parent_id from parents left outer join users on users.id  = parents.userId where userId = ${req.params.id}`;
    mysqlconnection.query(sql, function (err, result) {
      if (err) throw err;
      res.status(200).json({ message: "ok", data: result });
    });
  },
};

const express = require("express");
const router = express.Router();

//#####################################################################################
//##                               REQUIRE MIDDLEWARES                                #
//#####################################################################################
//authorization middlewar
const { verifyAuthToken } = require("../Middlewares/auth");
//aunthontication middleware
//const { verifyLoginAuthToken } = require("../Middlewares/loginauthtoken");
//upload
const upload = require("../Middlewares/uploadmulter");

//######################################################################################
//#                                REQUIRE CONTROLLERS                                 #
//######################################################################################

//#############  Get get auth token controller   #############
const { getauthtoken } = require("../Controllers/GetAuthtoken/getauthtoken");

//#############  Roles controllers  ###########################
const {
  addRoleController,
  getRoleController,
} = require("../Controllers/RoleController/rolecontroller");

//#############  types controllers  ###########################
const {
  addTypeController,
  getTypeController,
  deleteTypeController,
  TypeDetController,
  TypeEditController,
} = require("../Controllers/TypeController/typecontroller");

//#############  User controllers  ############################
const {
  addUserController,
  getUserController,
  deleteUserController,
  getUserDetailsController,
  editUserController,
  GetUserByPidController,
  GetUserByMultipleIdController,
  GetLastInsertIdController,
  SendUserEmailController,
  GetCustomerId,
  GetChildsByParentId,
  CusromersParentDetails,
  getParentUserController,
} = require("../Controllers/UserController/usercontroller");

//############  Student controller  ##########################
const {
  addstudentcontroller,
  getstudentcontroller,
  editstudentcontroller,
} = require("../Controllers/StudentController/studentcontroller");

//############  User login reset forgot pass controller  ############
const {
  userlogincontroller,
  forgotpasswordcontroller,
  resetpasswordcontroller,
  sendComposerMailcontroller,
} = require("../Controllers/AuthController/authcontroller");

//################        activities controllers      #########
const {
  getActivityController,
  getActivityDetailsController,
  getActivityDataController,
  deleteActivityController,
  editActivityController,
  addActivityController,
} = require("../Controllers/Activities/activitiescontrollers");

//################        logs controllers      #########
const {
  addActivityLogsController,
  getActivityLogsController,
} = require("../Controllers/logsDetailsController/activitylogsController");

//################    salesordercontrollers      #########
const {
  addSalesOrder,
  getSalesOrder,
  getSalesDetails,
  getActivityViewSales,
  editSalesOrder,
  deleteSalesOrder,
  getSalesOrderByUserId,
} = require("../Controllers/SalesOrderController/salesordercontrollers");

const { sendWelcomeEmail } = require("../SageIntacctAPIs/sendWelcomeEmail");
router.get("/sendWelcomeEmail", sendWelcomeEmail);

//################        invoice controllers      #########
const {
  CreateInvoice,
  getInvoice,
  getinvoiceAllStatus,
  deleteInvoice,
  updateInvoice,
  deleteActivityInvoice,
  SendInvoiceEmail,
  getInvoiceByUserId,
  getInvoiceNo,
  editInvoice,
  getInvoiceByUser,
  getPendingInvoice,
  GetCustomerIdByInvoiceNo,
  CreateTuitionInvoice,
  DownloadInvoiceController,
  GetInvoiceids,
} = require("../Controllers/InvoiceController/invoiceController");

//################  items controllers ########################
const {
  CreateItem,
  GetItem,
  GetItembyid,
  GetItemData,
  GetItemUnits,
  GetItembyidforCreateInvoice,
  GetProdctLineIds,
  GetCreditApplied,
  GetTransactionAmount,
} = require("../Controllers/InvoiceController/itemController");

//################  credit notes controllers ########################
const {
  addCreditNotesController,
  getCreditNotesController,
  getCreditNotesDetailsController,
  editCreditNotesController,
  getCredirBallanceController,
  insertAmount,
  insertPortalAmount,
  getCredirBallanceByUserController,
  getCreditReqByuserController,
  getCreditNotesStatus,
  getSageCreditNotesController,
  getSageCreditReqByuserController,
} = require("../Controllers/CreditNotes/creditNotesController");

// #############  transaction contrillers ######################
const {
  createTransaction,
  CBQWebhook,
  getTransactionByInvoiceIdOrderDesc,
  deleteTransaction,
  getTransactionByInvoiceId,
  updateTransaction,
  updateCBQTransaction,
  getTransactionbytransid,
  getReport,
  getReceiptNumbers,
} = require("../Controllers/TransactionController");

// #############  temp_transaction contrillers ######################
const {
  createTempTransaction,
  getTempTransactionByid,
  deleteTempTransaction,
} = require("../Controllers/Temp_Transaction/tempTransaction");

//################        check emails controllers ########################
const { CheckEmails } = require("../Controllers/CheckEmails");
const {
  DownloadReceiptController,
  DownloadReceiptAfterPay,
  DownloadReceiptUsingTRXIdAfterPay,
} = require("../Controllers/reportsController");

const { QpayController } = require("../Controllers/QPayController");
//#######################################################################################
const { CBQController } = require("../Controllers/CBQController");

//#                                    ROUTERS                                          #
//#######################################################################################
router.post("/get_qpay", QpayController);
router.post("/get_cbq_data", CBQController);

//############################## get  authorization tokenss ###################
router.get("/get_authorization_token", getauthtoken);

//############################## get  authorization tokenss ###################
const {
  AmexController,
  getAmexRetriveOrder,
} = require("../Controllers/AmexController");
router.post("/get_amex_session", AmexController);
router.post("/getAmexRetriveOrder", getAmexRetriveOrder);

//############################## role routers    ###############################
router.post("/addRole", verifyAuthToken, addRoleController);
router.get("/getRole", verifyAuthToken, getRoleController);

//############################## type routers    ###############################
router.post("/addType", verifyAuthToken, addTypeController);
router.get("/getType", verifyAuthToken, getTypeController);
router.get("/getTypeDet/:id", verifyAuthToken, TypeDetController);
router.put("/editType/:id", verifyAuthToken, TypeEditController);
router.delete("/deleteType/:id", verifyAuthToken, deleteTypeController);
//#############################  user routers ##################################
router.post("/addUser", verifyAuthToken, addUserController);
router.post("/getUser", verifyAuthToken, getUserController);
router.post("/getParentUser", verifyAuthToken, getParentUserController);
router.get("/getUserDetails/:id", verifyAuthToken, getUserDetailsController);
router.put("/edituser/:id", verifyAuthToken, editUserController);
router.delete("/deleteuser/:id", verifyAuthToken, deleteUserController);
router.get("/getuserbypid/:id", verifyAuthToken, GetUserByPidController);
router.get(
  "/getuserbymultipleid/:id",
  verifyAuthToken,
  GetUserByMultipleIdController
);
router.get("/getParentsDetByCustomerId/:id", CusromersParentDetails);

router.get("/getLastInsertId", verifyAuthToken, GetLastInsertIdController);
router.post("/sendUserEmail", verifyAuthToken, SendUserEmailController);
router.get("/getSageCustomerid/:id", verifyAuthToken, GetCustomerId);
router.get("/getChildsByparentId/:id", verifyAuthToken, GetChildsByParentId);
//##############################  students routes   ############################
router.post("/addstudent", upload.none(), addstudentcontroller);
router.get("/getstudentbyuser/:id", getstudentcontroller);
router.put("/updatestudent/:id", editstudentcontroller);

//#############################  Auth login reset forgot pas router  ###########
router.post("/userlogin", verifyAuthToken, userlogincontroller);
router.post("/forgotpassword", verifyAuthToken, forgotpasswordcontroller);
router.post("/resetpassword", verifyAuthToken, resetpasswordcontroller);
router.post("/sendcomposer", sendComposerMailcontroller);

//#############################  activities routers  ###########################
router.post("/getActivity", verifyAuthToken, getActivityController);
router.get(
  "/getActivityDetails/:id",
  verifyAuthToken,
  getActivityDetailsController
);
router.get("/getActivityData/:id", verifyAuthToken, getActivityDataController);
router.put(
  "/editActivity/:id",
  upload.none(),
  verifyAuthToken,
  editActivityController
);
router.post(
  "/addActivity",
  upload.none(),
  verifyAuthToken,
  addActivityController
);

router.delete("/deleteActivity/:id", verifyAuthToken, deleteActivityController);

//#############################  logs routers  ###########################
router.post("/getlogsactivity", verifyAuthToken, getActivityLogsController);
router.post(
  "/addlogsactivity",
  upload.none(),
  verifyAuthToken,
  addActivityLogsController
);

//#############################  SalesOrders routers  ###########################
router.post("/addSalesOrders", upload.none(), addSalesOrder);
router.post("/getSalesOrders", getSalesOrder);
router.post("/getReports", getReport);
router.get("/getSalesOrdersDetails/:id", getSalesDetails);
router.get("/getactivitybyuserid/:id", getActivityViewSales);
router.put("/editSalesOrders/:id", upload.none(), editSalesOrder);
router.delete("/deleteSalesOrders/:id", deleteSalesOrder);
router.get("/getSalesOrdersByUser/:id", verifyAuthToken, getSalesOrderByUserId);
router.get("/getreceiptnumbers", getReceiptNumbers);

//#########################  invoice routers  ###########################

router.post("/createInvoice", upload.none(), CreateInvoice);
router.post("/createTuitionInvoice", upload.none(), CreateTuitionInvoice);
router.post("/getInvoice/:id?", upload.none(), getInvoice);
router.get("/getInvoiceByStatus", upload.none(), getinvoiceAllStatus);
router.delete("/deleteInvoice/:id", upload.none(), deleteInvoice);
router.delete(
  "/deleteActivityInvoice/:id",
  upload.none(),
  deleteActivityInvoice
);

router.put("/updateInvoice/:id", upload.none(), updateInvoice);
router.post("/editInvoice/:id", upload.none(), editInvoice);
router.get("/getinvoiceids", upload.none(), GetInvoiceids);
router.get("/sendInvoiceEmail/:id", SendInvoiceEmail);
router.get("/getInvoicebyUser/:id", getInvoiceByUserId);
router.post("/getInvoicebyUser/:id", getInvoiceByUser);
router.post("/getPendingInvoices/:id", getPendingInvoice);
router.get("/getcustomeridByinvoiceid/:id", GetCustomerIdByInvoiceNo);
router.get("/getInvoiceNo", getInvoiceNo);
//############################ Item routers ############################
router.post("/createItem", upload.none(), CreateItem);
router.post("/getItembyid/:id", upload.none(), GetItembyid);
router.post("/getCreditApplied/:id", upload.none(), GetCreditApplied);
router.post("/getTransactionAmount/:id", upload.none(), GetTransactionAmount);

router.get("/getItem", GetItem);
router.get("/getItemUnits", GetItemUnits);
router.get("/getItems", GetItemData);
router.get("/getItemsForCreateInvoice/:id", GetItembyidforCreateInvoice);
router.get("/getProdctLineIds", GetProdctLineIds);

// ######################## Transaction Routes ############################
router.post("/createTransaction", createTransaction);
router.post("/getTransaction", getTransactionByInvoiceId);
router.post("/getTransactionByDescOrder", getTransactionByInvoiceIdOrderDesc);
router.post("/cbqWebHook", CBQWebhook);
router.put("/updateTransaction", updateTransaction);
router.put("/updateCBQTransaction", updateCBQTransaction);
router.get("/getTransId/:id", getTransactionbytransid);
router.delete("/deleteTransaction/:id", deleteTransaction);

// #################### Dash Board Route ##################
const {
  calculateDataForDashboard,
} = require("../Controllers/DashBoardController");
router.get("/dashboardData", verifyAuthToken, calculateDataForDashboard);

// #################### Temperory Transaction Route ##################

router.post("/createTempTransaction", createTempTransaction);
router.get("/getTempTransaction/:id", getTempTransactionByid);
router.delete("/deleteTempTransaction/:id", deleteTempTransaction);

// IntacctAPIs Routes do not touch
const {
  getListCustomersLegacy,
  createIntacctCustomer,
  updateIntacctCustomer,
  deleteIntacctCustomer,
  getIntacctCustomerById,
  getListofCustomersType,
  getCustomerBySmartEvent,
} = require("../SageIntacctAPIs/CustomerServices");
const {
  getInvoiceList,
  createInstacctInvoice,
  deleteInstacctInvoice,
  updateInstacctInvoice,
  getListARPayments,
  getARInvoiceRecordNumber,
} = require("../SageIntacctAPIs/InvoiceService");
const {
  getListOfItems,
  getListOfItemsByFilter,
  createSageIntacctItem,
  updateSageIntacctItem,
  deleteSageIntacctItem,
  getItemBySmartEvent,
  getListOfProductLines,
} = require("../SageIntacctAPIs/ItemServices");
const {
  getListOfSalesInovice,
  createSalesInvoice,
  updateSalesInvoice,
  deleteSalesInvoice,
  getSalesInoviceBySmartEvent,
} = require("../SageIntacctAPIs/SalesInvoiceService");
const {
  getListOfSalesOrder,
  createSalesOrder,
  updateSalesOrder,
  deleteSageIntacctSalesOrder,
  getSalesOrderBySmartEvent,
} = require("../SageIntacctAPIs/SalesOrderService");

const {
  getListTuitionInvoices,
  createTuitionInvoice,
  updateTuitionInvoice,
  deleteTuitionInvoice,
  getTuitionInvoiceBySmartEvent,
  getUnitOfMesurements,
  getUnitOfMesurementsBySmartEvent,
  deleteUnitOfMesurementsBySmartEvent,
} = require("../SageIntacctAPIs/TuitionInvoiceService");

const {
  createpaymentAndApplyOnARInvoice,
} = require("../SageIntacctAPIs/PaymentServices");
const {
  sendChasingEmails,
  getChasingTriggers,
  addChasingTrigger,
  getChasingEvents,
  delChasingEvent,
  editChasingEvent,
} = require("../SageIntacctAPIs/chasingEmails");

const {
  getListOfCreditNote,
  getCreditNotesBySmartEvent,
} = require("../SageIntacctAPIs/CreditNoteServices");

router.get("/sendChasingEmails", sendChasingEmails);
router.get("/getChasingTrigger", getChasingTriggers);
router.post("/addChasingTrigger", addChasingTrigger);
router.get("/getChasingEvents", getChasingEvents);
router.delete("/deleteChasingEvent/:id", delChasingEvent);
router.put("/updateChasingEvent/:id", editChasingEvent);

router.get("/getListOfCreditNote", getListOfCreditNote);
router.post("/getCreditNotesBySmartEvent", getCreditNotesBySmartEvent);

router.get("/getListCustomersLegacy", getListCustomersLegacy);
router.get("/getListCustomersTypeLegacy", getListofCustomersType);
router.get("/getCustomerByRecordId", getIntacctCustomerById);
router.post("/getCustomerBySmartEvent", getCustomerBySmartEvent);

router.get("/getInvoiceLegacy", getListOfSalesInovice);
router.post("/createSalesInvoice", createSalesInvoice);
router.put("/updateSalesInvoice", updateSalesInvoice);
router.delete("/deleteSalesInvoice", deleteSalesInvoice);
router.post("/getSalesInoviceBySmartEvent", getSalesInoviceBySmartEvent);

router.get("/getItemsLegacy", getListOfItems);
router.get("/getFilterItemsLegacy", getListOfItemsByFilter);
// router.post('/createSageIntacctItem',createSageIntacctItem)
router.put("/updateSageIntacctItem", updateSageIntacctItem);
router.delete("/deleteSageIntacctItem", deleteSageIntacctItem);
router.post("/getItemBySmartEvent", getItemBySmartEvent);
router.get("/getListOfProductLines", getListOfProductLines);

router.get("/getSalesOrderLegacy", getListOfSalesOrder);
router.post("/getSalesOrderBySmartEvent", getSalesOrderBySmartEvent);

router.get("/getListTuitionInvoices", getListTuitionInvoices);
router.post("/createTuitionInvoice", createTuitionInvoice);
router.put("/updateTuitionInvoice", updateTuitionInvoice);
router.delete("/deleteTuitionInvoice", deleteTuitionInvoice);
router.post("/getTuitionInvoiceBySmartEvent", getTuitionInvoiceBySmartEvent);
router.get("/getUnitOfMesurements", getUnitOfMesurements);
router.post(
  "/getUnitOfMesurementsBySmartEvent",
  getUnitOfMesurementsBySmartEvent
);
router.post(
  "/deleteUnitOfMesurementsBySmartEvent",
  deleteUnitOfMesurementsBySmartEvent
);

router.get("/AccountsReceivable/getARInvoice", getInvoiceList);
router.post(
  "/AccountsReceivable/getARInvoiceRecordNo",
  getARInvoiceRecordNumber
);
router.get("/AccountsReceivable/getARPayment", getListARPayments);
router.post(
  "/AccountsReceivable/applyPayment",
  createpaymentAndApplyOnARInvoice
);
// router.post('/createSalesOrder',createSalesOrder)
// router.put('/updateSalesOrder',updateSalesOrder)
// router.delete('/deleteSalesOrder',deleteSageIntacctSalesOrder)

// router.post('/createIntacctCustomer' ,createIntacctCustomer);
// router.put('/updateIntacctCustomer' ,updateIntacctCustomer);
// router.delete('/deleteIntacctCustomer' ,deleteIntacctCustomer);
//######################### credit notes routesr #######################
router.post("/addCreditNotes", verifyAuthToken, addCreditNotesController);
router.post("/getCreditNotes", verifyAuthToken, getCreditNotesController);
router.post(
  "/getSageCreditNotes",
  verifyAuthToken,
  getSageCreditNotesController
);
router.post("/getCreditStatusNotes", verifyAuthToken, getCreditNotesStatus);
router.put("/editCreditNotes/:id", verifyAuthToken, editCreditNotesController);
router.get(
  "/getCreditNotesDetails/:id",
  verifyAuthToken,
  getCreditNotesDetailsController
);
router.get(
  "/creditballanceByUser/:id",
  verifyAuthToken,
  getCredirBallanceByUserController
);
router.get("/creditballance/:id", verifyAuthToken, getCredirBallanceController);
router.put("/insertAmount", verifyAuthToken, insertAmount);
router.put("/insertDbAmount", verifyAuthToken, insertPortalAmount);

router.get(
  "/getCreditReqByuser/:id",
  verifyAuthToken,
  getCreditReqByuserController
);

router.get(
  "/getSageCreditReqByuser/:id",
  verifyAuthToken,
  getSageCreditReqByuserController
);

//######################### check emails and send emails functionality #######################
router.post("/checkEmails", CheckEmails);
router.post("/sendEmailAfterPay", DownloadReceiptController);
router.post("/downloadinvoice", DownloadInvoiceController);
router.post("/downloadreceipt", DownloadReceiptAfterPay);
router.post("/downloadreceiptbytrxid", DownloadReceiptUsingTRXIdAfterPay);

//######################### HubSpot #################
const { migrateEmailToHubSpot } = require("../hubSpotContacts/hubSpotContacts");
router.post("/migrateEmailToHubSpot", migrateEmailToHubSpot);

//######################  manage email templates ########################################
const {
  GetEmailTemplate,
  GetEmailTemplateById,
  GetEmailtypes,
  UpdateEmailTemplate,
  AddEmailTemplate,
  AddEmailType,
} = require("../Controllers/EmailTemplate/emailtemplatecontroller");
router.get("/getemailtemplate", GetEmailTemplate);
router.get("/getemailtemplatebyid/:id", GetEmailTemplateById);
router.get("/getemailtypes", GetEmailtypes);
router.put("/updateemailtemplate/:id", UpdateEmailTemplate);
router.post("/addemailtemplate", AddEmailTemplate);
router.post("/addemailtype", AddEmailType);

///////////////////ARPaymentChecking//////////////////////////////////
const { ARController } = require("../SageIntacctAPIs/CheckingARController");
router.post("/check_ar_payment", ARController);

module.exports = router;

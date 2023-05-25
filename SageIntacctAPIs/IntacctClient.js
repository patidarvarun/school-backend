const IA = require("@intacct/intacct-sdk");

const baseURL = process.env.GLOBAL_ENDPOINT_URL;
const senderId = process.env.GLOBAL_SENDER_ID;
const senderPassword = process.env.GLOBAL_SENDER_PASSWORD;
const companyId = process.env.COMPANY_ID;
const userId = process.env.USER_ID;
const userPassword = process.env.USER_PASSWORD;
let clientConfig = new IA.ClientConfig();
clientConfig.endpointUrl = baseURL;
clientConfig.senderId = senderId;
clientConfig.senderPassword = senderPassword;
clientConfig.companyId = companyId;
clientConfig.userId = userId;
clientConfig.userPassword = userPassword;

// let sessionConfig =  IA.SessionProvider.factory(clientConfig);
const client = new IA.OnlineClient(clientConfig);

module.exports = {
  client,
  IA,
};

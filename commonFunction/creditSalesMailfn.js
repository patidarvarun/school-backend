const sendEmails = require("../Controllers/Helper/sendEmails");
const CreditRequestTemplate = require("../Controllers/Helper/templates/creditRequestTemplate");


const CreditSalesMailfn =async (data,title) => {
   
    const emailSent = await CreditRequestTemplate(data);
    if (title !== "") {
    sendEmails(
      data?.userEmail,
      "Credit Request Approved From QIS✔",
      emailSent
    );
    sendEmails(
      process.env.SMTP_TO_EMAIL,
      "Credit Request Approved From QIS✔",
      emailSent
    );
}else{
    sendEmails(
        data?.userEmail,
        "Credit Request From QIS✔",
        emailSent
      );
      sendEmails(
        process.env.SMTP_TO_EMAIL,
        "Credit Request From QIS✔",
        emailSent
      );
}
};
    module.exports = CreditSalesMailfn;
    
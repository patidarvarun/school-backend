const FooterTemplate = require("../comman/footer");
const HeaderTemplate = require("../comman/header");
const jwt_decode = require("jwt-decode");

const ResetEmailFormat = (token) => {
  var token = token;
  var decoded = jwt_decode(token);
  return `${HeaderTemplate()}
  <tr>
  <td style="text-align: center; padding-top: 50px;">
      <h1 style="font-size: 23px; color: #22489e; font-weight: bold; font-family: Arial, Helvetica, sans-serif;"> FORGOT YOUR PASSWORD</h1>
  </td>
<tr>
  <tr>
            <td style="text-align: left; padding: 0px 25px 45px;">
                <p style="font-size: 13px; color: #414042; font-family: Arial, Helvetica, sans-serif;">Hi, ${
                  decoded && decoded?.name
                } </p>
                <p style="font-size: 13px; color: #414042; font-family: Arial, Helvetica, sans-serif;">We’ve received a request to reset the password for your account 
                <a href="mailto:${
                  decoded && decoded?.email1
                }" style="color: #6584DB !important;">${
    decoded && decoded?.email1
  }</a></p>
                <p style="font-size: 13px; color: #414042; font-family: Arial, Helvetica, sans-serif;">We cannot simply send you your old password. A unique link
                to reset your password has been generated for you. To reset
                your password, click the following link and follow the
                instructions.</a></p>
                <a style="border-radius: 5px;
                background: #6584DB;
                color: #ffffff;
                font-size: 16px; padding: 10px 27px;
                display: inline-block;" href="${
                  process.env.REACTURL
                }/auth/reset_password?key=${token}" >Reset Your Password</a>
                <p style="line-height:15.0pt"><span style="font-family:&quot;Arial&quot;,sans-serif;color:#153643">Regards<br>
<strong>Mohammad Al-Masri</strong><br>
<strong>Finance Relationship Manager</strong><br>
Qatar International School<br>
Tel: +974 4483 3456 Ext: 291<br>
Email: <a href="mailto:almasrim@qis.org" target="_blank">almasrim@qis.org</a><br>
</span></p>
            </td>
          </tr>
          ${FooterTemplate()}`;
};

module.exports = ResetEmailFormat;

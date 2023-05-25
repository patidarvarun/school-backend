const FooterTemplate = require("../comman/footer");
const HeaderTemplate = require("../comman/header");

const WelcomrEmailFormat = (data) => {
  return `${HeaderTemplate()}
  <tr>
  <td style="text-align: center; padding-top: 50px;">
      <h1 style="font-size: 23px; color: #22489e; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">WELCOME TO QATAR,
      CUSTOMER SELF SERVICE</h1>
  </td>
<tr>
  <tr>
            <td style="text-align: left; padding: 0px 25px 45px;">
                <p style="font-size: 13px; color: #414042; font-family: Arial, Helvetica, sans-serif;line-height: 27px;">Hi, ${
                  data.name
                }</p>
                <p style="font-size: 13px; color: #414042; font-family: Arial, Helvetica, sans-serif;line-height: 27px;">Dear ${
                  data.name
                }, It is with immense pleasure that I welcome you to QIS. You can login to our system with below mentioned details.</a></p>
                
                <p style="font-size:13px;color:#414042;font-family:Arial,Helvetica,sans-serif;line-height: 27px;">Email : ${
                  data.email
                }</p>
                <p style="font-size:13px;color:#414042;font-family:Arial,Helvetica,sans-serif;line-height: 27px;">Temp Password : ${
                  data.pass
                }</p>
                <br />
                <a style="border-radius: 5px;
                background: #6584DB;
                color: #ffffff;
                font-size: 16px; padding: 10px 27px;
                display: inline-block;" href=${process.env.REACTURL}>Click to Login</a>
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
module.exports = WelcomrEmailFormat;

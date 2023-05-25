const FooterTemplate = require("../comman/footer");
const HeaderTemplate = require("../comman/header");

const WelcomeTemplate = (data) => {
  return `${HeaderTemplate()}
  <tr>
  <td style="text-align: center; padding-top: 50px;">
      <h1 style="font-size: 35px; color: #22489e; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">Welcome</h1>
  </td>
<tr>
  <tr>
            <td style="text-align: left; padding: 0px 25px 45px;">
                <p style="font-size: 18px; color: #414042; font-family: Arial, Helvetica, sans-serif;">Hi, ${data?.name}</p>
                <p style="font-size: 18px; color: #414042; font-family: Arial, Helvetica, sans-serif;">Welcome To QIS the account created with this mail</p>
                <p>${data?.email}<p/>
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

module.exports = WelcomeTemplate;

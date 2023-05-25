const FooterTemplate = require("../comman/footer");
const HeaderTemplate = require("../comman/header");

const CustomerUpdateEamilFormat = (data) => {
  return `${HeaderTemplate()}
  <tr>
  <td style="text-align: center; padding-top: 50px;">
      <h1 style="font-size: 23px; color: #22489e; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">CUSTOMER DETAILS UPDATED</h1>
  </td>
<tr>
  <tr>
            <td style="text-align: left; padding: 0px 25px 45px;">
                <p style="font-size: 13px; color: #414042; font-family: Arial, Helvetica, sans-serif;line-height: 15px;">Hi, ${data.customerName.toUpperCase()}</p>
                <p style="font-size: 13px; color: #414042; font-family: Arial, Helvetica, sans-serif;line-height: 20px;">Dear ${data.customerName.toUpperCase()}, Your details has been updated successfully from our portal. you can login to our system and get updated details.</a></p>
                <br />
                <a style="border-radius: 5px;
                background: #6584DB;
                color: #ffffff;
                font-size: 16px; padding: 10px 27px;
                display: inline-block;" href=${
                  process.env.REACTURL
                }>Click Here</a>
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
module.exports = CustomerUpdateEamilFormat;

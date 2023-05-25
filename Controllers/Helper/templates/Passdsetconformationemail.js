const FooterTemplate = require("../comman/footer");
const HeaderTemplate = require("../comman/header");

const Passdsetconformationemail = async (name) => {
  return `
  ${HeaderTemplate()}

  <tr>
  <td style="text-align: center; padding-top: 50px;">
      <h1 style="font-size: 23pxpx; color: #22489e; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">PASSWORD CHANGE SUCCESSFULLY</h1>
  </td>
<tr>
  <tr>
            <td style="text-align: left; padding: 0px 25px 45px;">
                <p style="font-size: 13px; color: #414042; font-family: Arial, Helvetica, sans-serif;">Hi, ${name} </p>
                <p style="font-size: 13px; color: #414042; font-family: Arial, Helvetica, sans-serif;"> Your Password Change successfully, We have requested to Login Your Account.
               </p>
               <a
               href=${process.env.REACTURL}
              style=" background: #6584DB;
              color: #ffffff;
              font-size: 16px; padding: 10px 27px;
              display: inline-block;""
            >
              Click to Login
            </a>
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

module.exports = Passdsetconformationemail;

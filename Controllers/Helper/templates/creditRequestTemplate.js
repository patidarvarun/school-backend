const FooterTemplate = require("../comman/footer");
const HeaderTemplate = require("../comman/header");

const CreditRequestTemplate = (data) => {
  console.log('@#########',data);
  return `${HeaderTemplate()}
  <tr>
  <td style="text-align: center; padding-top: 50px;">
      <h1 style="font-size: 35px; color: #22489e; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">Credit Request</h1>
  </td>
<tr>
  <tr>
            <td style="text-align: left; padding: 0px 25px 45px;">
                <p style="font-size: 18px; color: #414042; font-family: Arial, Helvetica, sans-serif;">Hi, ${data?.userName}</p>
                <!-- <p style="font-size: 18px; color: #414042; font-family: Arial, Helvetica, sans-serif;">The new credit request is credit </p>
                <p>Name : ${data?.userName}<p/> -->
                <p>Email : ${data?.userEmail}<p/>
                <h6 style="font-size: 18px; color: #414042; font-family: Arial, Helvetica, sans-serif;">INVOICE ID : ${data?.invoiceID}</a></h6>
                <h3>Message : ${data?.message}</h3>
                <h4>Amount : ${data?.amount}(QAR)<h4/>
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

module.exports = CreditRequestTemplate;

const FooterTemplate = require("../comman/footer");
const HeaderTemplate = require("../comman/header");
const formatePrice = require("../../../commonFunction/formatedamount");
const SalesTemplate = (getsalesData, invoice_items) => {
  return ` 
  ${HeaderTemplate()}
  <tr>
  <td style="text-align: center; padding-top: 50px;">
      <h1 style="font-size: 23px; color: #22489e; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">SALES ORDER DETAILS</h1>
  </td>
<tr>
  <tr>
  <td align="center">
  <table class="email-content" width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td class="email-body" width="570" cellpadding="0" cellspacing="0">
        <table class="email-body_inner" align="center" width="570" cellpadding="0" cellspacing="0" role="presentation">
          <!-- Body content -->
          <tr>
            <td class="content-cell">
              <div class="f-fallback">
                <h1 style="font-size: 13px; color: #414042; font-family: Arial, Helvetica, sans-serif">Hi, ${
                  getsalesData[0]?.name
                }
                </h1>
                <p style="font-size:13px;color:#414042;font-family:Arial,Helvetica,sans-serif">Thanks for Purchasing. This is an sales order for your recent purchase.</p>
                <table class="attributes" width="100%" cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td class="attributes_content">
                      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                        <tr>
                          <td class="attributes_item">
                            <span class="f-fallback">
                          <strong>Amount :</strong> ${formatePrice(
                            getsalesData[0]?.amount
                          )} (QAR)
                       </span>
                          </td>
                        </tr>
                        <tr>
                          <td class="attributes_item">
                            <span class="f-fallback">
    </span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
                <table class="purchase" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                      <td class="attributes_item">
                        <span class="f-fallback">
                      <strong>Date : </strong> ${
                        getsalesData[0]?.sales_order_created_date
                      }
                    </span>
                      </td>
                    </tr>
                  <tr>
                    <td colspan="2">
                      <table class="purchase_content" width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <th class="purchase_heading" align="left">
                            <p class="f-fallback">Item Name</p>
                          </th>
                          <th class="purchase_heading" align="left">
                            <p class="f-fallback">Amount</p>
                          </th>
                        </tr>
                        <tr>
                          <td width="35%" class="purchase_item"><span class="f-fallback">${
                            invoice_items[0]?.item_name
                          }</span></td>
                          <td class="align-left" width="20%" style="
                          text-align: end;
                      " class="purchase_item"><span class="f-fallback">${
                        invoice_items[0]?.item_price
                      }(QAR)</span></td>
                        </tr>
                        <tr>
                          <td>
                            <p class="f-fallback purchase_total purchase_total--label">Total</p>
                          </td>
                          <td width="20%" class="purchase_footer" valign="middle">
                            <p class="f-fallback purchase_total">${formatePrice(
                              getsalesData[0]?.amount
                            )}(QAR)</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
                <p style="line-height:15.0pt"><span style="font-family:&quot;Arial&quot;,sans-serif;color:#153643">Regards<br>
<strong>Mohammad Al-Masri</strong><br>
<strong>Finance Relationship Manager</strong><br>
Qatar International School<br>
Tel: +974 4483 3456 Ext: 291<br>
Email: <a href="mailto:almasrim@qis.org" target="_blank">almasrim@qis.org</a><br>
</span></p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</td>
          </tr>
  ${FooterTemplate()}`;
};

module.exports = SalesTemplate;

const FooterTemplate = require("../comman/footer");
const HeaderTemplate = require("../comman/header");
const moment = require("moment");
const formatePrice = require("../../../commonFunction/formatedamount");
const SalesInvoiceReportsTemplate = (
  InvoiceTrxDet,
  invoice_items,
  parent_det
) => {
  console.log(InvoiceTrxDet, invoice_items);
  return `${HeaderTemplate()}
  <tr>
  <td style="text-align: center; padding-top: 50px;">
      <h1 style="font-size: 23px; color: #22489e; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">
      ${
        // invoiceTitle === "SALES"
        //   ? "SALES ORDER PURCHASE SUCCESSFULLY"
        //   : "INVOICE PURCHASE SUCCESSFULLY"
        `INVOICE RECEIPT CONFIRMATION`
      }
      </h1>
  </td>
<tr>
  <tr>
  <td align="center">
  <table class="email-content" width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center">
          <table class="email-content" width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <!-- Email Body -->
            <tr>
              <td class="email-body" width="570" cellpadding="0" cellspacing="0">
                <table class="email-body_inner" align="center" width="570" cellpadding="0" cellspacing="0" role="presentation">
                  <!-- Body content -->
                  <tr>
                    <td class="content-cell">
                      <div class="f-fallback">
                        <h1 style="font-size: 13px; color: #414042; font-family: Arial, Helvetica, sans-serif">Hi, ${InvoiceTrxDet[0].name.toUpperCase()}
                        </h1>
                        <p style="font-size: 13px; color: #414042; font-family: Arial, Helvetica, sans-serif">Thanks for purchasing. This is an Invoice receipt for your recent purchase.</p>
                        <table class="attributes" width="100%" cellpadding="0" cellspacing="0" role="presentation">
                          <tr>
                            <td class="attributes_content">
                              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                                <tr>
                                  <td class="attributes_item">
                                    <span class="f-fallback">
                                    <strong>Paid Amount : </strong>${formatePrice(
                                      InvoiceTrxDet[0].paidAmount
                                    )} (QAR)
                                  </span>
                                  </td>
                                  <td class="attributes_item">
                                  <span class="f-fallback">
                                </span>
                                </td> <td class="attributes_item">
                                <span class="f-fallback">
                              </span>
                              </td>
                                </tr>
                              </table>
                              <table class="purchase" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="position: relative;
                    >
                      <h3 class="align-left"> <strong>Payment Date : </strong>  ${moment(
                        InvoiceTrxDet[0].transaction_date
                      ).format("MMM DD, YYYY")}</h3>
                    </td>
                  </tr>
                  <tr>
                  <tr>
                  <td style="position: relative;
                  >
                    <h3 class="align-left">  <strong>Receipt Number :  </strong>  ${
                      InvoiceTrxDet[0].rct_number
                    }</h3>
                  </td>
                </tr>
                <tr>
                <td style="position: relative;
                >
                  <h3 class="align-left">  <strong> Invoice Id :  </strong>  ${
                    InvoiceTrxDet[0].invoice_id
                  }</h3>
                </td>
              </tr>
                  <td style="position: relative;
                  top: -10px">
                    <h4 class="align-left"><strong>Paid By : </strong> ${
                      parent_det == null
                        ? InvoiceTrxDet[0]?.name.toUpperCase()
                        : parent_det[0]?.parent_name.toUpperCase()
                    }</h4>
                  </td>
                </tr>
                  <tr>
                    <td colspan="2">
                      <table class="purchase_content" width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <th class="purchase_heading" align="left">
                            <p class="f-fallback"> <strong>Item Name <strong></p>
                          </th>
                          <th class="purchase_heading" align="left">
                            <p class="f-fallback"> <strong>Quantity <strong></p>
                          </th>
                          <th class="purchase_heading" align="left">
                            <p class="f-fallback"> <strong>Item Price (QAR) <strong></p>
                          </th>
                          <th class="purchase_heading" align="left">
                            <p class="f-fallback"> <strong>Total Price (QAR) <strong></p>
                          </th>
                        </tr>
                        ${invoice_items.map(
                          (data) =>
                            `<tr>
                          <td style = "font-size: 11px" width="30%" class="purchase_item"><span class="f-fallback">${
                            data?.item_name
                          }</span>
                          </td>
                          <td style = "font-size: 11px" width="30%" class="purchase_item"><span class="f-fallback">${
                            data?.quantity
                          }</span>
                          </td>
                          <td style = "font-size: 11px" width="30%" class="purchase_item"><span class="f-fallback">${formatePrice(
                            data?.item_price
                          )}</span>
                          </td>
                          <td  style = "font-size: 11px" width="30%" class="purchase_item"><span class="f-fallback">${formatePrice(
                            data?.item_total_price
                          )}</span>
                          </td>
                        </tr>`
                        )}
                        <tr >
                          <td >
                            <p  style="text-align: left padding: 18px 15px 0 0" class="f-fallback purchase_total purchase_total--label" colspan="3">Total</p>
                          </td>
                          <td  class="purchase_footer" valign="middle" colspan="2">
                            <p class="f-fallback purchase_total">${formatePrice(
                              InvoiceTrxDet[0].paidAmount
                            )} (QAR)</p>
                          </td>
                        </tr>
                          <br/>
                          <br/>
                          <br/>
                      </table>
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
      </table>
      </td>
                </tr>
   ${FooterTemplate()}`;
};

module.exports = SalesInvoiceReportsTemplate;

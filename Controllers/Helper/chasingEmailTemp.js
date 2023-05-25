const HeaderTemplate = require("./comman/header");
const FooterTemplate = require("./comman/footer");
const moment = require("moment");
const formatePrice = require("../../commonFunction/formatedamount");

const ChasingEmailFormat = (Getinvoice, invoice_items) => {
  return `
  ${HeaderTemplate()}
  <tr>
  <td style="text-align: center; padding-top: 50px;">
      <h1 style="font-size: 23px; color: #22489e; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">INVOICE</h1>
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
                      <h1 style="font-size: 13px; color: #414042; font-family: Arial, Helvetica, sans-serif">Hi, ${Getinvoice[0]?.name.toUpperCase()}
                      </h1>
                      <p style="font-size: 13px; color: #414042; font-family: Arial, Helvetica, sans-serif";>Thanks for purchasing
                      . This is an invoice for your recent purchasing activites.</p>
                      <table class="attributes" width="100%" cellpadding="0" cellspacing="0" role="presentation">
                        <tr>
                          <td class="attributes_content">
                            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                              <tr>
                                <td class="attributes_item">
                                  <span class="f-fallback">
										<strong>Amount Due : </strong> ${formatePrice(Getinvoice[0]?.amount)} (QAR)
									</span>
                                </td>
                              </tr>
                              <tr>
                                <td class="attributes_item">
                                  <span class="f-fallback">
										<strong>Due Date : </strong> ${moment(
                      Getinvoice[0]?.invoice_due_date ||
                        Getinvoice[0]?.invoiceDate,
                      "DD/MM/YYYY"
                    ).format("MMM DD, YYYY")}
									</span>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      <table class="purchase" width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td>
                            <h5>Invoice Id : ${
                              Getinvoice[0]?.invoiceId ||
                              Getinvoice[0]?.tuition_invoice_id
                            }</h5>
                          </td>
                          <td>
                            <h4 class="align-right">Invoice Created Date : ${moment(
                              Getinvoice[0]?.invoice_created_date ||
                                Getinvoice[0]?.createdDate,
                              "DD/MM/YYYY"
                            ).format("MMM DD, YYYY")}</h4>
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
                                <p class="f-fallback">Item Quantity</p>
                              </th>
                              <th class="purchase_heading" align="left">
                              <p class="f-fallback">Item Price (QAR)</p>
                            </th>
                                <th width="40%" class="purchase_heading" align="left">
                                  <p class="f-fallback">Total Price (QAR)</p>
                                </th>
                              </tr>
                              ${
                                invoice_items &&
                                invoice_items?.map(
                                  (data) =>
                                    `<tr>
                                  <td width="30%" class="purchase_item"><span class="f-fallback">${
                                    data?.item_name
                                  }</span></td>
                                  <td width="30%" class="purchase_item"><span class="f-fallback">${
                                    data?.quantity
                                  }</span></td>
                                  <td width="30%" class="purchase_item"><span class="f-fallback">${formatePrice(
                                    data?.item_price
                                  )}</span></td>
                                  <td class="align-right" width="30%" class="purchase_item"><span class="f-fallback">${formatePrice(
                                    data?.item_total_price
                                  )}</span></td>
                                </tr>`
                                )
                              }
                              <tr>
                                <td width="35%" class="purchase_footer" valign="middle" colspan="3">
                                  <p class="f-fallback purchase_total purchase_total--label"><b>Total</b></p>
                                </td>
                                <td width="20%" class="purchase_footer" valign="middle" colspan="4">
                                  <p class="f-fallback purchase_total"><b>${formatePrice(
                                    Getinvoice[0]?.amount
                                  )} (QAR)</b></p>
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
						</span>
					</p>
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

module.exports = ChasingEmailFormat;

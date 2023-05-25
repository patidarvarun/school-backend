var fs = require("fs");
const FooterTemplate = require("../comman/footer");
const HeaderTemplate = require("../comman/header");
const MonthlyReportEmailFormat = () => {
  return `  
  ${HeaderTemplate()}
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="body">
        <span class="preheader">This is preheader text. Some clients will show this text as a preview.</span>
        <tr>
          <td>&nbsp;</td>
          <td class="container">
            <div class="content">
  
              <!-- START CENTERED WHITE CONTAINER -->
              <table role="presentation" class="main">
  
                <!-- START MAIN CONTENT AREA -->
                <tr>
                  <td class="wrapper">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <p>Hi, Qatar InterNational School</p>
                          <p>Please find attached this months sales report. This report contains an
                           itemized list of sales orders this month along with a brief explanation 
                           of each action. In addition to this list is a summary of the biggest improvements
                           we have seen thus far, both in terms of ranking and traffic statistics.</p>
                          <p>Good luck! Hope it works.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              <!-- END MAIN CONTENT AREA -->
              </table>
            </div>
          </td>
        </tr>
      </table>
          ${FooterTemplate()}`;
};

module.exports = MonthlyReportEmailFormat;

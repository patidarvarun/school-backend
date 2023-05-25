const HeaderTemplate = require("../comman/header");
const FooterTemplate = require("../comman/footer");

const ComposerTemplate = (getComposeData) => {
  return `${HeaderTemplate()}
  <tr>
<tr>
  <tr>
            <td style="text-align: left; padding: 0px 25px 45px;">
                <p style="font-size: 18px; color: #414042; font-family: Arial, Helvetica, sans-serif;">Dear ${getComposeData?.name},</p>
                <p>${getComposeData?.descontent}</p>
            </td>
          </tr>
${FooterTemplate()}`;
};

module.exports = ComposerTemplate;

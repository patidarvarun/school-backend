const FooterTemplate = () => {
  return `</table>
  <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
  <tr>
  <td valign="middle" class="bg_light footer" style="text-align: center; padding-top: 15px;">
    <p>United Nations St, West Bay, P.O. Box: 5697 Doha, Qatar</p>
  </td>
</tr>
  <tr>
      <td valign="middle" class="bg_light footer" style="text-align: center; padding-top: 15px;">
      <a href="https://www.facebook.com" style="padding: 0 3px;"><img src="${process.env.REACTURL}/facebook.png" /></a>
      <a href="https://www.twitter.com" style="padding: 0 3px;"><img src="${process.env.REACTURL}/twitter.png" /></a>
      <a href="https://instagram.com" style="padding: 0 3px;"><img src="${process.env.REACTURL}/instagram.png" /></a>
      </td>
    </tr><!-- end: tr -->
   
  </table>
  
  </div>
  
  </body>
  </html>`;
};

module.exports = FooterTemplate;

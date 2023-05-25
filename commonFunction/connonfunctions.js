//replace email content (template)
const ReplaceEmailTemplate = (translations, emailBodyText) => {
  var chunks = `${emailBodyText}`.split(/({{[a-z.]+}})/g);
  var chunksTranslated = chunks.map(function (chunk) {
    if (chunk.slice(0, 2) === "{{" && chunk.slice(-2) === "}}") {
      var id = chunk.slice(2, -2);
      return translations[id];
    }
    return chunk;
  });
  var translatedHtml = chunksTranslated.join("");
  return translatedHtml;
};
module.exports = { ReplaceEmailTemplate };

// const emailBody = translations.map((data, key) => {
//   console.log("data", data, "value", key);
//   return emailBodyText.replaceAll("{{" + data.key + "}}", key);
// });
// console.log(emailBody);
// return emailBody;

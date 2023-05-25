var generator = require("generate-password");
const bcrypt = require("bcryptjs");

module.exports = {
  generateHashPass: async () => {
    var password = generator.generate({
      length: 15,
      numbers: true,
      lowercase: true,
      uppercase: true,
    });
    const encPass = await bcrypt.hash(password, 12);
    return JSON.stringify({ pass: password, encPass: encPass });
  },

  hashPassword: async (password) => {
    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(password, salt);
    return hash;
  },
};

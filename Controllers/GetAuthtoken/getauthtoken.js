const jwt = require("jsonwebtoken");
const getauthtoken = async (req, res) => {
  try {
    const token = jwt.sign(
      { email: process.env.tokenEmail, password: process.env.tokenpass },
      process.env.JWT_SECRET_KEY
    );
    if (token) {
      res.status(200).json({ message: "ok  ", token: token });
    }
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};
module.exports = { getauthtoken };

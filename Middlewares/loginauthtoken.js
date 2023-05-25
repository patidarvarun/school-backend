const jwt = require("jsonwebtoken");
const acces_data_secret_key = process.env.JWT_SECRET_KEY;

const verifyLoginAuthToken = async (req, res, next) => {
  const loginauthtoken = req.headers["x-access-token"];
  if (!loginauthtoken) {
    return res
      .status(403)
      .send({ message: "A authentication token is required " });
  }
  try {
    const verifylogintoken = jwt.verify(loginauthtoken, acces_data_secret_key);
    next();
  } catch (err) {
    return res.status(401).send({ message: "Invalid login Token" });
  }
};
module.exports = { verifyLoginAuthToken };

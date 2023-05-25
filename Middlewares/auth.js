const jwt = require("jsonwebtoken");

const verifyAuthToken = (req, res, next) => {
  const authorizationtoken = req.headers["authorization"];
  //console.log(authorizationtoken);
  if (authorizationtoken === undefined) {
    return res
      .status(403)
      .send({ message: "A token is required for authorization" });
  }
  const splitauthorizationtoken = authorizationtoken.split(" ")[1];
  //console.log(splitauthorizationtoken);
  //return false;
  if (!splitauthorizationtoken) {
    return res
      .status(403)
      .send({ message: "A token is required for authorization" });
  }
  try {
    const decoded = jwt.verify(
      splitauthorizationtoken,
      process.env.JWT_SECRET_KEY
    );
  } catch (err) {
    return res.status(401).send({ message: "Invalid authorization Token" });
  }
  return next();
};

module.exports = { verifyAuthToken };

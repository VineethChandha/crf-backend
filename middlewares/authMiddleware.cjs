const jwt = require("jsonwebtoken");

const verifyUser = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  let token;

  if (authHeader) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    return res.status(404).json({
      message: "No token found",
    });
  } else {
    jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
      if (error) {
        return res.status(403).json({
          message: "Failed to authenticate token",
        });
      } else {
        req.userId = decoded.id;
        next();
      }
    });
  }
};

module.exports = verifyUser;

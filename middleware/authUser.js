const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

// const fetchUser = (req, res, next) => {
//     // get the user from the jwt token and id to req objectPosition:
//     const token = req.header('Authorization');
//     if (!token) {
//         return res.status(400).send("Access denied" )
//     }
//     try {
//         const data = jwt.verify(token, process.env.JWT_SECRET)
//         req.user = data.user
//         next()
//     } catch (error) {
//         res.status(400).send( "Access denied" )

//     }

// }

// module.exports = fetchUser

const fetchUser = (req, res, next) => {
  // Get the token from the authorization header
  const authHeader = req.header("Authorization");

  // Check if token exists
  if (!authHeader) {
    console.log("authHeader: ", authHeader);
    return res
      .status(401)
      .json({ success: false, error: "Access denied. No token provided." });
  }

  // Check if token has the correct format
  const tokenParts = authHeader.split(" ");
  if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
    console.log("401 authUser Middleware tokenParts:", tokenParts);
    return res
      .status(401)
      .json({ success: false, error: "Invalid token format." });
  }

  // Extract the token
  const token = tokenParts[1];

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.userId;
    next();
  } catch (error) {
    console.log("401 authUser Middleware: ", error);
    return res.status(401).json({ success: false, error: "Invalid token." });
  }
};

module.exports = fetchUser;

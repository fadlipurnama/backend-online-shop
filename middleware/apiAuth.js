const dotenv = require("dotenv");

dotenv.config();

// function checkOrigin(req, res, next) {
//   const allowedOrigins = [
//     process.env.FRONTEND_URL_1,
//     process.env.FRONTEND_URL_2,
//   ];

//   const origin = req.headers.origin;

//   if (allowedOrigins.includes(origin)) {
//     res.setHeader("Access-Control-Allow-Origin", origin);
//     res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
//     res.setHeader(
//       "Access-Control-Allow-Headers",
//       "Content-Type, Authorization"
//     );
//     next();
//   } else {
//     return res.status(403).json({ error: "Forbidden" });
//   }
// }

// function checkImageEndpoint(req, res, next) {
//   const requestedUrl = req.originalUrl;
//   // Jika endpoint adalah /images, izinkan akses
//   if (requestedUrl.startsWith("/api/images")) {
//     next();
//   } else {
//     // Jika bukan, lanjutkan ke middleware CORS
//     checkOrigin(req, res, next);
//   }
// }

// module.exports = checkImageEndpoint;

function checkOrigin(req, res, next) {
  const origin = req.headers.origin;

  // Mengatur header Access-Control-Allow-Origin agar memungkinkan akses dari semua domain
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Mengatur header lainnya sesuai kebutuhan
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Lanjutkan ke middleware atau handler berikutnya
  next();
}

module.exports = checkOrigin;

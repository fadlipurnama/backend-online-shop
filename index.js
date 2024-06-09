const connectToMongo = require("./config");
const bodyParser = require("body-parser");
const express = require("express");
const cors = require("cors");
const path = require("path");

const auth = require("./routes/auth");
const cart = require("./routes/cart");
const wishlist = require("./routes/wishlist");
const category = require("./routes/category");
const banner = require("./routes/banner");
const product = require("./routes/product");
const order = require("./routes/orderStatus");
const review = require("./routes/review");
// const paymentRoute = require('./routes/paymentRoute')
const forgotPassword = require("./routes/forgotPassword");
const AdminRoute = require("./routes/Admin/AdminAuth");
const dotenv = require("dotenv");
const checkOrigin = require("./middleware/apiAuth");
dotenv.config();

connectToMongo();

const port = 5000;

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.urlencoded({ extended: true }));

app.use(express.json());
app.use(cors());

app.use(express.static(path.join(__dirname, "build")));

app.use(checkOrigin);

app.use("/api/auth", auth);

app.use("/api/product", product);

app.use("/api/category", category);

app.use("/api/banner", banner);

app.use("/api/cart", cart);

app.use("/api/wishlist", wishlist);

app.use("/api/oder", order);

app.use("/api/review", review);

app.use("/api/admin", AdminRoute);

// app.use('/api', paymentRoute)

app.use("/api/assets/", express.static(path.join(__dirname, "assets/")));

app.use("/api/password", forgotPassword);

app.listen(port, () => {
  console.log(`Server berjalan di port:${port}`);
});

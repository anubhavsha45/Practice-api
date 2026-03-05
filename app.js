const express = require("express");
const app = express();
const appError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");
const productRoutes = require("./routes/productRoutes");
const userRoutes = require("./routes/userRoutes");
//middleware
app.use(express.json());
app.set("query parser", "extended");
//mounted route
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/users", userRoutes);
app.all("*", (req, res, next) => {
  next(
    new appError(`Can not find this ${req.originalUrl} on this server`, 401),
  );
});
app.use(globalErrorHandler);
module.exports = app;

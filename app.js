const express = require("express");
const app = express();
const productRoutes = require("./routes/productRoutes");
//middleware
app.use(express.json());
app.set("query parser", "extended");
//mounted route
app.use("/api/v1/products", productRoutes);
module.exports = app;

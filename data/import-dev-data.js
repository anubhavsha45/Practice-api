const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
const fs = require("fs");
const mongoose = require("mongoose");
const Product = require("./../models/productModel");
const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD,
);
mongoose.connect(DB).then(() => console.log("DB connection is succesfull"));

//READ THE FILE
const data = JSON.parse(fs.readFileSync(`${__dirname}/data.json`, "utf-8"));

//import the data
const importData = async () => {
  try {
    await Product.create(data);
    console.log("Imported succesfully");
    process.exit();
  } catch (err) {
    console.log(err);
  }
};
//deleting the data
const deleteData = async () => {
  try {
    await Product.deleteMany();
    console.log("Data deleted succesfully");
    process.exit();
  } catch (err) {
    console.log(err);
  }
};
if (process.argv[2] === "--import") {
  importData();
} else if (process.argv[2] === "--delete") {
  deleteData();
}

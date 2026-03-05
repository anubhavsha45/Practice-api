const express = require("express");
const router = express.Router();
const userController = require("./../controllers/userController");
const authController = require("./../controllers/authController");
router.route("/").get(userController.getUsers);

router.post("/signup", authController.signup);
router.post("/login", authController.login);
module.exports = router;

const express = require("express");
const userController = require("../controllers/user");
const { verify, verifyAdmin } = require("../auth");

const router = express.Router();

router.post("/register", userController.registerUser);
router.post("/login", userController.loginUser);
router.get("/details", verify, userController.getProfile);
router.patch("/details", verify, userController.updateProfile);
router.patch("/update-password", verify, userController.updatePassword);
router.get("/", verify, verifyAdmin, userController.getUsers);
router.patch("/:id/role", verify, verifyAdmin, userController.updateUserRole);

module.exports = router;

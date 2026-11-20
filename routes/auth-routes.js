const express = require("express");

const {
  login,
  logout,
  showLogin,
} = require("../controllers/auth-controller");

const router = express.Router();

router.get("/login", showLogin);
router.post("/login", login);
router.get("/logout", logout);

module.exports = router;

const { users } = require("../config/users");

function showLogin(req, res) {
  if (req.session && req.session.user) {
    return res.redirect("/cars");
  }

  return res.status(200).render("login", {
    title: "Customer Login",
    error: null,
    username: "",
  });
}

function login(req, res) {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const username = String(body.username || "").trim();
  const password = String(body.password || "");
  const account = users.find((candidate) => candidate.username === username);

  if (!account || account.password !== password) {
    return res.status(401).render("login", {
      title: "Customer Login",
      error: "The username or password is incorrect.",
      username,
    });
  }

  req.session.user = {
    username: account.username,
    customerName: account.customerName,
    customerPhone: account.customerPhone,
  };

  return res.redirect("/cars");
}

function logout(req, res) {
  req.session = null;
  return res.redirect("/login");
}

module.exports = { showLogin, login, logout };

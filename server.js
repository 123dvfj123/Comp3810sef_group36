const path = require("node:path");
const express = require("express");
const session = require("cookie-session");

const { connectDatabase } = require("./config/db");
const { isOverdue } = require("./lib/rental-rules");
const requireAuth = require("./middleware/require-auth");
const apiRoutes = require("./routes/api-routes");
const authRoutes = require("./routes/auth-routes");
const bookingRoutes = require("./routes/booking-routes");
const carRoutes = require("./routes/car-routes");

const app = express();
// Local course-demo port. Change this number if port 8099 is already in use.
const PORT = 8099;
// cookie-session signing key used by this course project.
const SESSION_SECRET = "fleetdesk-group36-course-session-secret";
const moneyFormatter = new Intl.NumberFormat("en-HK", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    name: "loginSession",
    keys: [SESSION_SECRET],
  }),
);

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.currentPath = req.path;
  res.locals.flashNotice = "";
  res.locals.flashError = "";
  res.locals.now = new Date();
  res.locals.money = (amount) => moneyFormatter.format(Number(amount || 0));
  res.locals.dateTime = (value) =>
    new Intl.DateTimeFormat("en-HK", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Hong_Kong",
    }).format(new Date(value));
  res.locals.isOverdue = isOverdue;
  next();
});

app.get("/", (req, res) => {
  res.redirect(req.session.user ? "/cars" : "/login");
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api", apiRoutes);
app.use("/api", (req, res) => {
  res.status(404).json({
    error: {
      code: "BOOKING_NOT_FOUND",
      message: "The requested API route does not exist.",
    },
  });
});
app.use(authRoutes);
app.use(requireAuth);
app.use(carRoutes);
app.use(bookingRoutes);

app.use((req, res) => {
  res.status(404).render("error", {
    title: "Page Not Found",
    status: 404,
    message: `${req.path} is not a valid FleetDesk route.`,
  });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  const bodyParserError = error instanceof SyntaxError && error.status === 400 && "body" in error;
  const status = bodyParserError ? 400 : error.status || 500;
  const code = bodyParserError
    ? "INVALID_INPUT"
    : error.code || (status === 500 ? "INTERNAL_ERROR" : "INVALID_INPUT");
  const message =
    bodyParserError
      ? "Request body must contain valid JSON."
      : error.message || "Unexpected server error.";

  if (status >= 500) {
    console.error(error);
  }

  if (req.originalUrl.startsWith("/api")) {
    return res.status(status).json({
      error: {
        code,
        message,
      },
    });
  }

  return res.status(status).render("error", {
    title: "Request Failed",
    status,
    message,
  });
});

async function startServer() {
  await connectDatabase();

  const server = app.listen(PORT, () => {
    console.log(`FleetDesk is listening at http://localhost:${PORT}`);
  });

  server.on("error", (error) => {
    console.error("FleetDesk failed to listen:", error.message);
    process.exitCode = 1;
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error("FleetDesk failed to start:", error.message);
    process.exitCode = 1;
  });
}

module.exports = { app, startServer, PORT, SESSION_SECRET };

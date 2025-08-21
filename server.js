const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const dotenv = require("dotenv");
const authRoutes = require("./src/routes/auth");
const userRoutes = require("./src/routes/users");
const adminRoutes = require("./src/routes/admin");
dotenv.config(); // ← load .env first

//INIT APP & PORT

const app = express();
const PORT = process.env.PORT || 5000;

//CONNECT TO MONGODB

mongoose
  .connect(process.env.mongoURI, {
    // uses key from .env
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected Successfully"))
  .catch((err) => {
    console.error("MongoDB Connection Error:", err.message);
    process.exit(1);
  });

//GLOBAL MIDDLEWARE

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//TEST ROUTE

app.get("/", (_req, res) =>
  res.json({ success: true, message: "Welcome to the Express API" })
);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});
// Use medicine routes
const medicineRoutes = require("./src/routes/medicineRoutes");
app.use("/api/medicine", medicineRoutes);

const receiptsRoutes = require("./src/routes/receiptsRoutes");
app.use("/api/receipt", receiptsRoutes); // NEW: added receipts routes

//ROUTE MODULES  ⬅️  (all requires in one place)

const patientRoutes = require("./src/routes/patientRoutes"); // NEW: imported & used
// const userRoutes = require("./src/routes/userRoutes");
const outdoorVisitRoutes = require("./src/routes/outdoorVisitRoutes");

//MOUNT ROUTES   ⬅️  (before 404 handler)

app.use("/api/patients", patientRoutes); // NEW: makes POST /api/patients/patient-create work
app.use("/api/users", userRoutes);
app.use("/api/outdoor-visits", outdoorVisitRoutes);

// 404 & ERROR HANDLERS (keep at the end)

app.use((_req, res) =>
  res.status(404).json({ success: false, error: "Route not found" })
);

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res
    .status(500)
    .json({ success: false, error: err.message || "Server Error" });
});

//START SERVER

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

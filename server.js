const dotenv = require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const userRoute = require("./routes/userRoute");
const summaryRoute = require("./routes/summaryRoute");
// const contactRoute = require("./routes/contactRoute");
const errorHandler = require("./middleware/errorMiddleware");
const cookieParser = require("cookie-parser");
const path = require("path");

const app = express();
// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});    
app.use(
  cors({
    origin: ["http://localhost:5000", "https://inventory-app.vercel.app"],
    credentials: true,
    optionSuccessStatus:200 
  })
);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes Middleware
app.use("/api/users", userRoute);
app.use("/api/summarypoint", summaryRoute );
// app.use("/api/contactus", contactRoute);

// Routes
app.get("/", (req, res) => {
  res.send("Home Page");
});

// // Error handling middleware
// app.use((err, req, res, next) => {
//     console.error(err.stack);
//     res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
//   });

// Use the error handler middleware after all routes
app.use(errorHandler);
// Connect to DB and start server
const PORT = process.env.PORT || 5000;     
    
const localDB = 'mongodb://127.0.0.1:27017/management2';         

main().catch(err => console.log(err));
// console.log(process.env.MONGO_URI)

async function main() {
  await mongoose.connect(process.env.URI);   
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

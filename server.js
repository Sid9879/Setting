const express = require("express");
const app = express();
const mongoose = require("mongoose");
const config = require("./config");
const cors = require("cors");

// Routes
// const auth = require('./routes/authRoute');
const setting = require('./routes/setting');


app.use(express.json());
app.use(cors());

// MongoDB connection
mongoose.connect(config.database.dbConnectionString)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));


// API routes
// app.use('/api/auth', auth);
app.use('/api/setting', setting);


app.use((req, res) => res.status(404).json({ message: "Route not found" }));

app.listen(config.http.port, () => {
  console.log("Server started successfully at port " + config.http.port);
});
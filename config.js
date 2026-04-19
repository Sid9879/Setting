require("dotenv").config();
const config = {
  database: {
    dbConnectionString:
      process.env.MONGODB_CONNECTION_STRING
  },
  http: {
    port: 80,
  },
  pagination: {
    limit: 500,
    maxLimit: 500,
  },
  jwtSecret: {
    jwtSecret: process.env.JWT_SECRET,
    expiresIn: "10d",
  }
};

module.exports = config;
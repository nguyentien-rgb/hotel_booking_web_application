// backend/db.js
const path = require("path");

// Xác định đường dẫn tuyệt đối tới file .env trong thư mục backend
const envPath = path.resolve(__dirname, ".env");
console.log("Trying to load .env from:", envPath);

// Load .env
const dotenvResult = require("dotenv").config({ path: envPath });
if (dotenvResult.error) {
  console.error("dotenv error:", dotecnvResult.error);
} else {
  console.log("dotenv parsed:", dotenvResult.parsed);
}

const mysql = require("mysql2/promise");

// In ra env đã load để check
console.log("Loaded DB env:", {
  DB_HOST: process.env.DB_HOST,
  DB_USER: process.env.DB_USER,
  DB_NAME: process.env.DB_NAME,
  DB_PORT: process.env.DB_PORT,
});

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
});

module.exports = pool;

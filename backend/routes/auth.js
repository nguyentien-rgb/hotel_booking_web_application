// backend/routes/auth.js
const express = require("express");
const pool = require("../db");

const router = express.Router();

/**
 * POST /api/auth/register
 * Body: { name, email, password }
 * Lưu user vào bảng `users` (password lưu plain text trong cột password_hash để demo)
 */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    // 1. Check thiếu dữ liệu
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please fill all fields." });
    }

    // 2. Check email đã tồn tại chưa
    const [existing] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      return res
        .status(409)
        .json({ message: "Email already registered. Please login." });
    }

    // 3. DEMO: lưu thẳng password vào cột password_hash
    const [result] = await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      [name, email, password]
    );

    const user = {
      id: result.insertId,
      name,
      email,
    };

    return res.status(201).json({ user });
  } catch (err) {
    console.error("Error /api/auth/register:", err);
    return res.status(500).json({
      message: err.message || "Server error. Please try again later.",
    });
  }
});

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Kiểm tra thông tin đăng nhập với bảng `users`
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    // 1. Check thiếu dữ liệu
    if (!email || !password) {
      return res.status(400).json({ message: "Please fill all fields." });
    }

    // 2. Tìm user theo email
    const [rows] = await pool.query(
      "SELECT id, name, email, password_hash FROM users WHERE email = ?",
      [email]
    );

    if (!rows.length) {
      // Không tìm thấy user
      return res
        .status(401)
        .json({ message: "Invalid email or password." });
    }

    const userRow = rows[0];

    // 3. So sánh password demo (vì mình lưu plain text trong password_hash)
    if (userRow.password_hash !== password) {
      return res
        .status(401)
        .json({ message: "Invalid email or password." });
    }

    // 4. Login thành công -> trả thông tin user (không trả password)
    const user = {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
    };

    return res.json({ user });
  } catch (err) {
    console.error("Error /api/auth/login:", err);
    return res.status(500).json({
      message: err.message || "Server error. Please try again later.",
    });
  }
});

module.exports = router;

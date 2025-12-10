require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();
const PORT = process.env.PORT || 4000;
const authRoutes = require("./routes/auth.js");

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);



// ───────────────── HEALTH CHECK ─────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// ───────────────── HOTELS ─────────────────

// lấy danh sách hotel
app.get("/api/hotels", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, location, price, rating, description, image1, image2
       FROM hotels
       ORDER BY rating DESC`
    );

    const hotels = rows.map((row) => ({
      id: row.id,
      name: row.name,
      location: row.location,
      price: row.price,
      rating: Number(row.rating),
      description: row.description,
      images: [row.image1, row.image2].filter(Boolean),
    }));

    res.json(hotels);
  } catch (err) {
    console.error("Error /api/hotels:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// lấy detail 1 hotel
app.get("/api/hotels/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid hotel id" });

  try {
    const [rows] = await pool.query(
      `SELECT id, name, location, price, rating, description, image1, image2
       FROM hotels
       WHERE id = ?`,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Hotel not found" });
    }

    const row = rows[0];
    const hotel = {
      id: row.id,
      name: row.name,
      location: row.location,
      price: row.price,
      rating: Number(row.rating),
      description: row.description,
      images: [row.image1, row.image2].filter(Boolean),
    };

    res.json(hotel);
  } catch (err) {
    console.error("Error /api/hotels/:id:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ───────────────── BOOKINGS ─────────────────

// POST /api/bookings  → tạo booking mới
app.post("/api/bookings", async (req, res) => {
  try {
    const {
      userId,
      hotelId,
      checkIn,
      checkOut,
      guests,
      nights,
      total,
      paymentMethod,
    } = req.body;

    console.log("📥 POST /api/bookings body =", req.body);

    if (!hotelId || !checkIn || !checkOut || !guests || !nights || !total) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // kiểm tra hotel có tồn tại
    const [hotelRows] = await pool.query(
      "SELECT id FROM hotels WHERE id = ?",
      [hotelId]
    );
    if (!hotelRows.length) {
      return res.status(400).json({ error: "Hotel not found" });
    }

    // chèn booking
    const [result] = await pool.query(
      `INSERT INTO bookings
       (user_id, hotel_id, check_in, check_out, guests, nights, total, payment_method)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId || null,
        hotelId,
        checkIn,
        checkOut,
        guests,
        nights,
        total,
        paymentMethod || null,
      ]
    );

    res.status(201).json({
      success: true,
      bookingId: result.insertId,
    });
  } catch (err) {
    console.error("🔥 Error /api/bookings (POST):", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/bookings  → lấy danh sách booking (filter theo userId nếu có)
app.get("/api/bookings", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const [rows] = await pool.query(
      `SELECT b.*, h.name AS hotel_name, h.location AS hotel_location
       FROM bookings b
       JOIN hotels h ON b.hotel_id = h.id
       WHERE b.user_id = ?
       ORDER BY b.created_at DESC`,
      [userId]
    );

    res.json(rows);
  } catch (err) {
    console.error("Error fetching bookings:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ───────────────── START SERVER ─────────────────
app.listen(PORT, () => {
  console.log(`✅ Backend listening at http://localhost:${PORT}`);
});

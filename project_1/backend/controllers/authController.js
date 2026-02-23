const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const register = async (req, res) => {
  try {
    const { name, mobile, email, password } = req.body;

    if (!name || !mobile || !email || !password) {
      return res.status(400).json({ error: "All fields required" });
    }

    const checkUser = await pool.query(
      "SELECT udm_id FROM public.user_details_m WHERE udm_email = $1",
      [email]
    );

    if (checkUser.rows.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 8);

    const result = await pool.query(
      `INSERT INTO public.user_details_m
       (udm_name, udm_mobile, udm_email, udm_password, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING udm_id, udm_name, udm_email`,
      [name, mobile, email, hashedPassword, "SYS001"]
    );

    res.status(201).json({
      message: "User registered successfully",
      user: result.rows[0],
    });

  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const result = await pool.query(
      `SELECT * FROM public.user_details_m WHERE udm_email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.udm_password);

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        id: user.udm_id,
        email: user.udm_email,
        name: user.udm_name,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.udm_id,
        name: user.udm_name,
        email: user.udm_email,
      },
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const getProfile = (req, res) => {
  res.json({
    message: "Profile accessed",
    user: req.user,
  });
};

module.exports = { register, login, getProfile };

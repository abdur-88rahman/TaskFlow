const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const supabase = require('../config/db');
const { signupValidation, loginValidation } = require('../middleware/validators');

// GET /auth/signup
router.get('/signup', (req, res) => {
  if (req.user) return res.redirect('/dashboard');
  res.render('auth/signup', { title: 'Sign Up', errors: [] });
});

// POST /auth/signup
router.post('/signup', signupValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('auth/signup', { title: 'Sign Up', errors: errors.array() });
  }

  const { name, email, password } = req.body;

  try {
    // Check if email already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return res.render('auth/signup', {
        title: 'Sign Up',
        errors: [{ msg: 'Email already registered' }],
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert user
    const { data: user, error } = await supabase
      .from('users')
      .insert({ name, email, password: hashedPassword })
      .select('id, name, email')
      .single();

    if (error) throw error;

    // Generate JWT
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
    });

    req.flash('success', 'Account created successfully!');
    res.redirect('/dashboard');
  } catch (err) {
    console.error('Signup error:', err);
    res.render('auth/signup', {
      title: 'Sign Up',
      errors: [{ msg: 'Something went wrong. Please try again.' }],
    });
  }
});

// GET /auth/login
router.get('/login', (req, res) => {
  if (req.user) return res.redirect('/dashboard');
  res.render('auth/login', { title: 'Login', errors: [] });
});

// POST /auth/login
router.post('/login', loginValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('auth/login', { title: 'Login', errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.render('auth/login', {
        title: 'Login',
        errors: [{ msg: 'Invalid email or password' }],
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render('auth/login', {
        title: 'Login',
        errors: [{ msg: 'Invalid email or password' }],
      });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
    });

    req.flash('success', 'Welcome back!');
    res.redirect('/dashboard');
  } catch (err) {
    console.error('Login error:', err);
    res.render('auth/login', {
      title: 'Login',
      errors: [{ msg: 'Something went wrong. Please try again.' }],
    });
  }
});

// GET /auth/logout
router.get('/logout', (req, res) => {
  res.clearCookie('token');
  req.flash('success', 'Logged out successfully');
  res.redirect('/auth/login');
});

module.exports = router;

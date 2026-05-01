require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'frontend')));

// REST API Routes
app.use('/api/auth', require('./backend/routes/auth'));
app.use('/api/dashboard', require('./backend/routes/dashboard'));
app.use('/api/projects', require('./backend/routes/projects'));
app.use('/api', require('./backend/routes/tasks'));

// Serve frontend for all non-API routes (SPA fallback)
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

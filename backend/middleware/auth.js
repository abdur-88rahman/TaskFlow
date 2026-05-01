const jwt = require('jsonwebtoken');
const supabase = require('../config/db');

// Verify JWT token from cookie - returns JSON for REST API
const authenticate = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, created_at')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      res.clearCookie('token');
      return res.status(401).json({ error: 'Session expired' });
    }

    req.user = user;
    next();
  } catch (err) {
    res.clearCookie('token');
    return res.status(401).json({ error: 'Invalid session' });
  }
};

// Check if user is admin of a project
const requireProjectAdmin = async (req, res, next) => {
  const projectId = req.params.id || req.params.projectId;

  const { data: membership, error } = await supabase
    .from('project_members')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', req.user.id)
    .single();

  if (error || !membership || membership.role !== 'Admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  req.userRole = 'Admin';
  next();
};

// Check if user is a member (any role) of a project
const requireProjectMember = async (req, res, next) => {
  const projectId = req.params.id || req.params.projectId;

  const { data: membership, error } = await supabase
    .from('project_members')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', req.user.id)
    .single();

  if (error || !membership) {
    return res.status(403).json({ error: 'You are not a member of this project' });
  }

  req.userRole = membership.role;
  next();
};

module.exports = { authenticate, requireProjectAdmin, requireProjectMember };

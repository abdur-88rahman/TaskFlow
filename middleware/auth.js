const jwt = require('jsonwebtoken');
const supabase = require('../config/db');

// Verify JWT token from cookie
const authenticate = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    req.flash('error', 'Please login to continue');
    return res.redirect('/auth/login');
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
      req.flash('error', 'Session expired, please login again');
      return res.redirect('/auth/login');
    }

    req.user = user;
    res.locals.currentUser = user;
    next();
  } catch (err) {
    res.clearCookie('token');
    req.flash('error', 'Invalid session, please login again');
    return res.redirect('/auth/login');
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
    req.flash('error', 'Only project admins can perform this action');
    return res.redirect(`/projects/${projectId}`);
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
    req.flash('error', 'You are not a member of this project');
    return res.redirect('/projects');
  }

  req.userRole = membership.role;
  next();
};

// Set user in locals if logged in (for navbar)
const setUser = async (req, res, next) => {
  const token = req.cookies.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const { data: user } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('id', decoded.userId)
        .single();
      req.user = user;
      res.locals.currentUser = user;
    } catch {
      res.locals.currentUser = null;
    }
  } else {
    res.locals.currentUser = null;
  }
  next();
};

module.exports = { authenticate, requireProjectAdmin, requireProjectMember, setUser };

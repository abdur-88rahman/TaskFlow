const express = require('express');
const router = express.Router();
const { validationResult } = require('express-validator');
const supabase = require('../config/db');
const { authenticate, requireProjectAdmin, requireProjectMember } = require('../middleware/auth');
const { projectValidation } = require('../middleware/validators');

// All routes require authentication
router.use(authenticate);

// GET /projects - List user's projects
router.get('/', async (req, res) => {
  try {
    // Get all projects where user is a member
    const { data: memberships, error } = await supabase
      .from('project_members')
      .select(`
        role,
        projects (
          id, name, description, owner_id, created_at
        )
      `)
      .eq('user_id', req.user.id)
      .order('joined_at', { ascending: false });

    if (error) throw error;

    const projects = memberships.map(m => ({
      ...m.projects,
      userRole: m.role
    }));

    res.render('projects/index', { title: 'My Projects', projects });
  } catch (err) {
    console.error('List projects error:', err);
    req.flash('error', 'Failed to load projects');
    res.redirect('/dashboard');
  }
});

// GET /projects/new - New project form
router.get('/new', (req, res) => {
  res.render('projects/new', { title: 'New Project', errors: [] });
});

// POST /projects - Create project
router.post('/', projectValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('projects/new', { title: 'New Project', errors: errors.array() });
  }

  const { name, description } = req.body;

  try {
    // Create project
    const { data: project, error } = await supabase
      .from('projects')
      .insert({ name, description: description || '', owner_id: req.user.id })
      .select()
      .single();

    if (error) throw error;

    // Add creator as Admin member
    await supabase
      .from('project_members')
      .insert({ project_id: project.id, user_id: req.user.id, role: 'Admin' });

    req.flash('success', 'Project created successfully!');
    res.redirect(`/projects/${project.id}`);
  } catch (err) {
    console.error('Create project error:', err);
    res.render('projects/new', {
      title: 'New Project',
      errors: [{ msg: 'Failed to create project' }],
    });
  }
});

// GET /projects/:id - Project detail
router.get('/:id', requireProjectMember, async (req, res) => {
  try {
    const { data: project, error: pErr } = await supabase
      .from('projects')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (pErr || !project) {
      req.flash('error', 'Project not found');
      return res.redirect('/projects');
    }

    // Get members with user info
    const { data: members } = await supabase
      .from('project_members')
      .select(`
        id, role, joined_at,
        users ( id, name, email )
      `)
      .eq('project_id', project.id)
      .order('role', { ascending: true });

    // Get tasks with assignee info
    const { data: tasks } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:assigned_to ( id, name, email )
      `)
      .eq('project_id', project.id)
      .order('created_at', { ascending: false });

    // Get owner info
    const { data: owner } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', project.owner_id)
      .single();

    // Get all users NOT already in the project (for add-member dropdown)
    const memberUserIds = (members || []).map(m => m.users.id);
    const { data: allUsers } = await supabase
      .from('users')
      .select('id, name, email')
      .order('name', { ascending: true });

    const availableUsers = (allUsers || []).filter(u => !memberUserIds.includes(u.id));

    res.render('projects/show', {
      title: project.name,
      project,
      members: members || [],
      tasks: tasks || [],
      owner,
      userRole: req.userRole,
      availableUsers,
    });
  } catch (err) {
    console.error('Show project error:', err);
    req.flash('error', 'Failed to load project');
    res.redirect('/projects');
  }
});

// POST /projects/:id/members - Add member (Admin only)
router.post('/:id/members', requireProjectAdmin, async (req, res) => {
  const { user_id, role } = req.body;

  try {
    if (!user_id) {
      req.flash('error', 'Please select a user');
      return res.redirect(`/projects/${req.params.id}`);
    }

    // Get user info
    const { data: user, error: uErr } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', user_id)
      .single();

    if (uErr || !user) {
      req.flash('error', 'User not found');
      return res.redirect(`/projects/${req.params.id}`);
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from('project_members')
      .select('id')
      .eq('project_id', req.params.id)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      req.flash('error', 'User is already a member of this project');
      return res.redirect(`/projects/${req.params.id}`);
    }

    // Add member
    const memberRole = role === 'Admin' ? 'Admin' : 'Member';
    await supabase
      .from('project_members')
      .insert({ project_id: req.params.id, user_id: user.id, role: memberRole });

    req.flash('success', `${user.name} added as ${memberRole}`);
    res.redirect(`/projects/${req.params.id}`);
  } catch (err) {
    console.error('Add member error:', err);
    req.flash('error', 'Failed to add member');
    res.redirect(`/projects/${req.params.id}`);
  }
});

// POST /projects/:id/members/:memberId/remove - Remove member (Admin only)
router.post('/:id/members/:memberId/remove', requireProjectAdmin, async (req, res) => {
  try {
    // Prevent removing yourself if you're the owner
    const { data: membership } = await supabase
      .from('project_members')
      .select('user_id')
      .eq('id', req.params.memberId)
      .single();

    const { data: project } = await supabase
      .from('projects')
      .select('owner_id')
      .eq('id', req.params.id)
      .single();

    if (membership && project && membership.user_id === project.owner_id) {
      req.flash('error', 'Cannot remove the project owner');
      return res.redirect(`/projects/${req.params.id}`);
    }

    await supabase
      .from('project_members')
      .delete()
      .eq('id', req.params.memberId);

    req.flash('success', 'Member removed');
    res.redirect(`/projects/${req.params.id}`);
  } catch (err) {
    console.error('Remove member error:', err);
    req.flash('error', 'Failed to remove member');
    res.redirect(`/projects/${req.params.id}`);
  }
});

// POST /projects/:id/delete - Delete project (Admin only)
router.post('/:id/delete', requireProjectAdmin, async (req, res) => {
  try {
    await supabase.from('projects').delete().eq('id', req.params.id);
    req.flash('success', 'Project deleted');
    res.redirect('/projects');
  } catch (err) {
    console.error('Delete project error:', err);
    req.flash('error', 'Failed to delete project');
    res.redirect(`/projects/${req.params.id}`);
  }
});

module.exports = router;

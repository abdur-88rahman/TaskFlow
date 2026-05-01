const express = require('express');
const router = express.Router();
const { validationResult } = require('express-validator');
const supabase = require('../config/db');
const { authenticate, requireProjectAdmin, requireProjectMember } = require('../middleware/auth');
const { projectValidation } = require('../middleware/validators');

router.use(authenticate);

// GET /api/projects — list user's projects
router.get('/', async (req, res) => {
  try {
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
      userRole: m.role,
    }));

    res.json({ projects });
  } catch (err) {
    console.error('List projects error:', err);
    res.status(500).json({ error: 'Failed to load projects' });
  }
});

// POST /api/projects — create project
router.post('/', projectValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, description } = req.body;

  try {
    const { data: project, error } = await supabase
      .from('projects')
      .insert({ name, description: description || '', owner_id: req.user.id })
      .select()
      .single();

    if (error) throw error;

    await supabase
      .from('project_members')
      .insert({ project_id: project.id, user_id: req.user.id, role: 'Admin' });

    res.status(201).json({ message: 'Project created successfully', project });
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// GET /api/projects/:id — project detail
router.get('/:id', requireProjectMember, async (req, res) => {
  try {
    const { data: project, error: pErr } = await supabase
      .from('projects')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (pErr || !project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const { data: members } = await supabase
      .from('project_members')
      .select(`
        id, role, joined_at,
        users ( id, name, email )
      `)
      .eq('project_id', project.id)
      .order('role', { ascending: true });

    const { data: tasks } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:assigned_to ( id, name, email )
      `)
      .eq('project_id', project.id)
      .order('created_at', { ascending: false });

    const { data: owner } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', project.owner_id)
      .single();

    // Get available users (not yet members)
    const memberUserIds = (members || []).map(m => m.users.id);
    const { data: allUsers } = await supabase
      .from('users')
      .select('id, name, email')
      .order('name', { ascending: true });

    const availableUsers = (allUsers || []).filter(u => !memberUserIds.includes(u.id));

    res.json({
      project,
      members: members || [],
      tasks: tasks || [],
      owner,
      userRole: req.userRole,
      availableUsers,
    });
  } catch (err) {
    console.error('Show project error:', err);
    res.status(500).json({ error: 'Failed to load project' });
  }
});

// POST /api/projects/:id/members — add member (Admin only)
router.post('/:id/members', requireProjectAdmin, async (req, res) => {
  const { user_id, role } = req.body;

  try {
    if (!user_id) {
      return res.status(400).json({ error: 'Please select a user' });
    }

    const { data: user, error: uErr } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', user_id)
      .single();

    if (uErr || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { data: existing } = await supabase
      .from('project_members')
      .select('id')
      .eq('project_id', req.params.id)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      return res.status(409).json({ error: 'User is already a member' });
    }

    const memberRole = role === 'Admin' ? 'Admin' : 'Member';
    await supabase
      .from('project_members')
      .insert({ project_id: req.params.id, user_id: user.id, role: memberRole });

    res.status(201).json({ message: `${user.name} added as ${memberRole}` });
  } catch (err) {
    console.error('Add member error:', err);
    res.status(500).json({ error: 'Failed to add member' });
  }
});

// DELETE /api/projects/:id/members/:memberId — remove member (Admin only)
router.delete('/:id/members/:memberId', requireProjectAdmin, async (req, res) => {
  try {
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
      return res.status(403).json({ error: 'Cannot remove the project owner' });
    }

    await supabase
      .from('project_members')
      .delete()
      .eq('id', req.params.memberId);

    res.json({ message: 'Member removed' });
  } catch (err) {
    console.error('Remove member error:', err);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

// DELETE /api/projects/:id — delete project (Admin only)
router.delete('/:id', requireProjectAdmin, async (req, res) => {
  try {
    await supabase.from('projects').delete().eq('id', req.params.id);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    console.error('Delete project error:', err);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

module.exports = router;

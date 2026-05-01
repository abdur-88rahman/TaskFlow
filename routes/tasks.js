const express = require('express');
const router = express.Router();
const { validationResult } = require('express-validator');
const supabase = require('../config/db');
const { authenticate, requireProjectAdmin, requireProjectMember } = require('../middleware/auth');
const { taskValidation } = require('../middleware/validators');

router.use(authenticate);

// GET /projects/:projectId/tasks/new - New task form
router.get('/projects/:projectId/tasks/new', requireProjectAdmin, async (req, res) => {
  try {
    // Get project members for assignee dropdown
    const { data: members } = await supabase
      .from('project_members')
      .select('users ( id, name, email )')
      .eq('project_id', req.params.projectId);

    const { data: project } = await supabase
      .from('projects')
      .select('id, name')
      .eq('id', req.params.projectId)
      .single();

    res.render('tasks/new', {
      title: 'New Task',
      project,
      members: members || [],
      errors: [],
    });
  } catch (err) {
    console.error('New task form error:', err);
    req.flash('error', 'Failed to load form');
    res.redirect(`/projects/${req.params.projectId}`);
  }
});

// POST /projects/:projectId/tasks - Create task
router.post('/projects/:projectId/tasks', requireProjectAdmin, taskValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const { data: members } = await supabase
      .from('project_members')
      .select('users ( id, name, email )')
      .eq('project_id', req.params.projectId);

    const { data: project } = await supabase
      .from('projects')
      .select('id, name')
      .eq('id', req.params.projectId)
      .single();

    return res.render('tasks/new', {
      title: 'New Task',
      project,
      members: members || [],
      errors: errors.array(),
    });
  }

  const { title, description, status, due_date, assigned_to } = req.body;

  try {
    await supabase.from('tasks').insert({
      title,
      description: description || '',
      status: status || 'To Do',
      project_id: req.params.projectId,
      assigned_to: assigned_to || null,
      due_date: due_date || null,
      created_by: req.user.id,
    });

    req.flash('success', 'Task created successfully!');
    res.redirect(`/projects/${req.params.projectId}`);
  } catch (err) {
    console.error('Create task error:', err);
    req.flash('error', 'Failed to create task');
    res.redirect(`/projects/${req.params.projectId}`);
  }
});

// GET /tasks/:id/edit - Edit task form
router.get('/tasks/:id/edit', async (req, res) => {
  try {
    const { data: task, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !task) {
      req.flash('error', 'Task not found');
      return res.redirect('/projects');
    }

    // Check if user is admin of the task's project
    const { data: membership } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', task.project_id)
      .eq('user_id', req.user.id)
      .single();

    if (!membership || membership.role !== 'Admin') {
      req.flash('error', 'Only admins can edit tasks');
      return res.redirect(`/projects/${task.project_id}`);
    }

    // Get project members for assignee dropdown
    const { data: members } = await supabase
      .from('project_members')
      .select('users ( id, name, email )')
      .eq('project_id', task.project_id);

    const { data: project } = await supabase
      .from('projects')
      .select('id, name')
      .eq('id', task.project_id)
      .single();

    res.render('tasks/edit', {
      title: 'Edit Task',
      task,
      project,
      members: members || [],
      errors: [],
    });
  } catch (err) {
    console.error('Edit task form error:', err);
    req.flash('error', 'Failed to load task');
    res.redirect('/projects');
  }
});

// POST /tasks/:id - Update task
router.post('/tasks/:id', taskValidation, async (req, res) => {
  try {
    const { data: task } = await supabase
      .from('tasks')
      .select('project_id')
      .eq('id', req.params.id)
      .single();

    if (!task) {
      req.flash('error', 'Task not found');
      return res.redirect('/projects');
    }

    // Check admin
    const { data: membership } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', task.project_id)
      .eq('user_id', req.user.id)
      .single();

    if (!membership || membership.role !== 'Admin') {
      req.flash('error', 'Only admins can edit tasks');
      return res.redirect(`/projects/${task.project_id}`);
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error', errors.array().map(e => e.msg).join(', '));
      return res.redirect(`/tasks/${req.params.id}/edit`);
    }

    const { title, description, status, due_date, assigned_to } = req.body;

    await supabase
      .from('tasks')
      .update({
        title,
        description: description || '',
        status: status || 'To Do',
        assigned_to: assigned_to || null,
        due_date: due_date || null,
      })
      .eq('id', req.params.id);

    req.flash('success', 'Task updated!');
    res.redirect(`/projects/${task.project_id}`);
  } catch (err) {
    console.error('Update task error:', err);
    req.flash('error', 'Failed to update task');
    res.redirect('/projects');
  }
});

// POST /tasks/:id/status - Update task status (Admin or Assignee)
router.post('/tasks/:id/status', async (req, res) => {
  try {
    const { data: task } = await supabase
      .from('tasks')
      .select('project_id, assigned_to')
      .eq('id', req.params.id)
      .single();

    if (!task) {
      req.flash('error', 'Task not found');
      return res.redirect('/projects');
    }

    // Check if user is admin or assignee
    const { data: membership } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', task.project_id)
      .eq('user_id', req.user.id)
      .single();

    const isAdmin = membership && membership.role === 'Admin';
    const isAssignee = task.assigned_to === req.user.id;

    if (!isAdmin && !isAssignee) {
      req.flash('error', 'You can only update status of tasks assigned to you');
      return res.redirect(`/projects/${task.project_id}`);
    }

    const { status } = req.body;
    if (!['To Do', 'In Progress', 'Done'].includes(status)) {
      req.flash('error', 'Invalid status');
      return res.redirect(`/projects/${task.project_id}`);
    }

    await supabase
      .from('tasks')
      .update({ status })
      .eq('id', req.params.id);

    req.flash('success', 'Status updated!');
    res.redirect(`/projects/${task.project_id}`);
  } catch (err) {
    console.error('Update status error:', err);
    req.flash('error', 'Failed to update status');
    res.redirect('/projects');
  }
});

// POST /tasks/:id/delete - Delete task (Admin only)
router.post('/tasks/:id/delete', async (req, res) => {
  try {
    const { data: task } = await supabase
      .from('tasks')
      .select('project_id')
      .eq('id', req.params.id)
      .single();

    if (!task) {
      req.flash('error', 'Task not found');
      return res.redirect('/projects');
    }

    const { data: membership } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', task.project_id)
      .eq('user_id', req.user.id)
      .single();

    if (!membership || membership.role !== 'Admin') {
      req.flash('error', 'Only admins can delete tasks');
      return res.redirect(`/projects/${task.project_id}`);
    }

    await supabase.from('tasks').delete().eq('id', req.params.id);

    req.flash('success', 'Task deleted');
    res.redirect(`/projects/${task.project_id}`);
  } catch (err) {
    console.error('Delete task error:', err);
    req.flash('error', 'Failed to delete task');
    res.redirect('/projects');
  }
});

module.exports = router;

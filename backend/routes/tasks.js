const express = require('express');
const router = express.Router();
const { validationResult } = require('express-validator');
const supabase = require('../config/db');
const { authenticate, requireProjectAdmin } = require('../middleware/auth');
const { taskValidation } = require('../middleware/validators');

router.use(authenticate);

// POST /api/projects/:projectId/tasks — create task (Admin only)
router.post('/projects/:projectId/tasks', requireProjectAdmin, taskValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, description, status, due_date, assigned_to } = req.body;

  try {
    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        title,
        description: description || '',
        status: status || 'To Do',
        project_id: req.params.projectId,
        assigned_to: assigned_to || null,
        due_date: due_date || null,
        created_by: req.user.id,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'Task created successfully', task });
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// GET /api/projects/:projectId/members — get members for task form
router.get('/projects/:projectId/members', async (req, res) => {
  try {
    const { data: members } = await supabase
      .from('project_members')
      .select('users ( id, name, email )')
      .eq('project_id', req.params.projectId);

    res.json({ members: members || [] });
  } catch (err) {
    console.error('Get members error:', err);
    res.status(500).json({ error: 'Failed to load members' });
  }
});

// GET /api/tasks/:id — get single task
router.get('/tasks/:id', async (req, res) => {
  try {
    const { data: task, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ task });
  } catch (err) {
    console.error('Get task error:', err);
    res.status(500).json({ error: 'Failed to load task' });
  }
});

// PUT /api/tasks/:id — update task (Admin only)
router.put('/tasks/:id', taskValidation, async (req, res) => {
  try {
    const { data: task } = await supabase
      .from('tasks')
      .select('project_id')
      .eq('id', req.params.id)
      .single();

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const { data: membership } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', task.project_id)
      .eq('user_id', req.user.id)
      .single();

    if (!membership || membership.role !== 'Admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, status, due_date, assigned_to } = req.body;

    const { data: updated, error } = await supabase
      .from('tasks')
      .update({
        title,
        description: description || '',
        status: status || 'To Do',
        assigned_to: assigned_to || null,
        due_date: due_date || null,
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ message: 'Task updated', task: updated });
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// PATCH /api/tasks/:id/status — update status (Admin or Assignee)
router.patch('/tasks/:id/status', async (req, res) => {
  try {
    const { data: task } = await supabase
      .from('tasks')
      .select('project_id, assigned_to')
      .eq('id', req.params.id)
      .single();

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const { data: membership } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', task.project_id)
      .eq('user_id', req.user.id)
      .single();

    const isAdmin = membership && membership.role === 'Admin';
    const isAssignee = task.assigned_to === req.user.id;

    if (!isAdmin && !isAssignee) {
      return res.status(403).json({ error: 'Only admins or assignees can update status' });
    }

    const { status } = req.body;
    if (!['To Do', 'In Progress', 'Done'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await supabase
      .from('tasks')
      .update({ status })
      .eq('id', req.params.id);

    res.json({ message: 'Status updated' });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// DELETE /api/tasks/:id — delete task (Admin only)
router.delete('/tasks/:id', async (req, res) => {
  try {
    const { data: task } = await supabase
      .from('tasks')
      .select('project_id')
      .eq('id', req.params.id)
      .single();

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const { data: membership } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', task.project_id)
      .eq('user_id', req.user.id)
      .single();

    if (!membership || membership.role !== 'Admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    await supabase.from('tasks').delete().eq('id', req.params.id);

    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const supabase = require('../config/db');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// GET /api/dashboard
router.get('/', async (req, res) => {
  try {
    const { data: memberships } = await supabase
      .from('project_members')
      .select(`
        role,
        projects ( id, name, description, created_at )
      `)
      .eq('user_id', req.user.id)
      .order('joined_at', { ascending: false });

    const projects = (memberships || []).map(m => ({
      ...m.projects,
      userRole: m.role,
    }));

    const projectIds = projects.map(p => p.id);

    let myTasks = [];
    let allTasks = [];

    if (projectIds.length > 0) {
      const { data: assigned } = await supabase
        .from('tasks')
        .select(`
          *,
          project:project_id ( id, name )
        `)
        .eq('assigned_to', req.user.id)
        .in('project_id', projectIds)
        .order('due_date', { ascending: true, nullsFirst: false });

      myTasks = assigned || [];

      const { data: all } = await supabase
        .from('tasks')
        .select('id, status, due_date, project_id')
        .in('project_id', projectIds);

      allTasks = all || [];
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const stats = {
      totalProjects: projects.length,
      totalTasks: allTasks.length,
      todo: allTasks.filter(t => t.status === 'To Do').length,
      inProgress: allTasks.filter(t => t.status === 'In Progress').length,
      done: allTasks.filter(t => t.status === 'Done').length,
      overdue: allTasks.filter(t => {
        if (!t.due_date || t.status === 'Done') return false;
        return new Date(t.due_date) < now;
      }).length,
      myTaskCount: myTasks.length,
    };

    const overdueTasks = myTasks.filter(t => {
      if (!t.due_date || t.status === 'Done') return false;
      return new Date(t.due_date) < now;
    });

    res.json({ stats, myTasks, overdueTasks, projects });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

module.exports = router;

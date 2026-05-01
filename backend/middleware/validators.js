const { body } = require('express-validator');

const signupValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }).withMessage('Name too long'),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginValidation = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const projectValidation = [
  body('name').trim().notEmpty().withMessage('Project name is required').isLength({ max: 200 }).withMessage('Name too long'),
  body('description').trim().optional(),
];

const taskValidation = [
  body('title').trim().notEmpty().withMessage('Task title is required').isLength({ max: 300 }).withMessage('Title too long'),
  body('description').trim().optional(),
  body('status').optional().isIn(['To Do', 'In Progress', 'Done']).withMessage('Invalid status'),
  body('due_date').optional({ values: 'falsy' }).isISO8601().withMessage('Invalid date format'),
  body('assigned_to').optional({ values: 'falsy' }).isUUID().withMessage('Invalid assignee'),
];

module.exports = { signupValidation, loginValidation, projectValidation, taskValidation };

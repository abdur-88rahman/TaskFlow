# TaskFlow — Team Task Manager

A full-stack web application for team collaboration where users can create projects, assign tasks, and track progress with **role-based access control** (Admin/Member).

> **Live Demo:** [Deployed on Railway](#) *(update with your Railway URL after deployment)*

---

## 🚀 Features

### Authentication
- Secure **signup & login** with hashed passwords (bcrypt)
- JWT-based session management via httpOnly cookies
- Protected routes — unauthenticated users are redirected to login

### Project Management
- Create, view, and delete projects
- Add or remove team members with role assignment
- Searchable member autocomplete — type a name or email to find and add users

### Task Management
- Create, edit, and delete tasks within projects
- Assign tasks to specific team members
- Set due dates and track task status (`To Do` → `In Progress` → `Done`)
- Inline status updates via dropdown — changes are saved instantly

### Dashboard
- Overview of all projects the user belongs to
- Task statistics — total, in-progress, completed, and overdue counts
- Personal task list showing tasks assigned to the logged-in user
- **Overdue detection** — tasks past their due date are flagged in red

### Role-Based Access Control (RBAC)

| Action                    | Admin | Member |
|---------------------------|:-----:|:------:|
| Create project            |   ✅   |   ✅    |
| Delete project            |   ✅   |   ❌    |
| Add / remove members      |   ✅   |   ❌    |
| Create / edit / delete tasks |   ✅   |   ❌    |
| Update task status        |   ✅   | ✅ *(assigned tasks only)* |
| View project & tasks      |   ✅   |   ✅    |

- The **project creator** is automatically assigned the `Admin` role.
- Admins can add other users as either `Admin` or `Member`.

---

## 🛠️ Tech Stack

| Layer         | Technology                                   |
|---------------|----------------------------------------------|
| **Backend**   | Node.js, Express.js                          |
| **Database**  | PostgreSQL via Supabase                      |
| **Auth**      | bcryptjs (hashing), jsonwebtoken (JWT)       |
| **Templating**| EJS (server-side rendering)                  |
| **Styling**   | Vanilla CSS (custom dark theme)              |
| **Validation**| express-validator                            |
| **Deployment**| Railway                                      |

---

## 📁 Project Structure

```
Team Task Manager/
├── server.js                 # Express app entry point
├── package.json
├── .env                      # Environment variables (git-ignored)
├── .gitignore
├── config/
│   ├── db.js                 # Supabase client configuration
│   └── schema.sql            # Database schema (run in Supabase SQL Editor)
├── middleware/
│   ├── auth.js               # JWT authentication & role-based guards
│   └── validators.js         # Request validation rules
├── routes/
│   ├── auth.js               # Signup, login, logout
│   ├── dashboard.js          # Dashboard with stats & task overview
│   ├── projects.js           # Project CRUD & member management
│   └── tasks.js              # Task CRUD & status updates
├── views/
│   ├── partials/             # Reusable header, navbar, footer
│   ├── auth/                 # Login & signup pages
│   ├── projects/             # Project list, detail, and creation pages
│   ├── tasks/                # Task creation & edit forms
│   ├── dashboard.ejs         # Main dashboard view
│   ├── 404.ejs               # Not found page
│   └── error.ejs             # Server error page
└── public/
    └── css/
        └── style.css         # Global stylesheet
```

---

## ⚙️ Setup & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- A [Supabase](https://supabase.com/) account (free tier works)

### 1. Clone the Repository

```bash
git clone https://github.com/AbdurRahman22224/Team-Task-Manager.git
cd Team-Task-Manager
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase Database

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project (or use an existing one)
3. Navigate to **SQL Editor → New Query**
4. Paste the contents of `config/schema.sql` and click **Run**
5. Go to **Settings → API** and copy:
   - **Project URL** → `SUPABASE_URL`
   - **Service Role Key** (under `service_role`) → `SUPABASE_SERVICE_KEY`

### 4. Configure Environment Variables

Create a `.env` file in the project root:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
JWT_SECRET=your-random-secret-string
SESSION_SECRET=your-another-random-secret
PORT=3000
NODE_ENV=development
```

> Generate secure secrets by running:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### 5. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Deployment (Railway)

### Steps

1. Push the code to GitHub:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push -u origin main
   ```

2. Go to [Railway](https://railway.app/) and create a new project

3. Select **"Deploy from GitHub Repo"** and connect your repository

4. Add the following **environment variables** in Railway's dashboard:
   | Variable              | Value                              |
   |-----------------------|------------------------------------|
   | `SUPABASE_URL`        | Your Supabase project URL          |
   | `SUPABASE_SERVICE_KEY`| Your Supabase service role key     |
   | `JWT_SECRET`          | A random 64-character hex string   |
   | `SESSION_SECRET`      | A random 64-character hex string   |
   | `NODE_ENV`            | `production`                       |

5. Railway auto-detects Node.js and runs `npm start`

6. Your app will be live at the Railway-provided URL 🎉

---

## 📡 API Routes

### Authentication
| Method | Route           | Description          |
|--------|-----------------|----------------------|
| GET    | `/auth/signup`  | Signup page          |
| POST   | `/auth/signup`  | Create new account   |
| GET    | `/auth/login`   | Login page           |
| POST   | `/auth/login`   | Authenticate user    |
| GET    | `/auth/logout`  | Logout & clear session|

### Dashboard
| Method | Route        | Description                    |
|--------|--------------|--------------------------------|
| GET    | `/dashboard` | User dashboard with stats      |

### Projects
| Method | Route                                    | Access  |
|--------|------------------------------------------|---------|
| GET    | `/projects`                              | Member+ |
| GET    | `/projects/new`                          | Any     |
| POST   | `/projects`                              | Any     |
| GET    | `/projects/:id`                          | Member+ |
| POST   | `/projects/:id/members`                  | Admin   |
| POST   | `/projects/:id/members/:memberId/remove` | Admin   |
| POST   | `/projects/:id/delete`                   | Admin   |

### Tasks
| Method | Route                              | Access             |
|--------|------------------------------------|--------------------|
| GET    | `/projects/:id/tasks/new`          | Admin              |
| POST   | `/projects/:id/tasks`              | Admin              |
| GET    | `/tasks/:id/edit`                  | Admin              |
| POST   | `/tasks/:id`                       | Admin              |
| POST   | `/tasks/:id/status`                | Admin or Assignee  |
| POST   | `/tasks/:id/delete`                | Admin              |

---

## 🗄️ Database Schema

```
┌──────────┐       ┌─────────────────┐       ┌──────────┐
│  users   │       │ project_members │       │ projects │
├──────────┤       ├─────────────────┤       ├──────────┤
│ id (PK)  │◄──┐   │ id (PK)         │   ┌──►│ id (PK)  │
│ name     │   ├───│ user_id (FK)    │   │   │ name     │
│ email    │   │   │ project_id (FK) │───┘   │ desc     │
│ password │   │   │ role            │       │ owner_id │──┐
│ created  │   │   │ joined_at       │       │ created  │  │
└──────────┘   │   └─────────────────┘       └──────────┘  │
               │                                            │
               │   ┌──────────┐                             │
               │   │  tasks   │                             │
               │   ├──────────┤                             │
               ├───│ assigned │                             │
               │   │ created  │─────────────────────────────┘
               │   │ project  │
               │   │ title    │
               │   │ status   │
               │   │ due_date │
               │   └──────────┘
```

---

## 👤 Author

**Abdur Rahman**
- GitHub: [@AbdurRahman22224](https://github.com/AbdurRahman22224)

---

## 📄 License

This project is built as a full-stack assignment submission.

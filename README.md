# TaskFlow — Team Task Manager

A full-stack web application for team collaboration where users can create projects, assign tasks, and track progress with **role-based access control** (Admin/Member).

Built with a **REST API backend** (Node.js/Express) and a **separate frontend** (vanilla HTML/CSS/JS), connected to **Supabase PostgreSQL**.

> **Live Demo:** [Deployed on Railway](#) *(update with your Railway URL after deployment)*

---

## 🚀 Features

### Authentication
- Secure **signup & login** with hashed passwords (bcrypt)
- JWT-based session management via httpOnly cookies
- Protected API routes — unauthenticated requests receive 401 JSON responses

### Project Management
- Create, view, and delete projects
- Add or remove team members with role assignment
- Searchable member autocomplete — type a name or email to find and add users

### Task Management
- Create, edit, and delete tasks within projects
- Assign tasks to specific team members
- Set due dates and track task status (`To Do` → `In Progress` → `Done`)
- Inline status updates — changes saved via PATCH API call

### Dashboard
- Overview of all projects the user belongs to
- Task statistics — total, in-progress, completed, and overdue counts
- Personal task list showing tasks assigned to the logged-in user
- **Overdue detection** — tasks past their due date are flagged

### Role-Based Access Control (RBAC)

| Action                        | Admin | Member                    |
|-------------------------------|:-----:|:-------------------------:|
| Create project                |   ✅   |   ✅                       |
| Delete project                |   ✅   |   ❌                       |
| Add / remove members          |   ✅   |   ❌                       |
| Create / edit / delete tasks  |   ✅   |   ❌                       |
| Update task status            |   ✅   | ✅ *(assigned tasks only)* |
| View project & tasks          |   ✅   |   ✅                       |

---

## 🛠️ Tech Stack

| Layer          | Technology                              |
|----------------|-----------------------------------------|
| **Backend**    | Node.js, Express.js (REST API)          |
| **Frontend**   | Vanilla HTML, CSS, JavaScript           |
| **Database**   | PostgreSQL via Supabase                 |
| **Auth**       | bcryptjs (hashing), jsonwebtoken (JWT)  |
| **Validation** | express-validator                       |
| **Deployment** | Railway                                 |

---

## 📁 Project Structure

```
Team Task Manager/
├── server.js                     # Entry point — serves API + static files
├── package.json
├── .env                          # Environment variables (git-ignored)
├── .gitignore
│
├── backend/                      # REST API (Express)
│   ├── config/
│   │   ├── db.js                 # Supabase client
│   │   └── schema.sql            # Database schema
│   ├── middleware/
│   │   ├── auth.js               # JWT auth + role guards
│   │   └── validators.js         # Request validation
│   └── routes/
│       ├── auth.js               # POST /api/auth/signup, login, logout
│       ├── dashboard.js          # GET  /api/dashboard
│       ├── projects.js           # CRUD /api/projects
│       └── tasks.js              # CRUD /api/tasks
│
└── frontend/                     # Static frontend (vanilla JS)
    ├── index.html                # Login page
    ├── signup.html               # Signup page
    ├── dashboard.html            # Dashboard
    ├── projects.html             # Project list
    ├── project.html              # Project detail + tasks + members
    ├── new-project.html          # Create project form
    ├── new-task.html             # Create task form
    ├── edit-task.html            # Edit task form
    ├── css/
    │   └── style.css             # Global stylesheet
    └── js/
        ├── api.js                # API client (fetch wrapper)
        └── utils.js              # Shared UI utilities
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
4. Paste the contents of `backend/config/schema.sql` and click **Run**
5. Go to **Settings → API** and copy your **Project URL** and **Service Role Key**

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

### 5. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📡 REST API Endpoints

### Authentication
| Method | Endpoint            | Description           | Auth Required |
|--------|---------------------|-----------------------|:------------:|
| POST   | `/api/auth/signup`  | Create new account    |      ❌       |
| POST   | `/api/auth/login`   | Authenticate user     |      ❌       |
| POST   | `/api/auth/logout`  | Logout (clear cookie) |      ❌       |
| GET    | `/api/auth/me`      | Get current user      |      ✅       |

### Dashboard
| Method | Endpoint         | Description             | Auth Required |
|--------|------------------|-------------------------|:------------:|
| GET    | `/api/dashboard` | Stats, tasks, projects  |      ✅       |

### Projects
| Method | Endpoint                                  | Description       | Access  |
|--------|-------------------------------------------|-------------------|---------|
| GET    | `/api/projects`                           | List user projects | Member+ |
| POST   | `/api/projects`                           | Create project     | Any     |
| GET    | `/api/projects/:id`                       | Project detail     | Member+ |
| DELETE | `/api/projects/:id`                       | Delete project     | Admin   |
| POST   | `/api/projects/:id/members`               | Add member         | Admin   |
| DELETE | `/api/projects/:id/members/:memberId`     | Remove member      | Admin   |

### Tasks
| Method | Endpoint                          | Description     | Access            |
|--------|-----------------------------------|-----------------|-------------------|
| POST   | `/api/projects/:id/tasks`         | Create task     | Admin             |
| GET    | `/api/tasks/:id`                  | Get task        | Member+           |
| PUT    | `/api/tasks/:id`                  | Update task     | Admin             |
| PATCH  | `/api/tasks/:id/status`           | Update status   | Admin or Assignee |
| DELETE | `/api/tasks/:id`                  | Delete task     | Admin             |

---

## 🌐 Deployment (Railway)

1. Push to GitHub:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push -u origin main
   ```

2. Go to [Railway](https://railway.app/) → New Project → **Deploy from GitHub Repo**

3. Set environment variables:
   | Variable              | Value                          |
   |-----------------------|--------------------------------|
   | `SUPABASE_URL`        | Your Supabase project URL      |
   | `SUPABASE_SERVICE_KEY`| Your Supabase service role key |
   | `JWT_SECRET`          | Random 64-char hex string      |
   | `SESSION_SECRET`      | Random 64-char hex string      |
   | `NODE_ENV`            | `production`                   |

4. Railway auto-detects Node.js and runs `npm start` 🎉

---

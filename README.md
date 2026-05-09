# 🏢 SocietyPro — Society Maintenance Management System

A full-stack web application for managing housing society maintenance, built with **HTML/CSS/JS + Node.js + Express + MongoDB**.

---

## 🚀 Quick Setup

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- npm

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
Edit `backend/.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/society_maintenance
JWT_SECRET=your_super_secret_key_change_this
JWT_EXPIRE=7d
```
For MongoDB Atlas, replace MONGODB_URI with your Atlas connection string.

### 3. Start the Server
```bash
cd backend
npm start
# or for development with auto-reload:
npm run dev
```

### 4. Open the App
Visit: **http://localhost:5000**

---

## 📁 Project Structure

```
society-app/
├── backend/
│   ├── models/
│   │   ├── User.js          # Member/committee user model
│   │   ├── Maintenance.js   # Monthly maintenance schedule
│   │   ├── Payment.js       # Payment records per flat
│   │   └── Notice.js        # Notice board posts
│   ├── routes/
│   │   ├── auth.js          # Login, register, profile
│   │   ├── members.js       # Member management
│   │   ├── maintenance.js   # Maintenance schedules
│   │   ├── payments.js      # Payment tracking
│   │   ├── notices.js       # Notice board
│   │   └── dashboard.js     # Stats & analytics
│   ├── middleware/
│   │   └── auth.js          # JWT + role-based access
│   ├── server.js
│   ├── .env
│   └── package.json
└── frontend/
    ├── index.html
    ├── css/main.css
    └── js/
        ├── api.js           # API helper
        ├── utils.js         # Shared utilities
        ├── auth.js          # Login/register logic
        ├── app.js           # Routing & navigation
        └── pages/
            ├── dashboard.js
            ├── maintenance.js
            ├── payments.js
            ├── members.js
            ├── notices.js
            └── profile.js
```

---

## 👥 Roles & Permissions

| Feature                        | Member | Secretary | Treasurer | Chairman |
|-------------------------------|--------|-----------|-----------|----------|
| View dashboard                | ✅      | ✅         | ✅         | ✅        |
| View own payments             | ✅      | ✅         | ✅         | ✅        |
| View notice board             | ✅      | ✅         | ✅         | ✅        |
| Issue maintenance schedule    | ❌      | ✅         | ✅         | ✅        |
| Record payments               | ❌      | ✅         | ✅         | ✅        |
| Mark overdue payments         | ❌      | ✅         | ✅         | ✅        |
| View all members              | ❌      | ✅         | ✅         | ✅        |
| Edit members                  | ❌      | ✅         | ✅         | ✅        |
| Post notices                  | ❌      | ✅         | ✅         | ✅        |
| View dues/arrears             | ❌      | ✅         | ✅         | ✅        |
| Delete maintenance/members    | ❌      | ❌         | ❌         | ✅        |

---

## ✨ Features

### For Members
- Personal dashboard with payment status
- View current month's maintenance amount
- Full payment history (paid / pending / overdue)
- Notice board with society announcements
- Edit profile

### For Committee (Secretary / Treasurer / Chairman)
- **Society dashboard** with collection stats and 6-month trend chart
- **Issue maintenance** — set amount, due date, late fee for any month
- Auto-creates pending payment records for all members when maintenance is issued
- **Payment management** — filter by month/year/status, mark payments as paid
- **Record payment** — select method (cash/UPI/cheque/online), add transaction ID
- **Mark overdue** — bulk mark all past-due payments as overdue
- **Dues & Arrears** — view all unpaid dues across all flats
- **Payment summary** — per-maintenance breakdown (who paid, who hasn't)
- **Members management** — view, search, filter, and edit all members
- **Notice board** — post/delete notices with categories (urgent, meeting, event, etc.)

---

## 🔐 First Run

1. Register as **Chairman** (first user, select role during registration)
2. Issue maintenance for the current month
3. Add other committee members or have them self-register
4. Members self-register with their flat numbers

---

## 🗃️ API Endpoints

### Auth
- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Get current user
- `PUT /api/auth/profile` — Update profile

### Maintenance
- `GET /api/maintenance` — List all schedules
- `GET /api/maintenance/current` — Current month
- `POST /api/maintenance` — Issue new (committee)
- `DELETE /api/maintenance/:id` — Delete (chairman)

### Payments
- `GET /api/payments` — All payments (filtered)
- `GET /api/payments/my-status` — Member's own payments
- `GET /api/payments/summary/:id` — Summary per schedule
- `GET /api/payments/dues/list` — All dues
- `POST /api/payments/record` — Record payment (committee)
- `POST /api/payments/mark-overdue` — Bulk mark overdue

### Members
- `GET /api/members` — All members (committee)
- `PUT /api/members/:id` — Edit member
- `DELETE /api/members/:id` — Deactivate (chairman)

### Notices
- `GET /api/notices` — All active notices
- `POST /api/notices` — Post notice (committee)
- `DELETE /api/notices/:id` — Remove notice

### Dashboard
- `GET /api/dashboard/stats` — Committee stats + trend
- `GET /api/dashboard/member-stats` — Member personal stats

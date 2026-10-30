# CampusOS – FixIt

> **Report. Track. Resolve. Improve.**  
> Modern, responsive campus maintenance management platform with real-time ticket tracking, turnaround time (TAT) monitoring, and role-based access for students, faculty, maintenance staff, and administration.

---

## 🌟 Overview

CampusOS FixIt streamlines campus maintenance by replacing paper slips and fragmented complaints with an intuitive, passwordless system. Users report broken infrastructure with photos, campus maintenance teams assign turnaround dates and track resolutions, and students acknowledge completion.

### Key Capabilities

- **Passwordless Multi-Role Authentication:**
  - **Student Portal:** Sign in or register with USN (`1RV22CS001`) and one-time code.
  - **Faculty Portal:** Departmental reporting and facility escalation.
  - **Campus Maintenance (CM):** Dedicated supervisor workflow for status and turnaround time management.
  - **Team 41 Administrator Portal:** Secure access for team coordinators and managers.
- **Maintenance Ticketing Engine:**
  - Create tickets with title, description, category, and photo attachments.
  - Real-time status progression: `OPEN` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `RESOLVED` $\rightarrow$ `ACKNOWLEDGED`.
  - Turnaround Time (TAT) enforcement: automatic `overdue: true` tagging when target completion dates pass.
  - Issue category CRUD (Electrical, Plumbing, Furniture, IT & Network).
- **FastAPI Backend Integration:**
  - Integrated with live production backend at `https://campus-os-backend-8sjf.onrender.com/api/v1`.
  - Offline-first resilience with local reactive storage fallback.

---

## 🏗️ Architecture & Tech Stack

```text
src/
├── components/
│   ├── auth/           # Login, registration, OTP verification, admin portal
│   ├── fixit/          # Dashboard, ticket creation, status update, issue types
│   └── ui/             # Core UI primitives (dialogs, badges, buttons, inputs)
├── lib/
│   ├── api-client.ts   # Unified HTTP client with JWT management
│   ├── fixit-store.ts  # Reactive ticket store with live sync & offline caching
│   ├── mock-auth.ts    # Authentication state, session handling, validation
│   └── utils.ts        # Class merging and formatting utilities
├── routes/
│   ├── __root.tsx      # Application layout shell, fonts, and global toaster
│   ├── index.tsx       # Landing & authentication router
│   └── dashboard.$role.tsx # Role-specific dashboard route
└── test/               # Vitest suite for auth, validation, and routing
```

- **Frontend Framework:** React 19, TypeScript
- **Routing:** TanStack Router & TanStack Start
- **Styling:** Tailwind CSS (Navy / Charcoal / Cyan aesthetic with subtle glassmorphism)
- **Icons:** Lucide React
- **Notifications:** Sonner
- **Testing:** Vitest & Node test runner

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (tested with Node 20 / 22 / 24)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/adithya2346/pixel-perfect-replica.git
cd pixel-perfect-replica

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

---

## 🧪 Testing & Verification

### 1. Unit Tests

Run the Vitest test suite for form validation, USN regex, and authentication flows:

```bash
npm run test
```

### 2. Live Backend API Verification Suite

Run the automated end-to-end verification script against the live Render API:

```bash
npm run test:api
```

This verifies all 13 endpoints:
- `GET /openapi.json`
- `POST /api/v1/auth/admin/login`
- `POST /api/v1/auth/login` (Student & Maintenance roles)
- `GET /api/v1/fixit/issue-types` & `POST /api/v1/fixit/issue-types`
- `POST /api/v1/fixit/tickets` (Multipart form-data)
- `GET /api/v1/fixit/tickets` & filters (`?status=open`)
- `PUT /api/v1/fixit/tickets/{id}/tat` (Turnaround time)
- `PUT /api/v1/fixit/tickets/{id}/status`
- `POST /api/v1/fixit/tickets/{id}/acknowledge`
- `DELETE /api/v1/fixit/tickets/{id}`

---

## 🔒 Demo Credentials

For quick evaluation, pre-fill buttons are provided on each login screen:

| Role | Email / Contact | Code / OTP | Details |
| :--- | :--- | :--- | :--- |
| **Team 41 Admin** | `admin@team41.com` | From team sheet | Team 41 Administrator |
| **Student** | `mithun@team42.com` / `1CF24CS042` | `472719` | Mithun Chawan (CSE) |
| **Maintenance (CM)** | `ravi@team42.com` | `472719` | Ravi Shetty (Supervisor) |
| **Faculty** | `priya.faculty@campus.edu` | `472719` | Dr. Priya Raman |

---

## 📄 License

MIT

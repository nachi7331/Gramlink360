# Gramlink 360: Smart Village Services & Citizen Portal
**B.Tech Computer Science & Business Systems (CSBS) Mini Project**
*Theme: Digital India • e-Governance • Transparent Public Service Delivery*

---

## 🌾 1. Project Overview
**Gramlink 360** is a single-window digital governance platform engineered for rural Indian Gram Panchayats (modeled on **Gram Panchayat Shivrajpur, Baramati, Maharashtra**). 

Unlike generic college CRUD projects, Gramlink 360 addresses core **Computer Science & Business Systems (CSBS)** principles:
- **Business Process Re-engineering (BPR):** Transforming unstructured verbal/paper complaints into formal digital service tickets governed by strict **48-Hour Service Level Agreements (SLAs)**.
- **Social Auditing & Open Data:** Public transparency dashboards that benchmark ward-level performance and combat administrative opacity.
- **Digital Inclusion:** Clean, high-contrast, mobile-first UI with built-in **English and Marathi (मराठी)** language toggle for first-time rural internet users.
- **Zero-Backend Cloud Architecture (Supabase):** Secure PostgreSQL Row Level Security (RLS) policies that eliminate insecure backend code.

---

## 🚀 2. How to Run Locally

### Option A: Direct Browser Launch (Simplest)
Because Gramlink 360 is built with pure standards-compliant **HTML5, modern CSS3, and Vanilla JavaScript**, no compilation, Node.js, or build steps are required.
1. Double-click or open `index.html` in any modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari).
2. All navigation links and features function immediately.

### Option B: Local Web Server via PowerShell
To run over a local `http://localhost` port:
1. Open PowerShell in the project directory:
   ```powershell
   # Start a lightweight built-in HTTP server on port 8080
   $listener = New-Object System.Net.HttpListener
   $listener.Prefixes.Add("http://localhost:8080/")
   $listener.Start()
   Write-Host "Server running at http://localhost:8080/"
   ```
2. Open your browser and navigate to `http://localhost:8080/`.

---

## 📂 3. File & Folder Architecture

```
Turbo.C.3.2/
├── index.html                   # Homepage: Hero, Emergency Bar, Live Ticker, Quick Tracker
├── README.md                    # Project documentation & CSBS Viva guide
├── css/
│   ├── style.css                # Master Design System (Gov-Tech palette, cards, forms, tables)
│   └── animations.css           # Hardware-accelerated reveals, floating physics, reduced-motion
├── js/
│   ├── translations.js          # Bilingual dictionary (English & Marathi) with DOM switcher
│   ├── state.js                 # Central store (localStorage persistence & Supabase-ready methods)
│   ├── main.js                  # Sticky header, mobile drawer, toasts, session badges
│   ├── services.js              # Service directory search, category filters, detail modal
│   ├── complaints.js            # Grievance validation, GPS simulation, token generator, tracker
│   ├── announcements.js         # Notice board search, urgency filters, agenda modal
│   ├── auth.js                  # Login/Register validation, role switcher, 1-click test fill
│   ├── resident.js              # Resident portal history and status counters
│   └── admin.js                 # Sarpanch desk: triage table, status dropdowns, CSV exporter
├── pages/
│   ├── village-dashboard.html   # Village Pulse: ward metrics, utilities telemetry, SLA scores
│   ├── services.html            # Searchable 6-department local services directory
│   ├── complaint-submit.html    # Citizen grievance submission form with photo preview
│   ├── complaint-track.html     # Real-time 4-step status timeline & feedback rating
│   ├── announcements.html       # Gram Sabha meetings, advisories, health immunization drives
│   ├── auth.html                # Role-based authentication portal (Resident vs Admin)
│   ├── resident-dashboard.html  # Citizen personal command center
│   └── admin-dashboard.html     # Sarpanch / Administrative control room
└── database/
    └── schema.sql               # Production Supabase PostgreSQL schema with RLS policies
```

---

## 🔑 4. Interactive Viva Demonstration Flow

When presenting this project to your college project evaluators:

### Step 1: Public Homepage & Language Switch
- Open [`index.html`](index.html).
- Show the **Emergency Helpline Strip** (108, 1091, 1551, 112).
- Click the **मराठी (Marathi)** button in the top right: show how the entire interface instantly switches to vernacular Marathi for rural villagers.
- Point out the **Hero Section** with real-time trust metrics (94.2% Resolved Rate, 48-Hour SLA guarantee).

### Step 2: Instant Public Tracking (No Login Required)
- In the Quick Track Bar, enter `GL-2026-1042` and click **Check Status**.
- It opens [`pages/complaint-track.html`](pages/complaint-track.html):
  - Point out the **4-Step Visual Stepper** (Registered ➔ Verified ➔ In Progress ➔ Resolved).
  - Show the assigned field officer (Santosh Jadhav) and the live activity log.

### Step 3: Lodging a Real Complaint
- Navigate to [`pages/complaint-submit.html`](pages/complaint-submit.html).
- Select **Drinking Water Supply**, choose **Ward 2 - Shivaji Chowk**, enter a subject and phone number.
- Click **📍 Detect GPS**: show the auto-detected coordinates.
- Click **Submit Grievance to Panchayat**:
  - A success modal appears with a newly generated reference token (e.g. `GL-2026-4819`).
  - Click **Track Status Now** to demonstrate that the new complaint was saved directly to client state!

### Step 4: Resident Portal
- Navigate to [`pages/auth.html`](pages/auth.html).
- Click the 1-click button: **Fill Resident (Ramesh)** and click **Sign In**.
- It opens [`pages/resident-dashboard.html`](pages/resident-dashboard.html):
  - View personal metrics and the historical list of filed grievances.

### Step 5: Sarpanch & Admin Control Desk
- Navigate back to [`pages/auth.html`](pages/auth.html).
- Click **Fill Admin (Sarpanch)** and click **Sign In**.
- It opens [`pages/admin-dashboard.html`](pages/admin-dashboard.html):
  - Notice the **Grievance Triage Table**.
  - Change a status from **Pending** to **In Progress** or **Resolved**.
  - Show that it immediately asks for administrative notes and updates the local state.
  - Click **📢 Broadcast Notice** to add a new Gram Sabha announcement.
  - Click **📥 Export Report (CSV)** to generate an official downloadable audit spreadsheet.

---

## 🎓 5. Examiner Viva Questions & Answers (CSBS Focus)

### Q1: What makes this a Computer Science & Business Systems (CSBS) project rather than standard CS?
> **Answer:** Standard Computer Science projects focus purely on CRUD operations and database tables. CSBS bridges technical architecture with **business and governance operations**. Gramlink 360 models:
> 1. **Service Level Agreement (SLA) Management:** Every ticket has a mandatory 48-hour countdown timer.
> 2. **Business Process Re-engineering (BPR):** Removing intermediaries, bribery, and paper delays by connecting villagers directly to assigned field officers.
> 3. **Social Auditing:** The Village Pulse page provides public transparency into ward performance and budget utilization, reducing corruption.

### Q2: Why did you choose Vanilla JavaScript instead of React or Angular?
> **Answer:** 
> 1. **Zero Runtime Overhead:** Rural internet connections often have low bandwidth. A vanilla JS application has zero bundle bloat and loads under 1 second on low-end budget smartphones.
> 2. **Engineering Fundamentals:** Demonstrates deep mastery of modern DOM APIs, asynchronous JavaScript, Web Storage APIs, and IntersectionObserver without relying on heavy third-party framework dependencies.

### Q3: How does security work if you don't have a traditional backend server?
> **Answer:** We designed the system around **Supabase Row Level Security (RLS)** in PostgreSQL (`database/schema.sql`). In PostgreSQL RLS, security policies are enforced at the database kernel level based on the user's cryptographically signed JWT token (`auth.uid()`). Even if an attacker modifies the browser JavaScript, PostgreSQL rejects any unauthorized `UPDATE` or `DELETE` query.

---

---

## ⚡ 6. Supabase Live Integration & Security Architecture

The frontend is integrated with **Supabase PostgreSQL** and **Supabase Auth** using `@supabase/supabase-js v2`.

### 6.1 Static Site Configuration Strategy
Static websites hosted on GitHub Pages, Netlify, or Vercel do not possess server-side runtimes to read `.env` files dynamically. Gramlink 360 uses a documented, static-compatible configuration module:
* **File:** [`js/config.js`](js/config.js)
* **Object:** `window.GRAMLINK_CONFIG`
* Exposes only the **publishable client key (`anon` key)**, which is safe for client-side execution under Row Level Security.
* The `service_role` (secret) key is strictly excluded.

### 6.2 Implemented Operations & Live Database Mapping

| Operation | Supabase API Method | Target PostgreSQL Table | Security Enforcement |
| :--- | :--- | :--- | :--- |
| **Resident Signup** | `supabase.auth.signUp()` | `auth.users` ➔ `profiles` | Database trigger forces `role = 'resident'`. Client role spoofing is blocked. |
| **Resident Login** | `supabase.auth.signInWithPassword()` | `auth.users` & `profiles` | Authenticated session token stored in browser localStorage. |
| **Session Detection** | `supabase.auth.getSession()` | Client-side & JWT | Header dynamically displays name & role badge; manages logout. |
| **File Complaint** | `supabase.from('complaints').insert()` | `public.complaints` | RLS enforces `auth.uid() = citizen_id` and `status = 'Pending'`. |
| **Track Complaint** | `supabase.from('complaints').select('*, complaint_status_history(*)')` | `complaints` & `complaint_status_history` | Public token lookup permitted without revealing unrelated private tickets. |
| **Resident History** | `supabase.from('complaints').select()` | `public.complaints` | RLS restricts query strictly to `citizen_id = auth.uid()`. |
| **Services Directory** | `supabase.from('services').select()` | `public.services` | Public read permitted for `is_active = true`. |
| **Announcements** | `supabase.from('announcements').select()` | `public.announcements` | Public read permitted. Writes restricted strictly to `administrator`. |
| **Admin Triage** | `supabase.from('complaints').update()` | `public.complaints` | RLS checks `public.is_admin()`. Automatic trigger logs change to `complaint_status_history`. |

### 6.3 Row Level Security (RLS) Principle of Least Privilege
Direct administrative operations are guarded at the database kernel level:
```sql
-- Prevents non-administrators from tampering with complaint statuses
CREATE POLICY "complaints_admin_officer_update"
  ON public.complaints FOR UPDATE
  TO authenticated
  USING (public.is_officer_or_admin() OR assigned_officer_id = auth.uid());
```
Even if an attacker attempts an unauthorized `fetch()` or `curl` query with the `anon` key, PostgreSQL terminates the transaction with an RLS access-denied exception.

### 6.4 Deep Dive into PostgreSQL Triggers & RLS Policies

All database constraints and policies are defined in [`database/schema.sql`](database/schema.sql):

1. **Automatic Profile Provisioning (`handle_new_user`)**:
   - Executes `AFTER INSERT ON auth.users`.
   - Forces `role = 'resident'`. Any client attempt to inject `role = 'administrator'` inside signup user metadata is discarded at the database level.
2. **Privilege Escalation Prevention (`prevent_self_role_escalation`)**:
   - Executes `BEFORE UPDATE ON public.profiles`.
   - Checks `IF (OLD.role IS DISTINCT FROM NEW.role)`.
   - Rejects the transaction with an exception unless `public.is_admin()` returns true.
3. **Immutable Audit History Trigger (`log_complaint_status_transition`)**:
   - Executes `AFTER INSERT OR UPDATE ON public.complaints`.
   - Automatically writes an immutable record to `public.complaint_status_history` recording `old_status`, `new_status`, notes, and `auth.uid()`.
   - Direct client `INSERT`/`UPDATE`/`DELETE` on `complaint_status_history` is prohibited by RLS.
4. **Administrative Verification Functions (`is_admin`, `is_officer_or_admin`)**:
   - Defined with `SECURITY DEFINER STABLE SET search_path = public`.
   - Prevents infinite recursion when checking roles inside RLS policies.
5. **Table-Specific Row Level Security Policies**:
   - **`public.profiles`**: Residents can `SELECT` and `UPDATE` only their own row (`id = auth.uid()`). Administrators can view all.
   - **`public.services`**: `SELECT` is open to `anon` and `authenticated` where `is_active = true`. Modifications require `public.is_admin()`.
   - **`public.complaints`**:
     - `INSERT`: Strictly requires `auth.uid() = citizen_id` and initial `status = 'Pending'`.
     - `SELECT`: Residents see their own tickets (`citizen_id = auth.uid()`), admins see all, and villagers can query by exact `reference_token`.
     - `UPDATE`: Restricted to `public.is_officer_or_admin()` or `assigned_officer_id = auth.uid()`.
   - **`public.announcements`**: Public `SELECT` for all users; `INSERT`/`UPDATE`/`DELETE` strictly guarded by `public.is_admin()`.

---

## 🧪 7. Automated Test Suite & Operation Verification

Gramlink 360 includes an automated integration test suite in [`test-supabase-integration.js`](test-supabase-integration.js) that validates every Supabase operation and security boundary against the live database:

```powershell
node test-supabase-integration.js
```

### Verified Test Cases:
1. **Configuration & Security Audit:** Confirms only the publishable `anon` key is loaded in client code and guarantees zero exposure of `service_role`.
2. **Public Services Directory (`GET /rest/v1/services`):** Verifies active village services load correctly.
3. **Public Announcements Feed (`GET /rest/v1/announcements`):** Verifies village notices and meetings load.
4. **Complaint Creation RLS Guard (`POST /rest/v1/complaints`):** Proves unauthorized unauthenticated complaint inserts are rejected with PostgreSQL Error `42501` (`row-level security policy violation`).
5. **Announcement Publishing RLS Guard (`POST /rest/v1/announcements`):** Proves unauthorized notice creation is terminated by RLS.
6. **Complaint Status Triage RLS Guard (`PATCH /rest/v1/complaints`):** Proves status changes cannot be tampered with by non-admin accounts.
7. **Supabase Auth Signup Lifecycle (`POST /auth/v1/signup`):** Tests user registration and metadata handling.

---

## 🛠️ 8. Static Site Deployment Guide

### Configuration Loading Approaches
Static frontends (e.g., GitHub Pages, Netlify, Vercel) execute in the browser and cannot access server-side `.env` files. Gramlink 360 supports three flexible approaches:
1. **Default File Configuration:** Defined in [`js/config.js`](js/config.js) under `window.GRAMLINK_CONFIG`.
2. **CI/CD Pipeline Replacement:** In your build workflow (e.g., GitHub Actions, Netlify Build), replace placeholders using `sed` or `envsubst`:
   ```bash
   sed -i "s|__SUPABASE_URL__|$VITE_SUPABASE_URL|g" js/config.js
   sed -i "s|__SUPABASE_ANON_KEY__|$VITE_SUPABASE_ANON_KEY|g" js/config.js
   ```
3. **Runtime Overrides:** Set `localStorage.setItem('GRAMLINK_SUPABASE_URL', '...')` and `localStorage.setItem('GRAMLINK_SUPABASE_ANON_KEY', '...')` for local staging overrides without modifying source files.

---

## 📋 9. Feature Checklist & Implementation Verification

| Feature Requirement | Implementation Details | Target Page & Module |
| :--- | :--- | :--- |
| **Complaint Reference Numbers** | Format: `GL-YYYY-XXXX` (e.g., `GL-2026-1042`). Unambiguous alphanumeric token with uppercase validation and quick-fill test pills. | [`pages/complaint-track.html`](pages/complaint-track.html), [`js/complaints.js`](js/complaints.js) |
| **Complaint Status History** | 4-step interactive timeline stepper backed by `complaint_status_history` PostgreSQL audit table. Shows timestamp, officer notes, and status transitions. | [`pages/complaint-track.html`](pages/complaint-track.html), [`js/complaints.js`](js/complaints.js) |
| **Category & Status Filters** | Multi-criteria dropdown filters (Water, Power, Roads, Health, Ration, Sanitation) combined with status toggles (Pending, In Progress, Resolved). | [`pages/resident-dashboard.html`](pages/resident-dashboard.html), [`pages/admin-dashboard.html`](pages/admin-dashboard.html), [`js/admin.js`](js/admin.js), [`js/resident.js`](js/resident.js) |
| **Live Database Statistics** | Dynamic KPIs calculated directly from record arrays: Total Filed, Active Count, Resolved Count, Resolution %, SLA Compliance %, and Average Resolution Time. | [`pages/village-dashboard.html`](pages/village-dashboard.html), [`js/village-dashboard.js`](js/village-dashboard.js) |
| **Real Data Charts** | Pure semantic SVG charts generated strictly from actual database record counts. No fake telemetry or fabricated sensors. | [`pages/village-dashboard.html`](pages/village-dashboard.html), [`pages/admin-dashboard.html`](pages/admin-dashboard.html) |
| **Search Functionality** | Debounced client and database query search across token, title, category, applicant name, and ward locality. | [`pages/services.html`](pages/services.html), [`pages/announcements.html`](pages/announcements.html), [`pages/admin-dashboard.html`](pages/admin-dashboard.html) |
| **Bilingual Switching** | Complete English & authentic Marathi (मराठी) dictionary switcher across all pages with zero layout breaks. | All pages via [`js/translations.js`](js/translations.js) |
| **Accessibility (WCAG AA)** | `:focus-visible` high contrast outlines, `<a class="skip-link">` skip navigation links, ARIA roles, semantic landmarks, and screen reader labels. | All HTML pages & [`css/style.css`](css/style.css) |
| **Mobile-Friendly Dashboards** | Responsive dual-view architecture: compact data tables for desktop and touch-friendly triage cards (`.mobile-card-list`) below 860px. | [`pages/admin-dashboard.html`](pages/admin-dashboard.html), [`pages/resident-dashboard.html`](pages/resident-dashboard.html) |
| **Academic Demonstration Integrity** | Clear labeling for demo records (`badge-demo`), explicit model notes on utility schedules, and no fake government API claims. | Across all public dashboards |

---

## 🎯 10. Student Viva Voce Quick Cheat Sheet

Keep these four core talking points ready for your evaluation panel:

1. **Architecture Model:**
   *"We adopted a modern Jamstack + BaaS (Backend-as-a-Service) architecture. Instead of maintaining a fragile custom Node/Express server for a static website, we connected the Vanilla JavaScript frontend directly to a cloud Supabase PostgreSQL instance via `@supabase/supabase-js v2` using only the publishable `anon` key."*

2. **Security & Row Level Security (RLS):**
   *"Security is enforced at the database kernel level, not just by disabling HTML buttons. Every table has PostgreSQL Row Level Security (RLS) enabled. An unauthenticated attacker trying to inject a complaint or modify an announcement receives an HTTP 401 with PostgreSQL Error 42501 (`violates row-level security policy`)."*

3. **Data Integrity & Realistic Governance:**
   *"We do not fabricate live sensor telemetry or fake government APIs. Every statistic and SVG chart is computed directly from actual complaint records in the database. Demonstrations use clearly labeled demo records and scheduled models."*

4. **CSBS Business Value:**
   *"This project demonstrates Business Process Re-engineering (BPR) in rural e-governance: paper complaints are converted into trackable digital SLA tickets (48-hour deadline), bringing transparency, eliminating bureaucratic leakage, and fostering citizen trust."*



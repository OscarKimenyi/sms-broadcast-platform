# ⚡ SMSPulse

> A full-stack SaaS bulk SMS broadcasting platform built for the East African market. Businesses upload contact lists, write campaigns, and deliver SMS to thousands of recipients in seconds — with real-time delivery tracking, analytics, and a pay-per-use credit system.

![Stack](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express.js-green?style=flat-square)
![Stack](https://img.shields.io/badge/Frontend-React.js%20%7C%20Vite-blue?style=flat-square)
![Database](https://img.shields.io/badge/Database-MySQL-orange?style=flat-square)
![Queue](https://img.shields.io/badge/Queue-BullMQ%20%7C%20Redis-red?style=flat-square)
![SMS](https://img.shields.io/badge/SMS%20Gateway-Africa's%20Talking-purple?style=flat-square)
![Payments](https://img.shields.io/badge/Payments-Snippe-teal?style=flat-square)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [How It Works](#how-it-works)
- [API Reference](#api-reference)
- [Payment Flow](#payment-flow)
- [SMS Delivery Flow](#sms-delivery-flow)
- [Features In Detail](#features-in-detail)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

SMSPulse is a multi-tenant SaaS platform that allows businesses in Tanzania and East Africa to send bulk SMS campaigns to their customers. It is built as a full-stack web application with a React frontend and a Node.js/Express backend, using Africa's Talking as the SMS gateway and Snippe for payment processing.

The platform handles everything from contact list management and campaign creation to asynchronous SMS delivery via job queues, real-time delivery tracking via webhooks, and credit-based billing with a full transaction ledger.

**Target users:** Shops, pharmacies, schools, churches, microfinance institutions, NGOs, and any business in Tanzania that communicates with customers via SMS.

---

## Features

### Core Platform
- 🔐 JWT-based authentication with secure password hashing (bcrypt)
- 📋 Contact list management with bulk CSV import
- 📢 Campaign creation with scheduling (send now or at a future time)
- ⚡ Asynchronous SMS delivery via BullMQ job queues
- 📊 Real-time delivery tracking (sent, delivered, failed) via DLR webhooks
- 📥 Two-way SMS inbox for receiving replies from contacts

### Messaging
- 🏷️ Custom Sender ID registration and management
- 📝 Reusable message templates
- 🔤 Message personalization with merge tags (`{{first_name}}`, `{{last_name}}`, `{{phone}}`)
- 🔁 Campaign duplication with one click
- 📤 Export delivery reports to CSV or Excel

### Billing & Payments
- 💳 Credit-based billing (1 credit = 1 SMS)
- 🛒 Credit pack purchases via Snippe (M-Pesa, Airtel, Tigo, Card)
- 📜 Full transaction ledger with history
- 🔔 Low credit email alerts with configurable threshold
- 💰 Referral system — earn 100 free credits per successful referral

### Developer Features
- 🔑 API key management — send SMS programmatically
- 🔗 Webhook support for delivery reports and inbound messages
- 🛡️ Rate limiting and input validation on all endpoints
- 🔒 Idempotency on all payment operations

### Administration
- 🛠️ Admin dashboard with platform-wide statistics
- 👥 User management with credit adjustment
- ✅ Sender ID approval workflow
- 📧 Transactional email notifications (welcome, campaign complete, low credits, payment receipt, referral bonus)

### Opt-out & Compliance
- 🚫 Automatic opt-out when contacts reply STOP/UNSUBSCRIBE/QUIT
- 📋 Contacts marked unsubscribed are excluded from all future campaigns

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js 19, Vite, React Router v6, TanStack Query v5 |
| UI | Custom CSS design system (no UI library), Lucide icons, Recharts |
| Backend | Node.js, Express.js |
| Database | MySQL 8 (mysql2 driver, connection pooling) |
| Job Queue | BullMQ + Redis 5+ |
| SMS Gateway | Africa's Talking (TZ, KE, UG, NG) |
| Payments | Snippe (M-Pesa, Airtel, Tigo, Halopesa, Card) |
| Auth | JSON Web Tokens (JWT) + bcryptjs |
| Email | Nodemailer + Gmail SMTP |
| File Export | ExcelJS (xlsx), native CSV |
| Validation | express-validator |
| Dev Tools | Nodemon, dotenv |

---

## Project Structure

```
sms-platform/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                  # MySQL connection pool
│   │   │   ├── redis.js               # Redis client (BullMQ)
│   │   │   └── snippe.js              # Snippe payment client
│   │   ├── controllers/
│   │   │   ├── auth.controller.js     # Register, login, profile, password
│   │   │   ├── campaign.controller.js # CRUD, send, duplicate, logs
│   │   │   ├── contact.controller.js  # Lists, contacts, CSV import
│   │   │   ├── billing.controller.js  # Credits, buy, verify payment
│   │   │   ├── senderid.controller.js # Sender ID management
│   │   │   ├── template.controller.js # Message templates
│   │   │   ├── apikey.controller.js   # API key management
│   │   │   ├── admin.controller.js    # Admin panel operations
│   │   │   ├── export.controller.js   # CSV/Excel export
│   │   │   └── webhook.controller.js  # AT DLR, inbound, Snippe
│   │   ├── middleware/
│   │   │   ├── auth.js                # JWT verification
│   │   │   ├── admin.js               # Admin role guard
│   │   │   └── rateLimiter.js         # Rate limiting
│   │   ├── queues/
│   │   │   └── campaign.queue.js      # BullMQ campaign queue
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── campaign.routes.js
│   │   │   ├── contact.routes.js
│   │   │   ├── billing.routes.js
│   │   │   ├── senderid.routes.js
│   │   │   ├── template.routes.js
│   │   │   ├── apikey.routes.js
│   │   │   ├── admin.routes.js
│   │   │   ├── export.routes.js
│   │   │   └── webhook.routes.js
│   │   ├── services/
│   │   │   ├── email.service.js       # Nodemailer email templates
│   │   │   └── payment.service.js     # Snippe payment abstraction
│   │   ├── workers/
│   │   │   └── sms.worker.js          # BullMQ worker (SMS sending)
│   │   └── app.js                     # Express app setup
│   ├── uploads/                        # Temp CSV upload storage
│   ├── .env                            # Environment variables
│   ├── package.json
│   └── server.js                       # Entry point
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   ├── axios.js               # Axios instance + interceptors
    │   │   ├── auth.js
    │   │   ├── campaigns.js
    │   │   ├── contacts.js
    │   │   ├── billing.js
    │   │   ├── senderIds.js
    │   │   ├── templates.js
    │   │   ├── apikeys.js
    │   │   └── admin.js
    │   ├── components/
    │   │   ├── layout/
    │   │   │   ├── Layout.jsx         # Protected route wrapper
    │   │   │   ├── Sidebar.jsx        # Navigation sidebar
    │   │   │   └── TopBar.jsx         # Top header with credit balance
    │   │   └── ui/
    │   │       ├── Button.jsx
    │   │       ├── Card.jsx
    │   │       ├── Badge.jsx
    │   │       ├── Modal.jsx
    │   │       └── Spinner.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx        # Global auth state
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Dashboard.jsx          # Stats overview
    │   │   ├── Campaigns.jsx          # Campaign list
    │   │   ├── NewCampaign.jsx        # Create campaign
    │   │   ├── CampaignDetail.jsx     # Stats + delivery logs
    │   │   ├── Contacts.jsx           # Lists + CSV import
    │   │   ├── SenderIds.jsx          # Sender ID management
    │   │   ├── Templates.jsx          # Message templates
    │   │   ├── Inbox.jsx              # 2-way SMS replies
    │   │   ├── Billing.jsx            # Credits + payment
    │   │   ├── ApiKeys.jsx            # Developer API keys
    │   │   ├── Settings.jsx           # Profile + referral
    │   │   └── Admin.jsx              # Admin panel
    │   ├── App.jsx                    # Route definitions
    │   ├── main.jsx                   # App entry point
    │   └── index.css                  # Global design system
    ├── vite.config.js
    └── package.json
```

---

## Prerequisites

Before running this project, make sure you have the following installed:

| Requirement | Version | Notes |
|---|---|---|
| Node.js | v18+ | [nodejs.org](https://nodejs.org) |
| MySQL | v8.0+ | [mysql.com](https://dev.mysql.com/downloads/) |
| Redis | v5.0+ | Windows: [tporadowski/redis](https://github.com/tporadowski/redis/releases) |
| Africa's Talking account | — | [africastalking.com](https://africastalking.com) |
| Snippe account | — | [snippe.sh](https://snippe.sh) |
| Gmail account | — | For transactional emails |

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-username/sms-platform.git
cd sms-platform
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Install frontend dependencies

```bash
cd ../frontend
npm install
```

### 4. Set up environment variables

```bash
cd ../backend
cp .env.example .env
# Edit .env with your actual values (see Environment Variables section below)
```

---

## Environment Variables

Create a `.env` file in the `backend/` directory with the following values:

```env
# ─── Server ───────────────────────────────────────────────────────────────────
PORT=5000
NODE_ENV=development

# ─── Database ─────────────────────────────────────────────────────────────────
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=sms_platform

# ─── JWT ──────────────────────────────────────────────────────────────────────
JWT_SECRET=your_super_secret_key_minimum_32_characters
JWT_EXPIRES_IN=7d

# ─── Redis ────────────────────────────────────────────────────────────────────
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# ─── Africa's Talking ─────────────────────────────────────────────────────────
# Sandbox: set AT_USERNAME=sandbox, get API key from africastalking.com/sandbox
# Production: set AT_USERNAME=your_actual_username
AT_API_KEY=your_africastalking_api_key
AT_USERNAME=sandbox

# ─── Snippe ───────────────────────────────────────────────────────────────────
# Get keys from: snippe.sh/dashboard → Settings → API Keys
SNIPPE_API_KEY=snp_test_your_api_key_here
SNIPPE_WEBHOOK_SECRET=your_webhook_signing_secret

# ─── Email (Gmail SMTP) ───────────────────────────────────────────────────────
# Generate an App Password: Google Account → Security → 2-Step Verification → App Passwords
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_gmail@gmail.com
SMTP_PASS=your_gmail_app_password
SMTP_FROM=SMSPulse <your_gmail@gmail.com>

# ─── URLs ─────────────────────────────────────────────────────────────────────
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000

# ─── App Config ───────────────────────────────────────────────────────────────
APP_NAME=SMSPulse
REFERRAL_BONUS_CREDITS=100
```

### Getting your API keys

**Africa's Talking:**
1. Sign up at [africastalking.com](https://africastalking.com)
2. Go to **Sandbox** → **Settings** → **API Key**
3. Copy the key into `AT_API_KEY`
4. Keep `AT_USERNAME=sandbox` for development

**Snippe:**
1. Sign up at [snippe.sh](https://snippe.sh) (individual/creator account — no business registration needed)
2. Go to **Dashboard → Settings → API Keys**
3. Copy the test public and secret keys
4. Go to **Settings → Webhooks** and set the webhook URL to `https://your-domain.com/api/webhooks/snippe`
5. Copy the signing secret into `SNIPPE_WEBHOOK_SECRET`

**Gmail App Password:**
1. Enable 2-Step Verification on your Google account
2. Go to **Security → App Passwords**
3. Generate a password for "Mail" on "Windows Computer"
4. Use that 16-character password as `SMTP_PASS`

---

## Database Setup

### 1. Create the database

Open MySQL and run:

```sql
CREATE DATABASE IF NOT EXISTS sms_platform;
USE sms_platform;
```

### 2. Run the full schema

Run the complete SQL schema which creates all tables:

```sql
-- Users
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  plan ENUM('free','starter','business','growth') DEFAULT 'free',
  sms_credits INT DEFAULT 50,
  stripe_customer_id VARCHAR(100) DEFAULT NULL,
  stripe_subscription_id VARCHAR(100) DEFAULT NULL,
  referral_code VARCHAR(20) UNIQUE DEFAULT NULL,
  referred_by INT DEFAULT NULL,
  email_notifications TINYINT(1) DEFAULT 1,
  low_credit_threshold INT DEFAULT 100,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Sender IDs
CREATE TABLE sender_ids (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  sender_name VARCHAR(20) NOT NULL,
  description VARCHAR(255) DEFAULT NULL,
  status ENUM('pending','approved','rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Contact Lists
CREATE TABLE contact_lists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  contact_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Contacts
CREATE TABLE contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  list_id INT NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  first_name VARCHAR(50) DEFAULT NULL,
  last_name VARCHAR(50) DEFAULT NULL,
  status ENUM('active','unsubscribed','invalid') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (list_id) REFERENCES contact_lists(id) ON DELETE CASCADE
);

-- Campaigns
CREATE TABLE campaigns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  sender_id INT DEFAULT NULL,
  list_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  message_body TEXT NOT NULL,
  status ENUM('draft','queued','sending','sent','failed') DEFAULT 'draft',
  total_recipients INT DEFAULT 0,
  sent_count INT DEFAULT 0,
  delivered_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  scheduled_at TIMESTAMP NULL DEFAULT NULL,
  sent_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (list_id) REFERENCES contact_lists(id),
  FOREIGN KEY (sender_id) REFERENCES sender_ids(id) ON DELETE SET NULL
);

-- SMS Logs
CREATE TABLE sms_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campaign_id INT NOT NULL,
  contact_id INT DEFAULT NULL,
  phone_number VARCHAR(20) NOT NULL,
  status ENUM('pending','sent','delivered','failed') DEFAULT 'pending',
  gateway_message_id VARCHAR(100) DEFAULT NULL,
  sent_at TIMESTAMP NULL DEFAULT NULL,
  delivered_at TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
  INDEX idx_campaign_status (campaign_id, status),
  INDEX idx_gateway_msg (gateway_message_id)
);

-- Inbound Messages
CREATE TABLE inbound_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT DEFAULT NULL,
  from_number VARCHAR(20) NOT NULL,
  to_sender_id VARCHAR(20) NOT NULL,
  message_body TEXT NOT NULL,
  is_read TINYINT(1) DEFAULT 0,
  received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Credit Transactions
CREATE TABLE credit_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  credits_change INT NOT NULL,
  type ENUM('topup','spend','refund','subscription_grant','pending','failed') NOT NULL,
  reference VARCHAR(150) DEFAULT NULL,
  description VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Message Templates
CREATE TABLE templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tags
CREATE TABLE tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(50) NOT NULL,
  color VARCHAR(7) DEFAULT '#00e676',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_tag (user_id, name)
);

CREATE TABLE contact_tags (
  contact_id INT NOT NULL,
  tag_id INT NOT NULL,
  PRIMARY KEY (contact_id, tag_id),
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- API Keys
CREATE TABLE api_keys (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  key_hash VARCHAR(255) NOT NULL,
  key_prefix VARCHAR(10) NOT NULL,
  last_used_at TIMESTAMP NULL DEFAULT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_api_keys_hash (key_hash)
);

-- Referrals
CREATE TABLE referrals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  referrer_id INT NOT NULL,
  referred_id INT NOT NULL,
  referral_code VARCHAR(20) NOT NULL,
  bonus_credited TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (referred_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_referrals_code (referral_code)
);

-- Subscriptions
CREATE TABLE subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  plan ENUM('starter','business','growth') NOT NULL,
  status ENUM('active','cancelled','expired') DEFAULT 'active',
  snippe_subscription_id VARCHAR(100) DEFAULT NULL,
  credits_per_month INT NOT NULL,
  amount INT NOT NULL,
  current_period_start TIMESTAMP NULL,
  current_period_end TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Email Logs
CREATE TABLE email_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  status ENUM('sent','failed') DEFAULT 'sent',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## Running the Application

You need **three terminal windows** running simultaneously.

### Terminal 1 — Redis server

```bash
# Windows (if not running as a service)
redis-server

# Linux/macOS
redis-server

# Verify it's running
redis-cli ping
# Expected: PONG
```

### Terminal 2 — Backend API server

```bash
cd sms-platform/backend
npm run dev
```

Expected output:
```
Redis connected
MySQL connected
Server running on http://localhost:5000
```

### Terminal 3 — SMS worker

```bash
cd sms-platform/backend
npm run worker
```

Expected output:
```
SMS Worker running...
Redis connected
```

### Terminal 4 — Frontend

```bash
cd sms-platform/frontend
npm run dev
```

Open your browser at **http://localhost:3000**

---

## How It Works

### The core loop

```
1. Business registers → gets 50 free SMS credits
2. Uploads contact list (CSV with phone numbers)
3. Creates a campaign (message + contact list + optional sender ID)
4. Clicks "Send" → credits are checked → job pushed to BullMQ queue
5. SMS worker picks up the job → sends batches to Africa's Talking
6. Africa's Talking delivers SMS to Vodacom/Airtel/Tigo subscribers
7. Delivery reports (DLR) come back via webhook → dashboard updates
8. Business sees delivered/failed counts in real time
```

### Credit system

- Every new account starts with **50 free credits**
- 1 credit = 1 SMS delivered to 1 contact
- Credits are deducted **upfront** when a campaign is sent
- If some messages fail, the sent count reflects actual usage
- Credits can be topped up via the Billing page (Snippe checkout)
- Full transaction history is maintained in `credit_transactions` table

### Message personalization

Templates and campaign messages support merge tags:

```
Hi {{first_name}}, your loan payment of TZS 50,000 is due tomorrow.
```

The worker replaces merge tags per contact before sending. If a contact has no first name, it defaults to "Customer".

### Opt-out handling

When a contact replies **STOP**, **UNSUBSCRIBE**, **QUIT**, **CANCEL**, or **END** to any SMS, the platform:
1. Receives the inbound message via Africa's Talking webhook
2. Marks the contact as `unsubscribed` in the database
3. Excludes them from all future campaign sends automatically

---

## API Reference

All API endpoints are prefixed with `/api`. Protected routes require the header:
```
Authorization: Bearer <your_jwt_token>
```

### Authentication

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/auth/register` | Create a new account | ❌ |
| POST | `/auth/login` | Login and get JWT token | ❌ |
| GET | `/auth/me` | Get current user profile | ✅ |
| PUT | `/auth/profile` | Update name, email, preferences | ✅ |
| PUT | `/auth/password` | Change password | ✅ |

### Campaigns

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/campaigns` | List all campaigns | ✅ |
| POST | `/campaigns` | Create a campaign | ✅ |
| GET | `/campaigns/:id` | Get campaign details | ✅ |
| POST | `/campaigns/:id/send` | Queue campaign for sending | ✅ |
| POST | `/campaigns/:id/duplicate` | Duplicate a campaign | ✅ |
| GET | `/campaigns/:id/logs` | Get delivery logs (paginated) | ✅ |
| DELETE | `/campaigns/:id` | Delete a campaign | ✅ |

### Contacts

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/contacts/lists` | Get all contact lists | ✅ |
| POST | `/contacts/lists` | Create a contact list | ✅ |
| DELETE | `/contacts/lists/:id` | Delete a list and all contacts | ✅ |
| GET | `/contacts/lists/:listId/contacts` | Get contacts in a list | ✅ |
| POST | `/contacts/lists/:listId/import` | Import CSV file | ✅ |

**CSV format for contact import:**
```csv
phone_number,first_name,last_name
+255712345678,John,Doe
+255787654321,Jane,Smith
```

### Sender IDs

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/sender-ids` | Get all sender IDs | ✅ |
| POST | `/sender-ids` | Register a new sender ID | ✅ |
| DELETE | `/sender-ids/:id` | Delete a sender ID | ✅ |

### Templates

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/templates` | Get all templates | ✅ |
| POST | `/templates` | Create a template | ✅ |
| PUT | `/templates/:id` | Update a template | ✅ |
| DELETE | `/templates/:id` | Delete a template | ✅ |

### Billing

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/billing/balance` | Get credit balance + history | ✅ |
| GET | `/billing/packs` | Get available credit packs | ✅ |
| POST | `/billing/buy` | Initiate Snippe checkout | ✅ |
| POST | `/billing/verify` | Verify payment after redirect | ✅ |

### API Keys

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api-keys` | List all API keys | ✅ |
| POST | `/api-keys` | Create a new API key | ✅ |
| PATCH | `/api-keys/:id/revoke` | Revoke an API key | ✅ |
| DELETE | `/api-keys/:id` | Delete an API key | ✅ |

### Export

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/export/campaigns/:id?format=csv` | Export delivery report as CSV | ✅ |
| GET | `/export/campaigns/:id?format=excel` | Export delivery report as Excel | ✅ |
| GET | `/export/contacts/:listId` | Export contact list as CSV | ✅ |

### Admin (user ID = 1 only)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/admin/stats` | Platform-wide statistics | ✅ Admin |
| GET | `/admin/users` | List all users | ✅ Admin |
| POST | `/admin/credits` | Manually adjust user credits | ✅ Admin |
| GET | `/admin/sender-ids/pending` | Get pending sender ID approvals | ✅ Admin |
| PATCH | `/admin/sender-ids/:id/approve` | Approve a sender ID | ✅ Admin |
| PATCH | `/admin/sender-ids/:id/reject` | Reject a sender ID | ✅ Admin |

### Webhooks (public — no auth)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/webhooks/snippe` | Snippe payment webhook |
| POST | `/api/webhooks/dlr` | Africa's Talking delivery report |
| POST | `/api/webhooks/inbound` | Africa's Talking inbound SMS |

---

## Payment Flow

```
User selects credit pack
        ↓
POST /api/billing/buy
Backend creates Snippe session → returns checkout URL
Backend saves pending credit_transaction
        ↓
Frontend redirects to Snippe hosted checkout page
User pays via M-Pesa / Airtel / Tigo / Card
        ↓
Snippe redirects back to /billing/verify?session_reference=sess_xxx
Frontend calls POST /api/billing/verify
Backend retrieves session from Snippe API
If status === "completed" → credits added to user account
        ↓
ALSO: Snippe fires webhook to POST /api/webhooks/snippe
Backend verifies HMAC-SHA256 signature
Idempotency check → if already credited, skip
Otherwise credit user (safety net in case redirect failed)
```

### Credit packs

| Pack | Credits | Price (TZS) |
|---|---|---|
| pack_1000 | 1,000 SMS | 5,000 |
| pack_5000 | 5,000 SMS | 20,000 |
| pack_10000 | 10,000 SMS | 35,000 |

---

## SMS Delivery Flow

```
Campaign queued (status: "queued")
        ↓
BullMQ job created with optional delay for scheduled campaigns
        ↓
SMS Worker picks up job
Fetches all active contacts in the list
        ↓
Checks for merge tags in message body
  If merge tags present → sends individually (personalized)
  If no merge tags → sends in batches of 100
        ↓
Each batch sent to Africa's Talking API
AT returns messageId per recipient
SMS logs inserted (status: "sent" or "failed")
        ↓
Campaign counts updated after each batch
Credits deducted from user balance
Transaction recorded in credit_transactions
        ↓
Campaign status → "sent"
Completion email sent to user
Low credit alert sent if balance below threshold
        ↓
Africa's Talking fires DLR webhook per delivered/failed message
POST /api/webhooks/dlr updates sms_logs status
Campaign delivered_count / failed_count incremented
```

---

## Features In Detail

### Sender ID Registration

Sender IDs are the name that appears instead of a phone number on the recipient's phone. For example, "SHOPWANZA" or "MWANZABANK".

- Maximum 11 characters, alphanumeric only
- Must be approved by Africa's Talking (typically 1–3 business days)
- Platform admin can approve/reject via the admin dashboard
- Only approved sender IDs can be selected when creating campaigns

### Message Templates

Save frequently used messages as templates to speed up campaign creation. Templates support the same merge tags as regular campaigns and can be applied with one click in the campaign creation form.

### Referral System

Each user gets a unique referral code on registration. Share the referral link:
```
https://your-domain.com/register?ref=YOURCODE
```
When the referred user makes their first payment, **both users receive 100 free SMS credits automatically**.

### API Access

Developers can generate API keys to integrate SMS sending into their own applications. API keys are hashed with bcrypt before storage — the raw key is shown only once at creation. Usage is tracked via `last_used_at` timestamp.

---

## Deployment

### Backend (e.g. Railway, Render, VPS)

1. Set all environment variables in your hosting platform
2. Change `AT_USERNAME` from `sandbox` to your production Africa's Talking username
3. Change `SNIPPE_API_KEY` to your live Snippe key
4. Update `FRONTEND_URL` and `BACKEND_URL` to your production domains
5. Run database migrations on your production MySQL instance
6. Start the API server: `npm start`
7. Start the worker in a separate process: `npm run worker`

### Frontend (e.g. Vercel, Netlify)

1. Set `VITE_API_URL` to your production backend URL if you use it in axios config
2. Update `vite.config.js` proxy for production (or remove it and use the full URL)
3. Run `npm run build` → deploy the `dist/` folder

### Redis in production

Use a managed Redis service:
- [Railway Redis](https://railway.app)
- [Upstash](https://upstash.com) — free tier available
- [Redis Cloud](https://redis.com/redis-enterprise-cloud/)

Update `REDIS_HOST` and `REDIS_PORT` accordingly. Upstash also requires `REDIS_PASSWORD` — add it to the Redis config in `src/config/redis.js`.

### Webhooks in production

Register your production URLs in both dashboards:

**Africa's Talking:**
- Delivery reports (DLR): `https://your-api.com/api/webhooks/dlr`
- Inbound messages: `https://your-api.com/api/webhooks/inbound`

**Snippe:**
- Payment webhook: `https://your-api.com/api/webhooks/snippe`

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

## License

This project is licensed under the MIT License.

```
MIT License

Copyright (c) 2026 Oscar Festo Kimenyi

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## Contact

**Oscar Festo Kimenyi** — Software Engineer, Mwanza, Tanzania

- GitHub: [@OscarKimenyi](https://github.com/OscarKimenyi)
- Project: [github.com/OscarKimenyi/sms-platform](https://github.com/OscarKimenyi/sms-platform)

---

*Built with ❤️ in Tanzania 🇹🇿*
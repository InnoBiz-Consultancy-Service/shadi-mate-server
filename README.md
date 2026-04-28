# 💍 ShadiMate — Backend API

A production-ready matrimony platform backend built with **Node.js**, **Express**, **TypeScript**, **MongoDB**, **Redis**, and **Socket.IO**.

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express.js |
| Database | MongoDB (Mongoose ODM) |
| Cache / Session | Redis (node-redis v4) |
| Real-time | Socket.IO |
| Auth | JWT (Access + Refresh Tokens) + Redis blacklist |
| Payment | EPS Payment Gateway |
| Email | Nodemailer (SMTP) |
| Rate Limiting | express-rate-limit + rate-limit-redis |
| Task Scheduler | node-cron |

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18
- MongoDB (local or Atlas)
- Redis (local or Upstash)

### Installation

```bash
# 1. Clone the repository
git clone <repo-url>
cd shadi-mate-server

# 2. Install dependencies
npm install

# 3. Install rate limiting packages
npm install express-rate-limit rate-limit-redis
```

### Environment Variables

Create a `.env` file in the root:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
DB_URL=mongodb://localhost:27017/shadiMate

# JWT
JWT_SECRET=your_jwt_secret_key_minimum_32_chars
JWT_EXPIRES_IN=2d

# Redis
REDIS_URL=redis://localhost:6379

# CORS / URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000/api/v1

# Super Admin Seed
SUPER_ADMIN_EMAIL=admin@shadiMate.com
SUPER_ADMIN_PASSWORD=your_strong_admin_password

# EPS Payment Gateway (Sandbox)
EPS_HASH_KEY=your_eps_hash_key
EPS_USERNAME=your_eps_username
EPS_PASSWORD=your_eps_password
EPS_STORE_ID=your_store_id
EPS_MERCHANT_ID=your_merchant_id

# SMTP (Email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Bcrypt
BCRYPT_SALT_ROUND=12
```

### Run

```bash
# Development (hot reload)
npm run dev

# Production build
npm run build
npm start
```

---

## 🏗️ Project Structure

```
src/
├── app.ts                          # Express app setup (trust proxy, global limiter)
├── server.ts                       # Server start, DB connect, seeders, cron
├── app/
│   ├── modules/
│   │   ├── user/                   # Auth (register, login, OTP, JWT)
│   │   ├── profile/                # Profile CRUD + search/filter
│   │   ├── chat/                   # Conversation list + message history
│   │   ├── like/                   # Like / unlike with Redis cache
│   │   ├── block/                  # Block / unblock users
│   │   ├── ignore/                 # Ignore + ignored messages
│   │   ├── notification/           # Push + DB notifications
│   │   ├── report/                 # User reporting system
│   │   ├── subscription/           # EPS payment + premium plans
│   │   ├── album/                  # Photo album (max 10 photos)
│   │   ├── dreamPartner/           # Match preference + suggestions
│   │   ├── profileVisit/           # Profile visit tracking
│   │   ├── personalityQuestion/    # Personality test
│   │   └── geo/                    # Bangladesh divisions/districts/thanas
│   └── routes/
│       └── index.ts                # All module routes registered here
├── middleWares/
│   ├── auth.middleware.ts          # JWT verify + Redis cache + guards
│   ├── rateLimiter.ts              # All rate limiters (12 limiters)
│   ├── globalErrorHandler.ts       # Centralized error handling
│   ├── notFound.ts                 # 404 handler
│   └── validateRequest.ts          # Zod schema validation
├── socket/
│   ├── index.ts                    # Socket.IO init + pending notifications
│   └── handlers/
│       ├── chat.handlers.ts        # send-message, message delivery
│       ├── presence.handlers.ts    # online/offline status
│       ├── typing.handlers.ts      # typing indicators
│       ├── seen.handlers.ts        # message seen status
│       └── socketSingleton.ts      # Global io instance
├── utils/
│   ├── redis.ts                    # Redis client + helpers
│   ├── token.utils.ts              # JWT sign/verify + refresh token (Redis)
│   ├── profileQueryBuilder.ts      # MongoDB aggregation builder
│   ├── subscriptioncron.ts         # Daily expiry + reminder cron jobs
│   ├── epsHelper.ts                # EPS payment gateway helpers
│   ├── currency.ts                 # IP → country → currency detection
│   ├── mailer.ts                   # Match notification emails
│   ├── catchAsync.ts               # Async error wrapper
│   └── sendResponse.ts             # Standardized API response
├── seeders/
│   ├── seedSuperAdmin.ts           # Super admin seed
│   ├── seedGeoData.ts              # Bangladesh geo data seed
│   └── seedPersonalityQuestions.ts # Personality test questions seed
├── helpers/
│   └── AppError.ts                 # Custom error class
└── config/
    └── envConfig.ts                # Environment variable loader + validator
```

---

## 🛡️ Rate Limiting Architecture

All routes are protected by a **two-layer Redis-backed distributed rate limiting** system. If Redis is unavailable, the system gracefully falls back to in-memory limiting with a console warning.

### How the layers work

```
Incoming Request
      │
      ▼
┌─────────────────────────┐
│  Layer 1: Global Limiter │  ← IP-based, 500 req/15min
│  (app.ts — all routes)   │  ← Blocks scrapers + unknown clients
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  Layer 2: Route Limiter  │  ← userId or IP-based, per-feature
│  (specific routes)       │  ← Fine-grained control
└─────────────────────────┘
```

**Auth routes additionally have:**
```
Burst Limiter (20 req/sec) → then → Specific Limiter (window-based)
```

### Rate Limit Table

| Limiter | Applied To | Limit | Window | Key |
|---|---|---|---|---|
| **globalLimiter** | All routes (app.ts) | 500 req | 15 min | IP |
| **burstLimiter** | Auth routes only | 20 req | 1 sec | IP |
| **registerLimiter** | `POST /auth` | 5 req | 15 min | IP |
| **loginLimiter** | `POST /auth/login` | 5 req | 15 min | IP |
| **otpLimiter** | verify-otp, resend-otp, verify-reset-otp | 5 req | 10 min | IP + phone |
| **forgotPasswordLimiter** | `POST /auth/forgot-password` | 5 req | 1 hour | IP |
| **userLimiter** | Profile create/update | 200 req | 15 min | userId |
| **profileSearchLimiter** | `GET /profile` | 60 req | 1 min | userId |
| **likeLimiter** | `POST /likes/:userId` | 30 req | 1 min | userId |
| **paymentLimiter** | `POST /subscriptions/initiate` | 10 req | 1 hour | userId |
| **reportLimiter** | `POST /report/:userId` | 5 req | 1 hour | userId |
| **albumLimiter** | Album add/update/delete | 20 req | 15 min | userId |

### Rate Limit Response (HTTP 429)

```json
{
  "success": false,
  "statusCode": 429,
  "message": "Too many login attempts. Please wait 15 minutes before trying again."
}
```

### Response Headers (automatically added)

```
RateLimit-Limit: 5
RateLimit-Remaining: 3
RateLimit-Reset: 1714320000
```

### Redis Key Pattern

```
rl:global:<IP>
rl:login:<IP>
rl:otp:<IP>:<phone>
rl:user:<userId>
rl:payment:<userId>
```

---

## 📡 API Reference

Base URL: `http://localhost:5000/api/v1`

---

### 🔐 Auth — `/api/v1/auth`

| Method | Endpoint | Auth Required | Rate Limit | Description |
|---|---|---|---|---|
| POST | `/` | ❌ | burst + register | Register new user |
| POST | `/verify-otp` | ❌ | burst + otp | Verify phone OTP |
| POST | `/login` | ❌ | burst + login | Login with phone/email |
| POST | `/resend-otp` | ❌ | burst + otp | Resend OTP |
| POST | `/forgot-password` | ❌ | burst + forgotPassword | Send reset OTP |
| POST | `/verify-reset-otp` | ❌ | burst + otp | Reset password with OTP |
| POST | `/refresh` | ❌ | global | Refresh access token |
| GET | `/me` | ✅ | global | Get my user data |
| PATCH | `/` | ✅ | global | Update user info |
| POST | `/reset-password` | ✅ | global | Change password |
| PATCH | `/delete-profile/:id` | ✅ | global | Soft delete account |
| PATCH | `/block-user/:id` | ✅ Admin | global | Block/unblock user |

---

### 👤 Profile — `/api/v1/profile`

| Method | Endpoint | Auth | Rate Limit | Description |
|---|---|---|---|---|
| POST | `/` | ✅ | userLimiter | Create profile |
| PATCH | `/` | ✅ | userLimiter | Update profile |
| GET | `/` | ✅ | profileSearch | Browse/search profiles |
| GET | `/my` | ✅ | global | Get my profile |
| GET | `/:userId` | ✅ | global | Get profile by userId |

---

### 💬 Chat — `/api/v1/chat`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/conversations` | ✅ | All conversations |
| GET | `/:userId` | ✅ | Chat history with a user |

> **Note:** Real-time messaging is via Socket.IO (premium users only).

---

### 🔔 Notifications — `/api/v1/notifications`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | ✅ | My notifications (paginated) |
| GET | `/unread-count` | ✅ | Unread count |
| PATCH | `/mark-all-read` | ✅ | Mark all as read |
| PATCH | `/:id/read` | ✅ | Mark single as read |
| DELETE | `/:id` | ✅ | Delete notification |

---

### ❤️ Likes — `/api/v1/likes`

| Method | Endpoint | Auth | Rate Limit | Description |
|---|---|---|---|---|
| POST | `/:userId` | ✅ | likeLimiter | Like / unlike profile |
| GET | `/count/:userId` | ✅ | global | Like count |
| GET | `/who-liked-me` | ✅ Premium | global | Who liked me |
| GET | `/my-likes` | ✅ | global | Profiles I liked |

---

### 🚫 Block — `/api/v1/block`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/:userId` | ✅ | Toggle block/unblock |
| GET | `/` | ✅ | My block list |
| GET | `/status/:userId` | ✅ | Block status |

---

### 🙈 Ignore — `/api/v1/ignore`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/:userId` | ✅ | Toggle ignore |
| GET | `/` | ✅ | My ignore list |
| GET | `/status/:userId` | ✅ | Ignore status |
| GET | `/conversations` | ✅ | Ignored conversation list |
| GET | `/messages/:senderId` | ✅ | Ignored messages from sender |
| DELETE | `/messages/:senderId` | ✅ | Delete ignored messages |

---

### 🚨 Report — `/api/v1/report`

| Method | Endpoint | Auth | Rate Limit | Description |
|---|---|---|---|---|
| POST | `/:userId` | ✅ | reportLimiter | Submit report |
| GET | `/my` | ✅ | global | My submitted reports |
| GET | `/` | ✅ Admin | global | All reports |
| PATCH | `/:id/status` | ✅ Admin | global | Update report status |

---

### 💳 Subscription — `/api/v1/subscriptions`

| Method | Endpoint | Auth | Rate Limit | Description |
|---|---|---|---|---|
| GET | `/plans` | ❌ | global | Available plans |
| GET | `/currency` | ❌ | global | Detected currency by IP |
| POST | `/initiate` | ✅ | paymentLimiter | Start payment |
| GET | `/my` | ✅ | global | Active subscription |
| GET | `/history` | ✅ | global | Payment history |
| POST/GET | `/payment/success` | ❌ | none | EPS callback |
| POST/GET | `/payment/fail` | ❌ | none | EPS callback |
| POST/GET | `/payment/cancel` | ❌ | none | EPS callback |

---

### 📸 Album — `/api/v1/album`

| Method | Endpoint | Auth | Rate Limit | Description |
|---|---|---|---|---|
| POST | `/add` | ✅ | albumLimiter | Add photo(s) (max 10) |
| GET | `/` | ✅ | global | My album |
| GET | `/:userId` | ✅ | global | User's album |
| PATCH | `/:photoId` | ✅ | albumLimiter | Update photo |
| DELETE | `/delete/:photoId` | ✅ | albumLimiter | Delete photo |

---

### 🌍 Geo — `/api/v1/geo`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/universities` | ❌ | All universities (filter: type, search) |
| GET | `/divisions` | ❌ | All divisions |
| GET | `/divisions/:divisionId/districts` | ❌ | Districts under a division |
| GET | `/districts/:districtId/thanas` | ❌ | Thanas under a district |

---

### 🧠 Personality Test — `/api/v1/personality-test`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/questions` | ❌ | All 15 questions |
| POST | `/submit` | ❌ | Submit test, get result |
| GET | `/:id` | ❌ | Get single result |
| PATCH | `/:id` | ❌ | Update guest profile (add email) |

---

### 💞 Dream Partner — `/api/v1/dream-partner`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/` | ✅ | Save match preferences |
| GET | `/` | ✅ | Get matched profiles |

---

### 👁️ Profile Visits — `/api/v1/profile-visits`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | ✅ Premium | Who visited my profile |
| GET | `/count` | ✅ | Total visit count |

---

## 🔌 Socket.IO Events

Connect with token:
```js
const socket = io("http://localhost:5000", {
  query: { token: "Bearer <accessToken>" }
});
```

### Emit (Client → Server)

| Event | Payload | Description |
|---|---|---|
| `send-message` | `{ receiverId, message, type }` | Send message (Premium only) |
| `typing` | `{ toUserId }` | Typing indicator |
| `stop-typing` | `{ toUserId }` | Stop typing |
| `seen` | `{ messageId }` | Mark message as seen |

### Listen (Server → Client)

| Event | Payload | Description |
|---|---|---|
| `receive-message` | message object | New incoming message |
| `message-sent` | message object | Confirmation of sent message |
| `message-seen` | `{ messageId, conversationWith }` | Message read receipt |
| `typing` | `{ fromUserId }` | Someone is typing |
| `stop-typing` | `{ fromUserId }` | Stopped typing |
| `user-online` | userId | User came online |
| `user-offline` | `{ userId, lastSeen }` | User went offline |
| `online-users` | userId[] | Currently online users |
| `new-notification` | notification object | Real-time notification |
| `pending-notifications` | notification[] | Unread notifications on connect |

---

## ⚙️ Subscription Plans

| Plan | Duration | Price (BDT) |
|---|---|---|
| 1 Month | 30 days | ৳299 |
| 3 Months | 90 days | ৳799 |
| 6 Months | 180 days | ৳1,499 |

> International users see approximate GBP prices. Actual charge is in BDT via EPS gateway.

---

## ⏰ Cron Jobs

| Job | Schedule | Description |
|---|---|---|
| Subscription Expiry | Daily 00:01 | Marks expired subscriptions, resets users to `free` |
| Expiry Reminder | Daily 10:00 | Notifies users with 1–2 days left |

---

## 🔑 Auth Flow

```
Register → OTP verify → Account created + Access Token issued
Login → Password check → Access Token + Refresh Token
Refresh → POST /auth/refresh with userId + refreshToken → New tokens
Logout → Access token blacklisted in Redis + Refresh token revoked
```

**Token Storage (Redis):**
```
refresh:<userId>     → refresh token (30 days TTL)
blacklist:<jti>      → blacklisted access token (TTL = remaining expiry)
user:<userId>        → cached user data (5 min TTL)
```

---

## 📝 Future TODOs

- [ ] Payment idempotency key (prevent double-click duplicate payments)
- [ ] EPS production URL switch (currently sandbox)
- [ ] Image upload via Cloudinary / S3 (currently URL-based)
- [ ] Admin dashboard endpoints
- [ ] SMS OTP integration (currently returns OTP in response — dev only)

---

## 📄 License

MIT
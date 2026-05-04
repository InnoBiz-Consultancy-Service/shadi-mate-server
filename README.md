# ShadiMate Server

A matrimony platform backend built with Node.js, Express, MongoDB, Redis, and Socket.IO.

---

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose)
- **Cache:** Redis
- **Real-time:** Socket.IO
- **Auth:** JWT (Access + Refresh Token)
- **Payment:** EPS Payment Gateway
- **Email:** Nodemailer
- **Validation:** Zod
- **Rate Limiting:** express-rate-limit + Redis Store

---

## Project Structure

```
src/
├── app/
│   ├── modules/
│   │   ├── user/           # Auth, register, login, OTP
│   │   ├── profile/        # Profile CRUD, search, filter
│   │   ├── chat/           # Conversation list, message history
│   │   ├── like/           # Like / unlike profiles
│   │   ├── block/          # Block / unblock users
│   │   ├── ignore/         # Ignore users + ignored messages
│   │   ├── report/         # Report users
│   │   ├── notification/   # Push notifications
│   │   ├── subscription/   # Premium plans + EPS payment
│   │   ├── album/          # Photo album
│   │   ├── dreamPartner/   # Dream partner matching
│   │   ├── personalityQuestion/ # Personality test
│   │   ├── profileVisit/   # Profile visit tracking
│   │   ├── geo/            # Divisions, Districts, Thanas, Universities
│   │   └── email/          # Admin email campaigns
│   └── routes/
│       └── index.ts        # All routes registered here
├── config/
│   └── envConfig.ts        # Environment variables
├── middleWares/
│   ├── auth.middleware.ts  # JWT + Redis cache auth
│   ├── rateLimiter.ts      # All rate limiters
│   ├── globalErrorHandler.ts
│   ├── notFound.ts
│   └── validateRequest.ts  # Zod validation
├── socket/
│   ├── index.ts            # Socket.IO init
│   └── handlers/
│       ├── chat.handlers.ts
│       ├── presence.handlers.ts
│       ├── seen.handlers.ts
│       └── typing.handlers.ts
├── seeders/
│   ├── seedSuperAdmin.ts
│   ├── seedGeoData.ts
│   └── seedPersonalityQuestions.ts
├── utils/
│   ├── redis.ts
│   ├── token.utils.ts
│   ├── ensureIndexes.ts    # MongoDB indexes
│   ├── profileQueryBuilder.ts
│   ├── currency.ts         # BDT/GBP conversion
│   ├── epsHelper.ts        # EPS payment helper
│   ├── mailer.ts           # Email sender
│   ├── catchAsync.ts
│   └── sendResponse.ts
├── app.ts                  # Express app setup
└── server.ts               # Server entry point
```

---

## Environment Variables

Create a `.env` file in the root:

```env
PORT=5000
NODE_ENV=development

# MongoDB
DB_URL=mongodb+srv://username:password@cluster.mongodb.net/shadiMateDB

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=2d

# Redis
REDIS_URL=redis://localhost:6379

# Admin
SUPER_ADMIN_EMAIL=admin@shadimate.com
SUPER_ADMIN_PASSWORD=Admin@123456
BCRYPT_SALT_ROUND=12

# URLs
FRONTEND_URL=https://shadimate-client.vercel.app
BACKEND_URL=https://your-server.onrender.com/api/v1

# EPS Payment Gateway
EPS_HASH_KEY=your_eps_hash_key
EPS_PASSWORD=your_eps_password
EPS_USERNAME=your_eps_username
EPS_STORE_ID=your_store_id
EPS_MERCHANT_ID=your_merchant_id

# SMTP Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

---

## Installation

```bash
# Clone the repo
git clone https://github.com/your-username/shadi-mate-server.git
cd shadi-mate-server

# Install dependencies
npm install

# Install compression (if not already installed)
npm install compression
npm install -D @types/compression

# Run in development
npm run dev

# Build
npm run build

# Run production
npm start
```

---

## API Endpoints

Base URL: `https://your-server.onrender.com/api/v1`

### Auth — `/api/v1/auth`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Register (sends OTP) | ❌ |
| POST | `/verify-otp` | Verify OTP + create account | ❌ |
| POST | `/login` | Login | ❌ |
| POST | `/resend-otp` | Resend registration OTP | ❌ |
| POST | `/forgot-password` | Send reset OTP | ❌ |
| POST | `/verify-reset-otp` | Verify OTP + reset password | ❌ |
| POST | `/refresh` | Refresh access token | ❌ |
| GET | `/me` | Get current user | ✅ |
| PATCH | `/` | Update user name/avatar | ✅ |
| POST | `/reset-password` | Change password | ✅ |
| PATCH | `/delete-profile/:id` | Soft delete account | ✅ |
| PATCH | `/block-user/:id` | Block/unblock user (admin) | ✅ Admin |

### Profile — `/api/v1/profile`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Create profile | ✅ |
| PATCH | `/` | Update profile | ✅ |
| GET | `/` | Browse profiles (search + filter) | ✅ |
| GET | `/my` | Get my profile + completion % | ✅ |
| GET | `/:userId` | Get profile by user ID | ✅ |

**Query filters for GET `/`:**
`search`, `division`, `district`, `thana`, `faith`, `practiceLevel`, `personality`, `habits`, `minAge`, `maxAge`, `minHeight`, `maxHeight`, `educationVariety`, `page`, `limit`

### Chat — `/api/v1/chat`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/conversations` | Get all conversations | ✅ |
| GET | `/:userId` | Get chat history with a user | ✅ |

**Socket.IO Events:**

| Event (emit) | Payload | Description |
|---|---|---|
| `send-message` | `{ receiverId, message, type }` | Send a message (premium only) |
| `typing` | `{ toUserId }` | Typing indicator |
| `stop-typing` | `{ toUserId }` | Stop typing |
| `seen` | `{ messageId }` | Mark message as seen |

| Event (on) | Description |
|---|---|
| `receive-message` | New message received |
| `message-sent` | Message delivery confirmation |
| `message-seen` | Message seen by receiver |
| `new-notification` | Real-time notification |
| `user-online` | User came online |
| `user-offline` | User went offline |
| `online-users` | List of current online users |

### Likes — `/api/v1/likes`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/:userId` | Toggle like / unlike | ✅ |
| GET | `/count/:userId` | Get like count | ✅ |
| GET | `/my-likes` | Profiles I liked | ✅ |
| GET | `/who-liked-me` | Who liked me (Premium only) | ✅ Premium |

### Notifications — `/api/v1/notifications`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | Get my notifications | ✅ |
| GET | `/unread-count` | Get unread count | ✅ |
| PATCH | `/mark-all-read` | Mark all as read | ✅ |
| PATCH | `/:id/read` | Mark one as read | ✅ |
| DELETE | `/:id` | Delete notification | ✅ |

### Subscriptions — `/api/v1/subscriptions`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/plans` | Get subscription plans | ❌ |
| GET | `/currency` | Detect user currency | ❌ |
| POST | `/initiate` | Start payment | ✅ |
| GET | `/my` | My active subscription | ✅ |
| GET | `/history` | Payment history | ✅ |

**Plans:**
- `1month` — ৳299
- `3month` — ৳799
- `6month` — ৳1499

### Album — `/api/v1/album`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/add` | Add photo | ✅ |
| GET | `/` | Get my album | ✅ |
| GET | `/:userId` | Get user album | ✅ |
| PATCH | `/:photoId` | Update photo caption | ✅ |
| DELETE | `/delete/:photoId` | Delete photo | ✅ |

### Block — `/api/v1/block`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/:userId` | Toggle block/unblock | ✅ |
| GET | `/` | My block list | ✅ |
| GET | `/status/:userId` | Check block status | ✅ |

### Ignore — `/api/v1/ignore`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/:userId` | Toggle ignore | ✅ |
| GET | `/` | My ignore list | ✅ |
| GET | `/status/:userId` | Check ignore status | ✅ |
| GET | `/conversations` | Ignored conversation list | ✅ |
| GET | `/messages/:senderId` | Ignored messages from a user | ✅ |
| DELETE | `/messages/:senderId` | Delete ignored messages | ✅ |

### Report — `/api/v1/report`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/:userId` | Submit report | ✅ |
| GET | `/my` | My submitted reports | ✅ |
| GET | `/` | All reports (admin) | ✅ Admin |
| PATCH | `/:id/status` | Update report status (admin) | ✅ Admin |

### Profile Visits — `/api/v1/profile-visits`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/count` | My visit count | ✅ |
| GET | `/` | Who visited me (Premium only) | ✅ Premium |

### Dream Partner — `/api/v1/dream-partner`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Save preferences | ✅ |
| GET | `/` | Get matched profiles | ✅ |

### Personality Test — `/api/v1/personality-test`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/questions` | Get all questions | ❌ |
| POST | `/submit` | Submit answers | ❌ |
| GET | `/:id` | Get result by ID | ❌ |
| PATCH | `/:id` | Add name/email to result | ❌ |

### Geo — `/api/v1/geo`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/divisions` | All divisions | ❌ |
| GET | `/divisions/:id/districts` | Districts by division | ❌ |
| GET | `/districts/:id/thanas` | Thanas by district | ❌ |
| GET | `/universities` | Universities (filter by type/search) | ❌ |

### Email Campaigns — `/api/v1/emails` (Admin only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/send` | Send campaign |
| POST | `/preview` | Preview recipients |
| GET | `/users/search` | Search users |
| GET | `/stats` | Email stats |
| GET | `/` | All campaigns |
| GET | `/:id` | Single campaign |

---

## Rate Limits

| Limiter | Limit | Applied To |
|---------|-------|------------|
| Global | 500 / 15 min per IP | All routes |
| Login | 5 / 15 min per IP+identifier | POST /auth/login |
| Register | 5 / 15 min per IP | POST /auth/ |
| OTP | 5 / 10 min per IP+phone | OTP routes |
| Forgot Password | 5 / 1 hour per IP | POST /auth/forgot-password |
| Profile Search | 60 / min per user | GET /profile |
| Like | 30 / min per user | POST /likes/:userId |
| Album | 20 / 15 min per user | Album write routes |
| Report | 5 / hour per user | POST /report/:userId |
| Payment | 10 / hour per user | POST /subscriptions/initiate |

---

## Redis Key Patterns

| Key | TTL | Purpose |
|-----|-----|---------|
| `user:{userId}` | 5 min | Auth middleware user cache |
| `myprofile:{userId}` | 5 min | getMyProfile cache |
| `profile:{userId}` | 10 min | Like service profile cache |
| `like:count:{userId}` | 5 min | Like count cache |
| `like:senders:{userId}` | 5 min | Who liked me cache |
| `like:given:{userId}` | 5 min | My likes cache |
| `notif:unread:{userId}` | 30 sec | Unread notification count |
| `geo:ip:{ip}` | 24 hr | IP geolocation cache |
| `fx:rate:BDT:GBP` | 6 hr | Exchange rate cache |
| `sub:reminder:{userId}` | 25 hr | Subscription reminder dedup |
| `onlineUsers` | Hash | Active socket connections |
| `refresh:{userId}` | 30 days | Refresh token |
| `blacklist:{jti}` | Remaining TTL | Blacklisted access tokens |
| `rl:*` | Window TTL | Rate limiter counters |

---

## Cron Jobs

| Job | Schedule | Description |
|-----|----------|-------------|
| Subscription expiry | Daily 00:01 | Expire active subscriptions, set users to free |
| Expiry reminder | Daily 10:00 | Notify users with 1-2 days left |

---

## Performance

After optimizations (Render.com deployment):

| Metric | Before | After |
|--------|--------|-------|
| Concurrent users | 5–10 | 100–200 |
| HTTP failure rate | 67% | < 2% |
| getMyProfile p95 | 2,017 ms | ~50 ms (Redis cache) |
| conversations p95 | 1,098 ms | ~300 ms (aggregation) |
| Login p95 | 67 ms | 67 ms |
| MongoDB connection pool | 5 (default) | 200 |

**Key optimizations applied:**
- Redis cache on `getMyProfile` (5 min TTL)
- `conversations` — replaced `populate()` with `$lookup` aggregation
- MongoDB `maxPoolSize: 200`
- HTTP response compression (gzip)
- Compound indexes on all heavy query fields
- `getUnreadCount` Redis cache (30 sec TTL)
- DreamPartner aggregation — `$match` before `$lookup`

---

## Deployment (Render.com)

1. Push code to GitHub
2. Render.com → New Web Service → connect repo
3. **Build Command:** `npm install && npm run build`
4. **Start Command:** `node dist/server.js`
5. Add all environment variables from `.env`
6. Deploy

> **Important:** Do not deploy on Vercel. Vercel is serverless and does not support persistent Express.js connections or Socket.IO.

---

## License

MIT
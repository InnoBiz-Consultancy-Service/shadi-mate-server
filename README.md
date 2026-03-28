# ShadiMate — Backend API

ShadiMate একটি বাংলাদেশি matrimonial platform এর backend। Node.js, Express, TypeScript, MongoDB এবং Redis দিয়ে তৈরি। Real-time chat এর জন্য Socket.IO ব্যবহার করা হয়েছে।

---

## Tech Stack

| Technology | ব্যবহার |
|---|---|
| Node.js + Express | HTTP Server |
| TypeScript | Type Safety |
| MongoDB + Mongoose | Database |
| Redis (ioredis) | Caching + Real-time presence |
| Socket.IO | Real-time chat |
| JWT | Authentication |
| Zod | Request validation |
| bcryptjs | Password hashing |

---

## Project Structure

```
src/
├── app/
│   ├── modules/
│   │   ├── user/               # Auth, registration, login
│   │   ├── profile/            # User profile management
│   │   ├── chat/               # Chat history, conversation list
│   │   ├── like/               # Like/Unlike feature
│   │   ├── dreamPartner/       # Dream partner preferences & matching
│   │   ├── personalityQuestion/ # Personality test (guest + user)
│   │   └── geo/                # Division, District, Thana, University
│   └── routes/
│       └── index.ts            # Central route registry
├── config/
│   └── envConfig.ts            # Environment variable loader
├── data/
│   ├── geoSeedData.ts          # Bangladesh geo data
│   ├── personalityQuestions.ts # Personality test questions
│   └── universities.ts         # Bangladesh university list
├── helpers/
│   └── AppError.ts             # Custom error class
├── middleWares/
│   ├── auth.middleware.ts      # JWT authentication + authorization
│   ├── globalErrorHandler.ts   # Global error handler
│   ├── notFound.ts             # 404 handler
│   └── validateRequest.ts      # Zod schema validator
├── socket/
│   ├── index.ts                # Socket.IO initializer
│   └── handlers/
│       ├── presence.handlers.ts  # Online/offline tracking
│       ├── chat.handlers.ts      # Real-time messaging
│       ├── typing.handlers.ts    # Typing indicator
│       └── seen.handlers.ts      # Message seen status
├── utils/
│   ├── catchAsync.ts           # Async error wrapper
│   ├── sendResponse.ts         # Standardized HTTP response
│   ├── redis.ts                # Redis client
│   ├── socket.auth.ts          # Socket JWT verifier
│   └── profileQueryBuilder.ts  # Aggregation pipeline builder
├── seeders/
│   ├── seedGeoData.ts
│   ├── seedPersonalityQuestions.ts
│   └── seedSuperAdmin.ts
└── app.ts                      # Express app setup
```

---

## Environment Setup

`.env` ফাইল তৈরি করো এবং নিচের variables গুলো দাও:

```env
PORT=5000
DB_URL=mongodb+srv://<username>:<password>@cluster0.mongodb.net/<dbname>?retryWrites=true&w=majority
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
SUPER_ADMIN_EMAIL=admin@shadimate.com
SUPER_ADMIN_PASSWORD=your_super_admin_password
BCRYPT_SALT_ROUND=12
FRONTEND_URL=http://localhost:3000
REDIS_URL=redis://localhost:6379
```

---

## Installation & Run

```bash
# Dependencies install করো
npm install

# Development mode
npm run dev

# Production build
npm run build
npm start
```

---

## Subscription System

JWT token-এ `subscription` field থাকে — `"free"` অথবা `"premium"`।

| Feature | Free | Premium |
|---|---|---|
| Registration / Login | ✅ | ✅ |
| Profile তৈরি ও দেখা | ✅ | ✅ |
| Profile like/unlike করা | ✅ | ✅ |
| Like count দেখা | ✅ | ✅ |
| আমার দেওয়া like list | ✅ | ✅ |
| কে আমাকে like দিয়েছে | ❌ | ✅ |
| Chat message **send** করা | ❌ | ✅ |
| Chat message **receive** করা | ✅ | ✅ |
| Conversation list (sender + count) | ✅ | ✅ |
| Conversation message **content** দেখা | ❌ | ✅ |
| Chat history দেখা | ❌ | ✅ |
| Dream Partner matching | ✅ | ✅ |
| Personality test | ✅ | ✅ |

---

## API Reference

Base URL: `/api/v1`

---

### Auth / User — `/api/v1/users`

| Method | Endpoint | Auth | বর্ণনা |
|---|---|---|---|
| POST | `/` | ❌ | Register (OTP পাঠায়) |
| POST | `/verify-otp` | ❌ | OTP verify করে account তৈরি |
| POST | `/login` | ❌ | Login |
| POST | `/resend-otp` | ❌ | OTP resend |
| POST | `/forgot-password` | ❌ | Forgot password OTP পাঠায় |
| POST | `/verify-reset-otp` | ❌ | Reset password OTP verify |
| POST | `/reset-password` | ❌ | Password change (old password দিয়ে) |
| GET | `/me` | ✅ | নিজের user info |
| PATCH | `/` | ✅ | Profile update |
| PATCH | `/delete-profile/:id` | ✅ | Soft delete |
| PATCH | `/block-user/:id` | ✅ Admin | Block/Unblock user |

#### Register Request Body
```json
{
  "name": "Rakib Hasan",
  "email": "rakib@example.com",
  "phone": "01712345678",
  "password": "pass1234",
  "gender": "male"
}
```

#### Login Request Body
```json
{
  "identifier": "01712345678",
  "password": "pass1234"
}
```

#### Login Response
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "<jwt_token>"
  }
}
```

> Token-এ থাকে: `id`, `phone`, `email`, `role`, `subscription`, `isVerified`, `isProfileCompleted`

---

### Profile — `/api/v1/profiles`

| Method | Endpoint | Auth | বর্ণনা |
|---|---|---|---|
| POST | `/` | ✅ | Profile তৈরি |
| PATCH | `/` | ✅ | Profile update |
| GET | `/` | ✅ | সব profile (filter + search + pagination) |
| GET | `/my` | ✅ | নিজের profile |
| GET | `/:id` | ✅ | নির্দিষ্ট profile |

#### Profile Query Parameters (GET `/`)
| Param | Type | উদাহরণ |
|---|---|---|
| `search` | string | `?search=engineer` |
| `gender` | string | `?gender=female` |
| `division` | string | `?division=Dhaka` |
| `district` | string | `?district=Gazipur` |
| `thana` | string | `?thana=Tongi` |
| `university` | string | `?university=BUET` |
| `faith` | string | `?faith=Islam` |
| `practiceLevel` | string | `?practiceLevel=Practicing` |
| `educationVariety` | string | `?educationVariety=Engineering` |
| `personality` | string | `?personality=Caring Soul` |
| `habits` | string[] | `?habits=Reading Books&habits=Gaming` |
| `minAge` | number | `?minAge=22` |
| `maxAge` | number | `?maxAge=30` |
| `page` | number | `?page=1` |
| `limit` | number | `?limit=10` |
| `sort` | string | `?sort=-createdAt` |

---

### Like — `/api/v1/likes`

| Method | Endpoint | Auth | Subscription | বর্ণনা |
|---|---|---|---|---|
| POST | `/:userId` | ✅ | Free + Premium | Like / Unlike toggle |
| GET | `/count/:userId` | ✅ | Free + Premium | কতটা like আছে |
| GET | `/my-likes` | ✅ | Free + Premium | আমার দেওয়া like list (profile সহ) |
| GET | `/who-liked-me` | ✅ | **Premium only** | কে আমাকে like দিয়েছে (profile সহ) |

#### Like Response (GET `/my-likes` বা `/who-liked-me`)
```json
{
  "data": [
    {
      "userId": "64f1a2b3...",
      "likedAt": "2026-03-28T10:30:00.000Z",
      "profile": {
        "gender": "female",
        "profession": "Doctor",
        "economicalStatus": "Medium",
        "personality": "Caring Soul",
        "religion": { "faith": "Islam", "practiceLevel": "Practicing" },
        "address": {
          "divisionId": { "name": "Dhaka" },
          "districtId": { "name": "Gazipur" }
        },
        "userId": { "_id": "...", "name": "Fatima Khanam" }
      }
    }
  ]
}
```

> Free user `/who-liked-me` call করলে **403** পাবে।

---

### Chat — `/api/v1/chat`

| Method | Endpoint | Auth | Subscription | বর্ণনা |
|---|---|---|---|---|
| GET | `/conversations` | ✅ | Free + Premium | Conversation list |
| GET | `/:userId` | ✅ | **Premium only** | Chat history |

#### Conversation List — Free User Response
```json
{
  "data": [
    {
      "userId": "...",
      "name": "Fatima",
      "avatar": null,
      "lastMessage": null,
      "lastMessageType": null,
      "lastMessageTime": "2026-03-28T...",
      "unreadCount": 3,
      "isLocked": true
    }
  ]
}
```

> Free user-এ `lastMessage: null`, `isLocked: true` — frontend-এ lock icon দেখাবে।

---

### Dream Partner — `/api/v1/dream-partner`

| Method | Endpoint | Auth | বর্ণনা |
|---|---|---|---|
| POST | `/` | ✅ | Dream partner preference save/update |
| GET | `/` | ✅ | Preference অনুযায়ী matching profiles |

#### Save Preference Request Body
```json
{
  "practiceLevel": "Practicing",
  "economicalStatus": "Medium",
  "habits": ["Reading Books", "Traveling"]
}
```

> Matching score তিনটা criteria-তে calculate হয়: `practiceLevel`, `economicalStatus`, `habits`। Score বেশি হলে আগে দেখায়।

---

### Personality Test — `/api/v1/personality`

Guest user (login ছাড়া) personality test দিতে পারবে।

| Method | Endpoint | Auth | বর্ণনা |
|---|---|---|---|
| GET | `/questions` | ❌ | সব প্রশ্ন |
| POST | `/submit` | ❌ | উত্তর submit, result পাবে |
| GET | `/:id` | ❌ | Result দেখা (email required) |
| PATCH | `/:id` | ❌ | Guest profile update (name, email, gender) |

#### Submit Request Body
```json
{
  "answers": [
    { "questionId": "64f...", "selectedOption": "agree" },
    { "questionId": "64f...", "selectedOption": "sometimes" }
  ]
}
```

#### Personality Types
| Type | বর্ণনা |
|---|---|
| `Caring Soul` | সম্পর্ক ও যত্নে বিশ্বাসী |
| `Balanced Thinker` | আবেগ ও স্বাধীনতার মধ্যে ভারসাম্য |
| `Ambitious Mind` | ক্যারিয়ার ও লক্ষ্যে সচেতন |

---

### Geo (Location Data) — `/api/v1/geo`

Auth লাগে না। Profile form fill করার সময় dropdown-এর জন্য।

| Method | Endpoint | বর্ণনা |
|---|---|---|
| GET | `/universities` | সব university |
| GET | `/divisions` | সব বিভাগ |
| GET | `/divisions/:divisionId/districts` | বিভাগ অনুযায়ী জেলা |
| GET | `/districts/:districtId/thanas` | জেলা অনুযায়ী থানা |

---

## Real-time Socket.IO

Socket connect করার সময় `token` query param পাঠাতে হবে:

```js
const socket = io("YOUR_SERVER_URL", {
  query: { token: "USER_JWT_TOKEN" },
  transports: ["websocket"],
});
```

### Events

| Event | Direction | বর্ণনা |
|---|---|---|
| `send-message` | Client → Server | Message পাঠানো (Premium only) |
| `message-sent` | Server → Client | Send confirmation |
| `receive-message` | Server → Client | নতুন message পাওয়া |
| `typing` | দুইদিক | Typing indicator |
| `stop-typing` | দুইদিক | Typing বন্ধ |
| `seen` | Client → Server | Message দেখা হয়েছে |
| `message-seen` | Server → Client | Sender-কে seen notification |
| `error` | Server → Client | Error (যেমন subscription required) |
| `unauthorized` | Server → Client | Invalid token |

#### Send Message Payload
```json
{
  "receiverId": "USER_ID",
  "message": "Hello!",
  "type": "text"
}
```

> Free user `send-message` emit করলে `error` event আসবে: `{ code: "SUBSCRIPTION_REQUIRED" }`

---

## Redis Caching

| Cache Key | TTL | Invalidate কখন |
|---|---|---|
| `like:count:{userId}` | 5 মিনিট | Like/Unlike করলে |
| `like:senders:{userId}` | 5 মিনিট | Like/Unlike করলে |
| `like:given:{userId}` | 5 মিনিট | Like/Unlike করলে |
| `profile:{userId}` | 10 মিনিট | Profile update করলে |
| `onlineUsers` (hash) | — | Disconnect হলে |

---

## Standard Response Format

সব API-র response এই format-এ আসে:

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Success message",
  "data": {},
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

Error response:
```json
{
  "success": false,
  "message": "Error message",
  "errorSource": [
    { "path": "email", "message": "Email is required" }
  ]
}
```

---

## Seeders

Server start হলে automatically run হয়:

| Seeder | কাজ |
|---|---|
| `seedGeoData` | বাংলাদেশের ৮ বিভাগ, সব জেলা, থানা seed করে |
| `seedPersonalityQuestions` | ১৫টি personality test প্রশ্ন seed করে |
| `seedSuperAdmin` | Super admin account তৈরি করে |

---

## Authentication

- **REST API:** `Authorization: <token>` header
- **Socket.IO:** `?token=<token>` query param
- Token-এ থাকে: `id`, `phone`, `email`, `role`, `subscription`, `isVerified`, `isProfileCompleted`

---

*ShadiMate Backend — v1.0*
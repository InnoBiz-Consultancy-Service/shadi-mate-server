# Shadi Mate Server

A RESTful API backend for the **Shadi Mate** matchmaking platform, built with **Node.js**, **Express**, **TypeScript**, and **MongoDB (Mongoose)**.

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js |
| Language | TypeScript |
| Framework | Express v5 |
| Database | MongoDB + Mongoose |
| Validation | Zod |
| Auth | JWT (jsonwebtoken) |
| Password Hashing | bcryptjs |
| OTP (SMS) | Mock (real SMS coming soon) |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── modules/
│   │   └── user/
│   │       ├── user.interface.ts     # TypeScript interfaces (IUser, IOtp)
│   │       ├── user.model.ts         # Mongoose schemas (User + Otp with TTL)
│   │       ├── user.validation.ts    # Zod schemas (register, verifyOtp, login)
│   │       ├── user.service.ts       # Business logic
│   │       ├── user.controller.ts    # Request/response handlers
│   │       └── user.router.ts        # Express routes
│   └── routes/
│       └── index .ts                 # Central route aggregator
├── config/
│   └── envConfig.ts                  # Typed env variable loader
├── helpers/
│   └── AppError.ts                   # Custom error class
├── middleWares/
│   ├── auth.middleware.ts            # JWT authenticate & authorize guards
│   ├── validateRequest.ts            # Zod validation middleware
│   ├── globalErrorHandler.ts         # Global error handler
│   └── notFound.ts                   # 404 handler
├── utils/
│   └── catchAsync.ts                 # Async error wrapper
├── app.ts
└── server.ts
```

---

## 🔐 Authentication API

Base URL: `http://localhost:5000/api/v1`

### Register — `POST /auth/register`

Register a new user. An OTP will be sent to the phone number.

> ⚠️ **Mock Mode** — OTP is currently returned in the response. Real SMS will be connected later.

**Request Body:**
```json
{
  "name": "Rahim Mia",
  "email": "rahim@example.com",
  "phone": "01700000000",
  "password": "pass1234"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "OTP sent to phone number (mock mode — OTP returned in response)",
  "data": {
    "userId": "...",
    "phone": "01700000000",
    "otp": "482913"
  }
}
```

---

### Verify OTP — `POST /auth/verify-otp`

Verify phone number using the OTP received. OTP expires in **5 minutes**.

**Request Body:**
```json
{
  "phone": "01700000000",
  "otp": "482913"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Phone number verified successfully",
  "data": { ...userObject }
}
```

---

### Login — `POST /auth/login`

Login with phone number and password. Returns a **JWT token**.

**Request Body:**
```json
{
  "phone": "01700000000",
  "password": "pass1234"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": { ...userObject }
}
```

---

### Get Profile — `GET /auth/me` 🔒

Get the authenticated user's profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile fetched successfully",
  "data": { ...userObject }
}
```

---

### Resend OTP — `POST /auth/resend-otp`

Resend OTP if expired or not received.

**Request Body:**
```json
{
  "phone": "01700000000"
}
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
DB_URL=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/shadi-mate?retryWrites=true&w=majority
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
```

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Run in development
npm run dev
```

Server starts at: `http://localhost:5000`

---

## 📋 Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "errorSource": [
    { "path": "fieldName", "message": "what went wrong" }
  ]
}
```

---

## 🗺️ Roadmap

- [x] User Registration with OTP
- [x] OTP Verification (mock mode)
- [x] JWT Authentication
- [x] Protected Routes (middleware)
- [ ] Connect real SMS gateway (Twilio / SSLCommerz)
- [ ] User Profile update
- [ ] Matrimony profile module
- [ ] Match-making algorithm

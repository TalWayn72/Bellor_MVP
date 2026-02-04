# Bellor API Endpoints Documentation

**Version:** 1.0.0
**Base URL:** `http://localhost:3000/api/v1`
**Status:** In Development ⏳

---

## 🔐 Authentication Endpoints

### Register New User
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:** `201 Created`
```json
{
  "data": {
    "user": {
      "id": "clx...",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

---

### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

---

### Refresh Token
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}
```

**Response:** `200 OK`
```json
{
  "data": {
    "accessToken": "eyJhbGc..."
  }
}
```

---

### Get Current User
```http
GET /api/v1/auth/me
Authorization: Bearer {accessToken}
```

**Response:** `200 OK`
```json
{
  "data": {
    "id": "clx...",
    "email": "user@example.com",
    "firstName": "John",
    "preferredLanguage": "ENGLISH"
  }
}
```

---

### Logout
```http
POST /api/v1/auth/logout
Authorization: Bearer {accessToken}
```

**Response:** `200 OK`
```json
{
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

## 👤 User Management Endpoints

### List Users
```http
GET /api/v1/users?page=1&limit=20&gender=FEMALE&language=ENGLISH
Authorization: Bearer {accessToken}
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `gender` (string): MALE | FEMALE | NON_BINARY | OTHER
- `language` (string): ENGLISH | HEBREW | SPANISH | GERMAN | FRENCH
- `ageMin` (number): Minimum age
- `ageMax` (number): Maximum age
- `sort` (string): createdAt | lastActiveAt | firstName

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "clx...",
      "firstName": "Sarah",
      "gender": "FEMALE",
      "preferredLanguage": "ENGLISH",
      "profileImages": ["https://..."]
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 10,
    "pages": 1
  }
}
```

---

### Get User by ID
```http
GET /api/v1/users/{userId}
Authorization: Bearer {accessToken}
```

**Response:** `200 OK`
```json
{
  "data": {
    "id": "clx...",
    "firstName": "Sarah",
    "lastName": "Johnson",
    "bio": "Adventure seeker...",
    "preferredLanguage": "ENGLISH",
    "responseCount": 5,
    "chatCount": 3
  }
}
```

---

### Update User
```http
PATCH /api/v1/users/{userId}
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "firstName": "Sarah",
  "bio": "New bio text",
  "preferredLanguage": "SPANISH"
}
```

**Response:** `200 OK`
```json
{
  "data": {
    "id": "clx...",
    "firstName": "Sarah",
    "bio": "New bio text",
    "preferredLanguage": "SPANISH"
  }
}
```

---

### Change Language
```http
PATCH /api/v1/users/{userId}/language
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "language": "HEBREW"
}
```

**Response:** `200 OK`
```json
{
  "data": {
    "preferredLanguage": "HEBREW",
    "message": "Language updated successfully"
  }
}
```

---

### Search Users
```http
GET /api/v1/users/search?q=sarah&gender=FEMALE
Authorization: Bearer {accessToken}
```

**Query Parameters:**
- `q` (string): Search query (name, bio)
- `gender` (string): Filter by gender
- `language` (string): Filter by language

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "clx...",
      "firstName": "Sarah",
      "lastName": "Johnson",
      "profileImages": ["https://..."]
    }
  ]
}
```

---

## 🔄 WebSocket Events

### Connection
```javascript
const socket = io('http://localhost:3000', {
  auth: { token: accessToken }
});
```

---

### Events (Client → Server)

#### Send Message
```javascript
socket.emit('message:send', {
  chatId: 'clx...',
  messageType: 'TEXT',
  content: 'Hello!',
  textContent: 'Hello!'
});
```

#### Typing Indicators
```javascript
socket.emit('typing:start', chatId);
socket.emit('typing:stop', chatId);
```

#### Mark Message as Read
```javascript
socket.emit('message:read', {
  chatId: 'clx...',
  messageId: 'clx...'
});
```

---

### Events (Server → Client)

#### User Online/Offline
```javascript
socket.on('user:online', (data) => {
  // { userId: 'clx...' }
});

socket.on('user:offline', (data) => {
  // { userId: 'clx...' }
});
```

#### New Message
```javascript
socket.on('message:new', (message) => {
  // {
  //   id: 'clx...',
  //   chatId: 'clx...',
  //   senderId: 'clx...',
  //   content: 'Hello!',
  //   createdAt: '2026-02-03T...'
  // }
});
```

#### Typing Indicators
```javascript
socket.on('typing:start', (data) => {
  // { userId: 'clx...', chatId: 'clx...' }
});

socket.on('typing:stop', (data) => {
  // { userId: 'clx...', chatId: 'clx...' }
});
```

#### Message Read
```javascript
socket.on('message:read', (data) => {
  // { messageId: 'clx...' }
});
```

---

## 📋 Error Responses

### 400 Bad Request
```json
{
  "error": "Validation error",
  "details": {
    "email": "Invalid email format"
  }
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

### 404 Not Found
```json
{
  "error": "Not found",
  "message": "User not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

---

## 🔑 Authentication

All protected endpoints require a JWT access token in the `Authorization` header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Token Expiry:**
- Access Token: 15 minutes
- Refresh Token: 7 days

---

## 🌐 Supported Languages

API supports language selection for users:
- `ENGLISH` (Default)
- `HEBREW`
- `SPANISH`
- `GERMAN`
- `FRENCH`

---

**Last Updated:** February 3, 2026
**Status:** Agents implementing endpoints in parallel

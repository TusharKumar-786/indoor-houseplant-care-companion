# LeafPulse — RESTful API Documentation

## Base URL
- Development: `http://localhost:5000/api`
- Production: `https://<your-domain>/api`

All API endpoints, unless explicitly noted as **[Public]**, require an HTTP `Authorization` header containing a valid JSON Web Token:
```http
Authorization: Bearer <jwt_token>
```

---

## 1. Authentication Endpoints

### 1.1 Register Account [Public]
`POST /api/auth/register`

**Request Body:**
```json
{
  "name": "Tushar Kumar",
  "email": "tushar@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```
**Response (201 Created):**
```json
{
  "success": true,
  "message": "Account registered successfully",
  "data": {
    "user": { "id": 1, "name": "Tushar Kumar", "email": "tushar@example.com" },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 1.2 Login [Public]
`POST /api/auth/login`

**Request Body:**
```json
{
  "email": "tushar@example.com",
  "password": "password123"
}
```
**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { "id": 1, "name": "Tushar Kumar", "email": "tushar@example.com" },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 1.3 Get Current User
`GET /api/auth/me`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": { "id": 1, "name": "Tushar Kumar", "email": "tushar@example.com", "created_at": "2026-11-19T00:00:00.000Z" }
  }
}
```

### 1.4 Update Profile
`PUT /api/auth/profile`

**Request Body:**
```json
{
  "name": "Tushar K.",
  "email": "tushar@example.com",
  "currentPassword": "password123",
  "newPassword": "newpassword456"
}
```

---

## 2. Dashboard Endpoints

### 2.1 Get Dashboard Statistics
`GET /api/dashboard?fresh=1`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "counts": {
      "total_plants": 5,
      "due_today": 2,
      "total_rooms": 3
    },
    "plants_due_today": [
      {
        "id": 1,
        "nickname": "Money Plant",
        "species": "Epipremnum aureum",
        "image_url": "https://images.unsplash.com/...",
        "room": "Living Room",
        "next_watering_date": "2026-11-19",
        "days_since_last_watering": 3
      }
    ],
    "recently_added": [
      {
        "id": 5,
        "nickname": "Fiddle Leaf Fig",
        "species": "Ficus lyrata",
        "image_url": "https://images.unsplash.com/...",
        "room": "Living Room",
        "created_at": "2026-11-19T00:00:00.000Z"
      }
    ],
    "weekly_activity": [
      { "day": "Fri", "date": "2026-11-14", "count": 1 },
      { "day": "Thu", "date": "2026-11-19", "count": 3 }
    ]
  }
}
```

---

## 3. Plants & Growth Journal Endpoints

### 3.1 List Plants
`GET /api/plants?search=pothos&room_id=1&page=1&limit=20`

### 3.2 Create Plant (Atomic Transaction)
`POST /api/plants`

**Request Body:**
```json
{
  "nickname": "Monstera Deliciosa",
  "species": "Monstera deliciosa",
  "room_id": 1,
  "water_frequency_days": 7,
  "sunlight_level": "Medium",
  "fertilizing_frequency_days": 14,
  "image_url": "https://images.unsplash.com/..."
}
```

### 3.3 Get Plant Details
`GET /api/plants/:id`

### 3.4 Update Plant
`PUT /api/plants/:id`

### 3.5 Delete Plant
`DELETE /api/plants/:id`

### 3.6 Upload Plant Photo
`POST /api/plants/:id/image` (Multipart `image`)

### 3.7 List Growth Journal Entries
`GET /api/plants/:id/journal`

### 3.8 Add Growth Journal Entry
`POST /api/plants/:id/journal`

**Request Body:**
```json
{
  "date": "2026-11-19",
  "notes": "New leaf unfurled! Measured growth.",
  "height_cm": 35.5,
  "image_url": null
}
```

### 3.9 Delete Growth Journal Entry
`DELETE /api/plants/:id/journal/:entryId`

---

## 4. Care Schedule Endpoints

### 4.1 Get Care Schedule
`GET /api/schedule?filter=today|week|all`

---

## 5. Care Log Book Endpoints

### 5.1 List Care Logs
`GET /api/logs?plant_id=1&page=1&limit=20`

### 5.2 Add Care Log
`POST /api/logs`

**Request Body:**
```json
{
  "plant_id": 1,
  "action": "Watered",
  "date": "2026-11-19",
  "notes": "Watered thoroughly until drainage appeared"
}
```

### 5.3 Delete Care Log
`DELETE /api/logs/:id`

---

## 6. Rooms Endpoints

### 6.1 List Rooms
`GET /api/rooms`

### 6.2 Create Room
`POST /api/rooms`

**Request Body:**
```json
{
  "name": "Sunroom",
  "window_direction": "South-facing"
}
```

### 6.3 Update Room
`PUT /api/rooms/:id`

### 6.4 Delete Room
`DELETE /api/rooms/:id`

---

## 7. Plant Health Assistant Endpoints

### 7.1 Diagnose Symptoms
`POST /api/health-assistant`

**Request Body:**
```json
{
  "symptoms": ["yellow_leaves", "drooping"],
  "plant_nickname": "Money Plant",
  "plant_species": "Epipremnum aureum",
  "notes": "Lower foliage is turning pale and drooping"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "plant_nickname": "Money Plant",
    "plant_species": "Epipremnum aureum",
    "symptoms": ["yellow_leaves", "drooping"],
    "diagnosis": {
      "issue": "Overwatering & Root Suffocation",
      "confidence": "High",
      "explanation": "Soggy soil blocks oxygen from reaching roots...",
      "primary_actions": [
        "Stop watering immediately...",
        "Insert a wooden skewer or finger 2 inches into soil..."
      ],
      "preventive_measures": [
        "Always ensure planters have active drainage holes..."
      ]
    },
    "disclaimer": "Guidance provided by LeafPulse Botanical Diagnostics engine."
  }
}
```

---

## 8. Health Check Endpoint [Public]
`GET /api/health`

**Response (200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2026-11-19T14:20:00.000Z",
  "uptime": 124.52,
  "db": {
    "status": "connected",
    "latency_ms": 2
  }
}
```

# 📚 AfroAsiaConnect API Documentation

## 🌐 **Base URL**
- **Development:** `http://localhost:3001/api`
- **Production:** `https://your-backend-domain.com/api`

## 🔐 **Authentication**
All protected endpoints require JWT token in header:
```
Authorization: Bearer <jwt_token>
```

## 📋 **API Endpoints Overview**

### **🔑 Authentication Routes** (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | User registration | ❌ |
| POST | `/login` | User login | ❌ |
| POST | `/logout` | User logout | ✅ |
| GET | `/profile` | Get user profile | ✅ |
| PUT | `/profile` | Update user profile | ✅ |

### **🏢 Services Routes** (`/api/services`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all services | ❌ |
| GET | `/:id` | Get service by ID | ❌ |
| POST | `/` | Create new service | ✅ |
| PUT | `/:id` | Update service | ✅ |
| DELETE | `/:id` | Delete service | ✅ |

### **📅 Bookings Routes** (`/api/bookings`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get user bookings | ✅ |
| POST | `/` | Create new booking | ✅ |
| GET | `/:id` | Get booking details | ✅ |
| PUT | `/:id` | Update booking status | ✅ |
| DELETE | `/:id` | Cancel booking | ✅ |
| GET | `/availability/:serviceId` | Check availability | ❌ |

### **💳 Payments Routes** (`/api/payments`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/create-intent` | Create payment intent | ✅ |
| POST | `/confirm` | Confirm payment | ✅ |
| POST | `/refund` | Process refund | ✅ |
| GET | `/history` | Get payment history | ✅ |
| GET | `/config` | Get Stripe config | ✅ |

### **💬 Messaging Routes** (`/api/messaging`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/conversations` | Get user conversations | ✅ |
| POST | `/conversations` | Create conversation | ✅ |
| GET | `/conversations/:id/messages` | Get messages | ✅ |
| POST | `/conversations/:id/messages` | Send message | ✅ |
| GET | `/search` | Search messages | ✅ |

### **📱 SMS Routes** (`/api/sms`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/send` | Send SMS | ✅ |
| POST | `/send-verification` | Send verification code | ✅ |
| POST | `/verify-code` | Verify SMS code | ✅ |
| GET | `/preferences` | Get SMS preferences | ✅ |
| PUT | `/preferences` | Update SMS preferences | ✅ |

### **📊 Analytics Routes** (`/api/analytics`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/dashboard` | Get dashboard analytics | ✅ |
| GET | `/bookings` | Get booking analytics | ✅ |
| GET | `/revenue` | Get revenue analytics | ✅ |
| GET | `/user/:userId` | Get user analytics | ✅ |

### **👥 Team Routes** (`/api/team`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/overview` | Get team overview | ✅ |
| GET | `/members` | Get team members | ✅ |
| POST | `/invite` | Invite team member | ✅ |
| PUT | `/members/:id` | Update member role | ✅ |
| DELETE | `/members/:id` | Remove team member | ✅ |

### **⭐ Reviews Routes** (`/api/reviews`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get reviews | ✅ |
| POST | `/` | Create review | ✅ |
| GET | `/:id` | Get review details | ✅ |
| POST | `/:id/response` | Respond to review | ✅ |
| GET | `/analytics` | Get review analytics | ✅ |

### **🔒 Security Routes** (`/api/security`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/encrypt-message` | Encrypt message | ✅ |
| POST | `/decrypt-message` | Decrypt message | ✅ |
| POST | `/scan-content` | DLP content scan | ✅ |
| GET | `/audit-logs` | Get audit logs | ✅ |
| GET | `/security-alerts` | Get security alerts | ✅ |

### **🤖 AI Routes** (`/api/ai`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/suggestions` | Get AI suggestions | ✅ |
| POST | `/autocomplete` | Get autocomplete | ✅ |
| POST | `/analyze-sentiment` | Analyze sentiment | ✅ |
| POST | `/translate` | Translate text | ✅ |
| POST | `/chatbot` | AI chatbot response | ✅ |

## 📝 **Request/Response Examples**

### **User Registration**
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "role": "customer",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### **Create Booking**
```http
POST /api/bookings
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "serviceId": 1,
  "date": "2025-01-15",
  "time": "14:00",
  "duration": 60,
  "notes": "Looking forward to the consultation"
}
```

**Response:**
```json
{
  "success": true,
  "booking": {
    "id": 123,
    "serviceId": 1,
    "customerId": 1,
    "date": "2025-01-15T14:00:00.000Z",
    "duration": 60,
    "status": "confirmed",
    "totalAmount": 150.00
  }
}
```

### **Send Message**
```http
POST /api/messaging/conversations/1/messages
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "content": "Hello, I have a question about the service",
  "type": "text"
}
```

**Response:**
```json
{
  "success": true,
  "message": {
    "id": 456,
    "conversationId": 1,
    "senderId": 1,
    "content": "Hello, I have a question about the service",
    "type": "text",
    "createdAt": "2025-01-07T14:30:00.000Z"
  }
}
```

## 🔄 **WebSocket Events**

### **Real-time Messaging**
```javascript
// Connect to WebSocket
const socket = io('http://localhost:3001');

// Join conversation
socket.emit('join_conversation', { conversationId: 1 });

// Send message
socket.emit('send_message', {
  conversationId: 1,
  content: 'Hello!',
  type: 'text'
});

// Receive message
socket.on('new_message', (message) => {
  console.log('New message:', message);
});

// Typing indicators
socket.emit('typing_start', { conversationId: 1 });
socket.emit('typing_stop', { conversationId: 1 });
```

## ⚠️ **Error Responses**

### **Standard Error Format**
```json
{
  "success": false,
  "error": "Error message description",
  "code": "ERROR_CODE",
  "details": {
    "field": "specific error details"
  }
}
```

### **Common HTTP Status Codes**
- **200** - Success
- **201** - Created
- **400** - Bad Request
- **401** - Unauthorized
- **403** - Forbidden
- **404** - Not Found
- **422** - Validation Error
- **500** - Internal Server Error

## 🔒 **Rate Limiting**
- **Authentication endpoints:** 5 requests per minute
- **General API:** 100 requests per minute
- **File uploads:** 10 requests per minute
- **SMS sending:** 5 requests per minute

## 📊 **Pagination**
```http
GET /api/services?page=1&limit=20&sort=createdAt&order=desc
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## 🔍 **Filtering & Search**
```http
GET /api/services?category=technology&location=singapore&minPrice=100&maxPrice=500
```

## 📱 **Mobile App Integration**
Base URL for mobile app: `http://10.0.2.2:3001/api` (Android emulator)

## 🚀 **Getting Started**

1. **Start the backend server:**
   ```bash
   cd backend
   npm start
   ```

2. **Test API endpoints:**
   ```bash
   # Register a user
   curl -X POST http://localhost:3001/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"name":"Test User","email":"test@example.com","password":"password123","role":"customer"}'
   ```

3. **Use the JWT token for protected endpoints:**
   ```bash
   curl -X GET http://localhost:3001/api/auth/profile \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

## 📞 **Support**
For API support and questions, please refer to the main documentation or create an issue in the repository.

# Virtual Event Management Platform API

A comprehensive backend API for managing virtual events, user registration, and participant management. Built with Node.js, Express.js, and in-memory data structures for fast development and testing.

## 🚀 Features

### User Management
- **User Registration & Login** - Secure authentication with bcrypt password hashing
- **JWT Token-based Authentication** - Stateless authentication with configurable expiry
- **Role-based Access Control** - Support for organizers and attendees with different privileges
- **Profile Management** - Update user information, change passwords, view registrations
- **Email Notifications** - Welcome emails and event confirmations

### Event Management
- **CRUD Operations** - Create, read, update, and delete events (organizers only)
- **Event Scheduling** - Support for date, time, duration, and location
- **Participant Management** - Track registrations with capacity limits
- **Event Status Tracking** - Automatic status updates (upcoming, ongoing, completed)
- **Public/Private Events** - Control event visibility and access

### Participant Features
- **Event Registration** - Join public events with capacity management
- **Registration Management** - View and cancel event registrations
- **Event Discovery** - Browse, search, and filter available events
- **Email Confirmations** - Automatic registration confirmations

### Security & Performance
- **Rate Limiting** - Protection against abuse with configurable limits
- **CORS Support** - Cross-origin resource sharing configuration
- **Security Headers** - Helmet.js for secure HTTP headers
- **Input Validation** - Comprehensive data validation and sanitization
- **Error Handling** - Detailed error responses with appropriate status codes

## 📋 Prerequisites

- **Node.js** (version 14.0.0 or higher)
- **npm** (version 6.0.0 or higher)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/event-management-api.git
   cd event-management-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables** (optional)
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   NODE_ENV=development
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   JWT_EXPIRES_IN=24h
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   EMAIL_FROM=noreply@eventmanagement.com
   CORS_ORIGIN=*
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

   Or for production:
   ```bash
   npm start
   ```

The server will start on `http://localhost:3000` by default.

## 🧪 Testing

Run the comprehensive test suite:

```bash
npm test
```

The test suite includes:
- **Unit tests** for models and utilities
- **Integration tests** for API endpoints
- **Authentication and authorization tests**
- **Error handling tests**
- **Data validation tests**

## 📚 API Documentation

### Base URL
```
http://localhost:3000
```

### Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### User Endpoints

#### Register User
```http
POST /api/users/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "attendee" // or "organizer"
}
```

#### Login User
```http
POST /api/users/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Get User Profile
```http
GET /api/users/profile
Authorization: Bearer <token>
```

#### Update Profile
```http
PUT /api/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com"
}
```

#### Change Password
```http
PUT /api/users/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

#### Get User Registrations
```http
GET /api/users/registrations
Authorization: Bearer <token>
```

### Event Endpoints

#### Get All Events
```http
GET /api/events?status=upcoming&category=Technology&search=conference&limit=20&offset=0
```

Query parameters:
- `status` - Filter by event status (upcoming, ongoing, completed)
- `category` - Filter by event category
- `search` - Search in title, description, and category
- `date` - Filter by specific date (YYYY-MM-DD)
- `organizer` - Filter by organizer ID
- `limit` - Number of results per page (default: 50)
- `offset` - Number of results to skip (default: 0)

#### Get Single Event
```http
GET /api/events/:id
```

#### Create Event (Organizers Only)
```http
POST /api/events
Authorization: Bearer <organizer-token>
Content-Type: application/json

{
  "title": "Tech Conference 2025",
  "description": "Annual technology conference featuring the latest innovations",
  "date": "2025-12-25",
  "time": "14:00",
  "duration": 180,
  "location": "Virtual Meeting Room A",
  "maxParticipants": 100,
  "category": "Technology",
  "isPublic": true
}
```

#### Update Event (Organizers Only)
```http
PUT /api/events/:id
Authorization: Bearer <organizer-token>
Content-Type: application/json

{
  "title": "Updated Event Title",
  "description": "Updated description",
  "maxParticipants": 150
}
```

#### Delete Event (Organizers Only)
```http
DELETE /api/events/:id
Authorization: Bearer <organizer-token>
```

#### Register for Event
```http
POST /api/events/:id/register
Authorization: Bearer <token>
```

#### Unregister from Event
```http
DELETE /api/events/:id/register
Authorization: Bearer <token>
```

#### Get My Events (Organizers Only)
```http
GET /api/events/my-events
Authorization: Bearer <organizer-token>
```

#### Get Event Participants (Organizers Only)
```http
GET /api/events/:id/participants
Authorization: Bearer <organizer-token>
```

### Utility Endpoints

#### Health Check
```http
GET /health
```

#### API Documentation
```http
GET /
```

## 📊 Data Models

### User Model
```javascript
{
  id: "uuid",
  email: "user@example.com",
  firstName: "John",
  lastName: "Doe",
  role: "attendee", // or "organizer"
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z",
  isActive: true
}
```

### Event Model
```javascript
{
  id: "uuid",
  title: "Event Title",
  description: "Event description",
  date: "2025-12-25",
  time: "14:00",
  duration: 120, // minutes
  location: "Virtual Room A",
  maxParticipants: 50, // null for unlimited
  organizerId: "organizer-uuid",
  category: "Technology",
  isPublic: true,
  status: "upcoming", // upcoming, ongoing, completed, cancelled
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z",
  isActive: true
}
```

## 🔒 Security Features

- **Password Hashing** - bcrypt with configurable salt rounds
- **JWT Authentication** - Secure token-based authentication
- **Rate Limiting** - Configurable rate limits per endpoint
- **CORS Protection** - Cross-origin request security
- **Input Validation** - Comprehensive data validation
- **Security Headers** - Helmet.js for HTTP security headers
- **Error Handling** - Secure error messages without sensitive data exposure

## 🚀 Deployment

### Environment Variables for Production

```env
NODE_ENV=production
PORT=3000
JWT_SECRET=your-very-secure-secret-key
JWT_EXPIRES_IN=24h
EMAIL_USER=your-production-email@company.com
EMAIL_PASS=your-secure-app-password
EMAIL_FROM=noreply@yourcompany.com
CORS_ORIGIN=https://yourfrontend.com
```

### Docker Deployment (Optional)

1. Create a `Dockerfile`:
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src ./src
EXPOSE 3000
CMD ["npm", "start"]
```

2. Build and run:
```bash
docker build -t event-management-api .
docker run -p 3000:3000 -e NODE_ENV=production event-management-api
```

## 🧩 Architecture

### Project Structure
```
event-management/
├── src/
│   ├── controllers/         # Request handlers
│   │   ├── userController.js
│   │   └── eventController.js
│   ├── middleware/          # Custom middleware
│   │   └── auth.js
│   ├── models/              # Data models
│   │   ├── User.js
│   │   ├── Event.js
│   │   └── memoryStore.js
│   ├── routes/              # Route definitions
│   │   ├── userRoutes.js
│   │   └── eventRoutes.js
│   ├── utils/               # Utility functions
│   │   ├── jwt.js
│   │   └── email.js
│   └── app.js               # Application entry point
├── tests/                   # Test files
│   ├── api.test.js
│   └── models.test.js
├── package.json
└── README.md
```

### In-Memory Data Storage

The application uses in-memory data structures for fast development and testing:

- **Users Map** - Stores user data indexed by user ID
- **Events Map** - Stores event data indexed by event ID
- **Registration Maps** - Tracks user-event relationships bidirectionally
- **Automatic Cleanup** - Cascading deletes maintain data integrity

### Middleware Stack

1. **Security Middleware** - Helmet, CORS, Rate limiting
2. **Body Parsing** - JSON and URL-encoded data parsing
3. **Authentication** - JWT token verification
4. **Authorization** - Role-based access control
5. **Validation** - Input data validation
6. **Error Handling** - Centralized error processing

## 🔧 Configuration

### Rate Limiting

- **Authentication endpoints**: 5 requests per 15 minutes
- **General endpoints**: 100 requests per 15 minutes
- **Creation endpoints**: 20 requests per 15 minutes
- **Global limit**: 200 requests per 15 minutes

### JWT Configuration

- **Default expiry**: 24 hours
- **Algorithm**: HS256
- **Issuer**: event-management-api

### Email Configuration

- **Development**: Uses Ethereal Email (fake SMTP)
- **Production**: Configurable SMTP (Gmail example provided)
- **Templates**: HTML email templates for notifications

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 🐛 Troubleshooting

### Common Issues

1. **Email not sending**
   - Check email configuration in environment variables
   - Verify app password for Gmail (not regular password)
   - Check firewall settings

2. **JWT token expired**
   - Tokens expire after 24 hours by default
   - Use the refresh token endpoint to get a new token

3. **Rate limit exceeded**
   - Wait for the rate limit window to reset
   - Adjust rate limiting configuration if needed

4. **Memory store data loss**
   - Data is stored in memory and will be lost on server restart
   - This is by design for development/testing purposes



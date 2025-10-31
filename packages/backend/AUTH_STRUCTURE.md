# Backend Authentication Structure

This document outlines the well-structured authentication setup for the Express backend using better-auth.

## 📁 File Structure

```
src/
├── config/
│   ├── database.ts      # Database configuration and Prisma client
│   └── auth.ts          # Better-auth configuration
├── middleware/
│   ├── auth.ts          # Authentication middleware
│   └── errorHandler.ts  # Error handling middleware
├── routes/
│   ├── index.ts         # Main router
│   ├── auth.ts          # Authentication routes
│   └── users.ts         # User management routes
└── index.ts             # Main application file
```

## 🔧 Configuration

### Database Configuration (`config/database.ts`)
- Centralized Prisma client setup
- Global instance management
- Graceful shutdown handling

### Auth Configuration (`config/auth.ts`)
- Better-auth setup with environment validation
- Social providers configuration (Google OAuth)
- Session and JWT configuration
- Custom callbacks for user/session data

## 🛡️ Middleware

### Authentication Middleware (`middleware/auth.ts`)

#### `authenticateUser`
- Attaches user data to `req.user` if authenticated
- Doesn't fail if not authenticated
- Use for optional authentication

#### `requireAuth`
- Requires authentication to access route
- Returns 401 if not authenticated
- Use for protected routes

#### `optionalAuth`
- Similar to `authenticateUser` but more explicit
- Use when you want to handle auth state explicitly

#### Helper Functions
- `getUserId(req)` - Extract user ID from request
- `isAuthenticated(req)` - Check if user is authenticated

### Error Handling (`middleware/errorHandler.ts`)
- Centralized error handling
- Custom error classes
- Prisma error handling
- JWT error handling
- Development vs production error responses

## 🛣️ Routes

### Authentication Routes (`routes/auth.ts`)
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/status` - Check auth status
- `GET /api/auth/providers` - List available providers

### User Routes (`routes/users.ts`)
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users` - Get all users (admin)
- `GET /api/users/:id` - Get user by ID

## 🚀 Usage Examples

### Protecting Routes

```typescript
import { requireAuth } from "../middleware/auth";

// Protected route
router.get("/protected", requireAuth, (req, res) => {
  const userId = req.user.id;
  res.json({ message: "Protected data", userId });
});
```

### Optional Authentication

```typescript
import { optionalAuth } from "../middleware/auth";

// Optional auth route
router.get("/public", optionalAuth, (req, res) => {
  if (req.user) {
    res.json({ message: "Hello authenticated user", user: req.user });
  } else {
    res.json({ message: "Hello guest" });
  }
});
```

### Using User Data

```typescript
import { getUserId, isAuthenticated } from "../middleware/auth";

router.get("/data", requireAuth, (req, res) => {
  const userId = getUserId(req);
  const authenticated = isAuthenticated(req);
  
  res.json({ userId, authenticated });
});
```

## 🔐 Environment Variables

Create a `.env` file with the following variables:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/your_database"

# Frontend
FRONTEND_URL=http://localhost:5173

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## 🔄 API Endpoints

### Authentication
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout
- `GET /api/auth/status` - Check auth status
- `GET /api/auth/providers` - List providers

### Users
- `GET /api/users/profile` - Get profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID

### System
- `GET /api/health` - Health check
- `GET /api` - API info
- `GET /db-health` - Database health

## 🛠️ Development

### Running the Server
```bash
npm run dev
```

### Database Commands
```bash
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run migrations
npm run db:studio    # Open Prisma Studio
```

### Type Checking
```bash
npm run type-check
```

## 🔒 Security Features

- **CORS Configuration** - Properly configured for frontend
- **Helmet** - Security headers
- **Input Validation** - Request validation
- **Error Handling** - Secure error responses
- **Session Management** - Secure session handling
- **JWT Security** - Proper JWT configuration

## 📝 Best Practices

1. **Always use middleware** for authentication checks
2. **Validate environment variables** on startup
3. **Handle errors gracefully** with proper logging
4. **Use TypeScript** for type safety
5. **Separate concerns** with proper file structure
6. **Document your API** endpoints
7. **Test authentication flows** thoroughly

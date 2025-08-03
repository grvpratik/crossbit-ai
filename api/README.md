# API Project

A modern TypeScript API with clear modular structure and comprehensive exports.

## 🏗️ Project Structure

The project follows a clean, modular architecture with clear separation of concerns:

```
src/
├── index.ts                    # Main application exports
├── app.ts                      # Express app configuration  
├── server.ts                   # Server entry point
├── api/                        # API Layer
│   ├── index.ts               # API module exports
│   ├── controllers/           # Request handlers
│   └── routes/                # Route definitions
├── services/                   # Business Logic Layer
│   ├── index.ts              # Services module exports
│   ├── ai/                   # AI Services
│   ├── social/               # Social Media Services
│   └── onchain/              # Blockchain Services
├── middleware/                 # Express Middleware
├── utils/                      # Utility Functions
├── types/                      # TypeScript Type Definitions
├── db/                         # Database Layer
└── config/                     # Configuration
```

## 📦 Exports Structure

### Main Application Exports (`src/index.ts`)
```typescript
// Import everything from the main application
import { 
  chat, 
  walletAuth, 
  userService, 
  logger,
  authMiddleware 
} from './src'
```

### API Layer Exports (`src/api/index.ts`)
```typescript
// Import API components
import { 
  chatController, 
  walletAuthController,
  apiRouter 
} from './src/api'
```

### Services Exports (`src/services/index.ts`)
```typescript
// Import business logic services
import { 
  userService, 
  sessionService,
  chatService 
} from './src/services'

// Import specific service categories
import { chatService } from './src/services/ai'
import { twitterService } from './src/services/social'
import { pumpfunService } from './src/services/onchain/pumpfun'
```

### Middleware Exports (`src/middleware/index.ts`)
```typescript
// Import middleware
import { 
  authMiddleware, 
  errorMiddleware 
} from './src/middleware'
```

### Utils Exports (`src/utils/index.ts`)
```typescript
// Import utilities
import { 
  helper, 
  logger, 
  messageLimit 
} from './src/utils'
```

## 🚀 Getting Started

### Installation
```bash
npm install
# or
pnpm install
```

### Development
```bash
npm run dev
# or
pnpm dev
```

### Build
```bash
npm run build
# or
pnpm build
```

## 📋 Available Scripts

- `dev` - Start development server with hot reload
- `start` - Start production server
- `build` - Build the project
- `format` - Format code with Prettier
- `check-format` - Check code formatting

## 🔧 Key Features

- **Modular Architecture**: Clear separation of concerns with dedicated modules
- **Type Safety**: Full TypeScript support with proper type definitions
- **AI Integration**: Built-in AI services for chat and analysis
- **Blockchain Support**: Onchain services for blockchain interactions
- **Social Media Integration**: Twitter and social media services
- **Database Layer**: Prisma ORM with Redis caching
- **Error Handling**: Comprehensive error middleware
- **Logging**: Structured logging with Winston

## 📁 Module Details

### API Layer
- **Controllers**: Handle HTTP requests and responses
- **Routes**: Define API endpoints and routing logic

### Services Layer
- **AI Services**: Chat, tools, and AI registry
- **Social Services**: Twitter integration and social media
- **Onchain Services**: Blockchain interactions and PumpFun integration
- **User Services**: User management and authentication
- **Session Services**: Session handling and management

### Infrastructure
- **Middleware**: Authentication and error handling
- **Database**: Prisma client and Redis connections
- **Utils**: Helper functions, logging, and utilities
- **Types**: TypeScript type definitions

## 🔐 Environment Variables

Create a `.env` file with the following variables:

```env
DATABASE_URL="your-database-url"
REDIS_URL="your-redis-url"
# Add other environment variables as needed
```

## 📖 Documentation

For detailed documentation on the project structure and exports, see [STRUCTURE.md](./STRUCTURE.md).

## 🤝 Contributing

1. Follow the established file structure
2. Use the provided index files for exports
3. Maintain type safety with TypeScript
4. Follow the existing code style and formatting

## 📄 License

ISC License 
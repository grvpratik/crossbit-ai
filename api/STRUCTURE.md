# Project Structure & Exports

This document outlines the clear file/folder structure and exports for the API project.

## Directory Structure

```
src/
├── index.ts                    # Main application exports
├── app.ts                      # Express app configuration
├── server.ts                   # Server entry point
├── api/                        # API Layer
│   ├── index.ts               # API module exports
│   ├── controllers/           # Request handlers
│   │   ├── index.ts          # Controller exports
│   │   ├── chat.controller.ts
│   │   ├── walletAuth.controller.ts
│   │   ├── social.controller.ts
│   │   └── onchain.controller.ts
│   └── routes/                # Route definitions
│       ├── index.ts          # Route exports
│       ├── chat.routes.ts
│       ├── auth.route.ts
│       ├── social.route.ts
│       ├── onchain.route.ts
│       └── report.route.ts
├── services/                   # Business Logic Layer
│   ├── index.ts              # Services module exports
│   ├── user.ts               # User service
│   ├── session.ts            # Session service
│   ├── ai/                   # AI Services
│   │   ├── index.ts         # AI services exports
│   │   ├── chat.services.ts
│   │   ├── registry.ts
│   │   └── tools.ts
│   ├── social/               # Social Media Services
│   │   ├── index.ts         # Social services exports
│   │   └── twitter.ts
│   └── onchain/              # Blockchain Services
│       ├── index.ts         # Onchain services exports
│       ├── onchain.services.ts
│       ├── utils.ts
│       ├── constant.ts
│       └── pumpfun/          # PumpFun specific services
│           ├── index.ts     # PumpFun services exports
│           ├── rpc.ts
│           ├── pumpfun.api.ts
│           ├── volume.ts
│           ├── metadata.ts
│           ├── bondingCurve.ts
│           └── parser/       # PumpFun parsers
│               ├── index.ts # Parser exports
│               ├── parser.ts
│               ├── utils.ts
│               ├── types.ts
│               ├── layout.ts
│               └── base.ts
├── middleware/                 # Express Middleware
│   ├── index.ts              # Middleware exports
│   ├── auth.middleware.ts
│   └── error.middleware.ts
├── utils/                      # Utility Functions
│   ├── index.ts              # Utils exports
│   ├── helper.ts
│   ├── logger.ts
│   └── message-limit.ts
├── types/                      # TypeScript Type Definitions
│   ├── index.ts              # Types exports
│   └── session.types.ts
├── db/                         # Database Layer
│   ├── index.ts              # Database exports
│   ├── connection.ts
│   └── redis.ts
├── config/                     # Configuration
│   └── index.ts              # Config exports
└── generated/                  # Generated files
```

## Export Structure

### Main Application (`src/index.ts`)
```typescript
// Exports all modules from the src directory
export * from './api'
export * from './services'
export * from './middleware'
export * from './utils'
export * from './types'
export * from './db'
export * from './config'

// Default exports
export { default as app } from './app'
export { default as server } from './server'
```

### API Layer (`src/api/index.ts`)
```typescript
// API Module Exports
export * from './controllers'
export * from './routes'

// Default export for the main router
export { default as apiRouter } from './routes'
```

### Controllers (`src/api/controllers/index.ts`)
```typescript
// API Controllers
export * from './chat.controller'
export * from './walletAuth.controller'
export * from './social.controller'
export * from './onchain.controller'
```

### Routes (`src/api/routes/index.ts`)
```typescript
// Default export: Main API router
export default router

// Individual route exports
export { chatRoutes, authRoutes, onChainRoutes, socialRoutes, reportRoutes }
```

### Services (`src/services/index.ts`)
```typescript
// Services Module Exports
export * from './user'
export * from './session'

// AI Services
export * from './ai/chat.services'
export * from './ai/registry'

// Social Services
export * from './social'

// Onchain Services
export * from './onchain'
```

### AI Services (`src/services/ai/index.ts`)
```typescript
// AI Services Module Exports
export * from './chat.services'
export * from './registry'
export * from './tools'
```

### Social Services (`src/services/social/index.ts`)
```typescript
// Social Services Module Exports
export * from './twitter'
```

### Onchain Services (`src/services/onchain/index.ts`)
```typescript
// Onchain Services Module Exports
export * from './onchain.services'
export * from './utils'
export * from './constant'

// PumpFun Services
export * from './pumpfun'
```

### PumpFun Services (`src/services/onchain/pumpfun/index.ts`)
```typescript
// PumpFun Services Module Exports
export * from './rpc'
export * from './pumpfun.api'
export * from './volume'
export * from './metadata'
export * from './bondingCurve'
export * from './parser'
```

### Middleware (`src/middleware/index.ts`)
```typescript
// Middleware Module Exports
export * from './auth.middleware'
export * from './error.middleware'
```

### Utils (`src/utils/index.ts`)
```typescript
// Utils Module Exports
export * from './helper'
export * from './logger'
export * from './message-limit'
```

### Types (`src/types/index.ts`)
```typescript
// Types Module Exports
export * from './session.types'
```

### Database (`src/db/index.ts`)
```typescript
// Database Module Exports
export * from './connection'
export * from './redis'
```

### Configuration (`src/config/index.ts`)
```typescript
// Configuration Module Exports
// Add configuration exports here as they are created
```

## Usage Examples

### Importing from main application
```typescript
import { chat, walletAuth, userService, logger } from './src'
```

### Importing specific modules
```typescript
import { chatController } from './src/api/controllers'
import { chatRoutes } from './src/api/routes'
import { userService } from './src/services'
import { authMiddleware } from './src/middleware'
```

### Importing services
```typescript
import { chatService } from './src/services/ai'
import { twitterService } from './src/services/social'
import { pumpfunService } from './src/services/onchain/pumpfun'
```

## Benefits of This Structure

1. **Clear Separation of Concerns**: Each directory has a specific responsibility
2. **Easy Imports**: All modules can be imported from their respective index files
3. **Scalable**: New modules can be easily added to existing directories
4. **Maintainable**: Clear structure makes it easy to find and modify code
5. **Type Safety**: TypeScript exports ensure type safety across the application
6. **Modular**: Each layer can be developed and tested independently 
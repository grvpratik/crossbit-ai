# Crossbit - Monorepo

This is a monorepo containing both the API backend and UI frontend for the Crossbit project.

## Project Structure

```
Crossbit/
├── api/          # Backend API (Node.js/TypeScript)
├── ui/           # Frontend UI (React/Vite)
├── .gitignore    # Monorepo gitignore
└── README.md     # This file
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- pnpm (recommended) or npm
- Git

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd Crossbit
```

2. Install dependencies for both projects:
```bash
# Install API dependencies
cd api
pnpm install

# Install UI dependencies
cd ../ui
pnpm install
```

### Development

#### API Development

```bash
cd api
pnpm dev
```

The API will be available at `http://localhost:3000` (or the port specified in your environment).

#### UI Development

```bash
cd ui
pnpm dev
```

The UI will be available at `http://localhost:5173` (or the port specified by Vite).

### Building

#### API Build
```bash
cd api
pnpm build
```

#### UI Build
```bash
cd ui
pnpm build
```

## Contributing

1. Create a new branch for your feature
2. Make your changes in the appropriate directory (api/ or ui/)
3. Test your changes
4. Commit your changes with a descriptive message
5. Push your branch and create a pull request

## Common Issues and Solutions

### Node Modules Issues
If you encounter node_modules related issues:
```bash
# Remove all node_modules
rm -rf api/node_modules ui/node_modules

# Reinstall dependencies
cd api && pnpm install
cd ../ui && pnpm install
```

### Port Conflicts
If you get port conflicts:
- Check if the ports are already in use
- Update the port configuration in the respective project's config files
- Kill any existing processes using those ports

### Database Issues (API)
If you encounter database issues:
```bash
cd api
pnpm prisma generate
pnpm prisma db push
```

### Build Issues
If builds fail:
1. Clear cache: `pnpm clean` (if available)
2. Delete dist/build folders
3. Reinstall dependencies
4. Try building again

## Environment Variables

### API Environment Variables
Create a `.env` file in the `api/` directory with your database and other configuration.

### UI Environment Variables
Create a `.env` file in the `ui/` directory for any frontend-specific configuration.

## Scripts

### Root Level Scripts
You can add convenience scripts to the root package.json to manage both projects:

```json
{
  "scripts": {
    "dev:api": "cd api && pnpm dev",
    "dev:ui": "cd ui && pnpm dev",
    "dev": "concurrently \"pnpm dev:api\" \"pnpm dev:ui\"",
    "build:api": "cd api && pnpm build",
    "build:ui": "cd ui && pnpm build",
    "build": "pnpm build:api && pnpm build:ui",
    "install:all": "cd api && pnpm install && cd ../ui && pnpm install"
  }
}
```

## Deployment

Each project can be deployed independently:

- **API**: Deploy to your preferred backend hosting (Railway, Render, Heroku, etc.)
- **UI**: Deploy to Vercel, Netlify, or any static hosting service

Make sure to update environment variables and database connections for production. 
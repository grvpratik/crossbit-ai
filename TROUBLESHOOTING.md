# Troubleshooting Guide

This guide helps you resolve common issues that may occur when working with the UpMint monorepo.

## Common Issues

### 1. Node Modules Issues

**Problem**: Dependencies not found or version conflicts
```bash
Error: Cannot find module 'some-package'
```

**Solution**:
```bash
# Clean all node_modules
pnpm clean

# Reinstall all dependencies
pnpm install:all
```

### 2. Port Conflicts

**Problem**: Port already in use
```bash
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution**:
```bash
# Find processes using the port
lsof -i :3000
lsof -i :5173

# Kill the process
kill -9 <PID>

# Or use a different port in your environment variables
```

### 3. Database Connection Issues (API)

**Problem**: Database connection failed
```bash
Error: connect ECONNREFUSED
```

**Solution**:
```bash
cd api

# Generate Prisma client
pnpm prisma generate

# Push database schema
pnpm prisma db push

# Check your .env file has correct DATABASE_URL
```

### 4. Build Failures

**Problem**: Build process fails
```bash
Error: Build failed
```

**Solution**:
```bash
# Clean build artifacts
pnpm clean

# Clear cache
rm -rf api/.next ui/.vite

# Reinstall dependencies
pnpm install:all

# Try building again
pnpm build
```

### 5. TypeScript Errors

**Problem**: TypeScript compilation errors
```bash
Error: Type 'X' is not assignable to type 'Y'
```

**Solution**:
```bash
# Check TypeScript configuration
cat api/tsconfig.json
cat ui/tsconfig.json

# Regenerate Prisma types (for API)
cd api && pnpm prisma generate

# Clear TypeScript cache
rm -rf api/.tsbuildinfo ui/.tsbuildinfo
```

### 6. Environment Variables

**Problem**: Environment variables not loading
```bash
Error: DATABASE_URL is not defined
```

**Solution**:
```bash
# Check if .env files exist
ls -la api/.env
ls -la ui/.env

# Create .env files if missing
cp api/.env.example api/.env
cp ui/.env.example ui/.env

# Update with your actual values
```

### 7. Git Issues

**Problem**: Large files or unwanted files in Git
```bash
Error: File too large for Git
```

**Solution**:
```bash
# Check .gitignore is working
git status

# Remove unwanted files from Git
git rm --cached <file>
git commit -m "Remove unwanted files"

# For large files, use Git LFS if needed
```

### 8. Concurrent Development Issues

**Problem**: API and UI not syncing properly
```bash
Error: API endpoint not found
```

**Solution**:
```bash
# Ensure both are running
pnpm dev

# Check API is accessible
curl http://localhost:3000/health

# Check UI can reach API
curl http://localhost:5173
```

### 9. Memory Issues

**Problem**: Out of memory errors
```bash
Error: JavaScript heap out of memory
```

**Solution**:
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Or run with more memory
node --max-old-space-size=4096 your-script.js
```

### 10. Package Manager Issues

**Problem**: pnpm lock file conflicts
```bash
Error: Lockfile is out of sync
```

**Solution**:
```bash
# Remove lock files
rm pnpm-lock.yaml api/pnpm-lock.yaml ui/pnpm-lock.yaml

# Reinstall everything
pnpm install:all
```

## Getting Help

If you encounter issues not covered here:

1. Check the individual project README files:
   - `api/README.md`
   - `ui/README.md`

2. Check the logs for specific error messages

3. Ensure you're using the correct Node.js version (v18+)

4. Try running commands individually to isolate the issue

5. Check if the issue is specific to one project or affects both

## Development Tips

- Always run `pnpm install:all` after pulling changes
- Use `pnpm dev` to run both projects simultaneously
- Check the console output for both API and UI when debugging
- Keep your `.env` files up to date with the latest requirements 
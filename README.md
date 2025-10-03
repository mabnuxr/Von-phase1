# Revenue OS Frontend

Monorepo containing the Revenue OS application and design system components.

## Project Structure

```
revenue-os-frontend/
├── app/                      # Main application
├── design-components/        # Shared design system
└── package.json             # Workspace configuration
```

## Prerequisites

- Node.js (v18 or higher)
- npm (v8 or higher)

## Installation

### Quick Start (First-time Setup)

```bash
# 1. Copy environment configuration
cp .env.example .env

# 2. Clean up old workspace files (if migrating from old structure)
rm -rf app/node_modules app/package-lock.json design-components/node_modules design-components/package-lock.json

# 3. Install dependencies (use npm ci for CI/CD, npm install for development)
npm ci

# 4. You're ready to go! Run either:
npm run dev:app      # Start the app (http://localhost:5173)
npm run dev:design   # Start Storybook (http://localhost:6006)
```

### Detailed Setup

**Important:** Workspaces use a single `package-lock.json` at the root level. Never commit `app/package-lock.json` or `design-components/package-lock.json`.

**Option 1 - Clean install (recommended for CI/CD):**
```bash
# Remove old workspace files if they exist
rm -rf app/node_modules app/package-lock.json design-components/node_modules design-components/package-lock.json
npm ci
```

**Option 2 - Development install:**
```bash
# Remove old workspace files if they exist
rm -rf app/node_modules app/package-lock.json design-components/node_modules design-components/package-lock.json
npm install
```

Both commands will:
- Install all dependencies for both workspaces (app + design-components)
- Hoist packages to root node_modules (~1266 packages)
- Set up workspace symlinks automatically

**Note:** If `npm ci` only installs ~118 packages instead of ~1266, you have old workspace lock files. Delete them and reinstall.

### Environment Variables

All environment variables are managed at the **workspace root level** in `.env`:

- App-specific variables: `VITE_API_BASE_URL`, `VITE_SCALEKIT_*`
- Design components variables: `VITE_APP_ENV`, `VITE_ENABLE_DEBUG`, etc.

**Important:** Do NOT set `NODE_ENV=production` in `.env` as it will prevent devDependencies from installing.

---

## Development

### Run the Application (App)

**From project root:**
```bash
npm run dev:app
```

**Or from app folder:**
```bash
cd app
npm run dev
```

The app will be available at: **http://localhost:5173/**

### Run Storybook (Design Components)

**From project root:**
```bash
npm run dev:design
```

**Or from design-components folder:**
```bash
cd design-components
npm run storybook
```

Storybook will be available at: **http://localhost:6006/**

### Run Both Simultaneously

Open two terminal windows:

**Terminal 1 - App:**
```bash
npm run dev:app
```

**Terminal 2 - Storybook:**
```bash
npm run dev:design
```

---

## Production Builds

### Build Design Components Library

The design-components package must be built first as a library for the app to consume:

```bash
npm run build:design
```

This generates:
- `design-components/dist/index.esm.js` - ES module bundle
- `design-components/dist/index.js` - CommonJS bundle
- `design-components/dist/index.d.ts` - TypeScript definitions

### Build the Application

```bash
npm run build:app
```

This creates a production build in `app/dist/`

### Build Everything

To build both design-components library and app in sequence:

```bash
npm run build:all
```

### Build Storybook (Static)

To build Storybook as a static site for deployment:

**From project root:**
```bash
cd design-components && npm run build-storybook
```

**Or from design-components folder:**
```bash
cd design-components
npm run build-storybook
```

This creates a static build in `design-components/storybook-static/`

---

## Available Scripts

### Root Level Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:app` | Start app in development mode |
| `npm run dev:design` | Start Storybook in development mode |
| `npm run build:design` | Build design-components as library |
| `npm run build:app` | Build app for production |
| `npm run build:all` | Build design-components + app |

### App Scripts

From `app/` directory:

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Lint code |
| `npm run typecheck` | Run TypeScript type checking |

### Design Components Scripts

From `design-components/` directory:

| Command | Description |
|---------|-------------|
| `npm run storybook` | Start Storybook dev server |
| `npm run build-storybook` | Build Storybook static site |
| `npm run build` | Build library (dist/) |
| `npm run test` | Run tests |
| `npm run lint` | Lint code |
| `npm run typecheck` | Run TypeScript type checking |

---

## Workspace Architecture

This project uses **npm workspaces** for monorepo management:

- **app** consumes **design-components** via local workspace dependency
- No need to publish design-components to npm registry
- Changes to design-components are immediately available to app (after rebuild)

### How It Works

1. Design components are developed in `design-components/`
2. Components are exported from `design-components/src/index.ts`
3. Library is built to `design-components/dist/`
4. App imports from `@vonlabs/design-components`
5. Workspace creates symlink: `app/node_modules/@vonlabs/design-components` → `../../design-components`

### Using Design Components in App

```typescript
import { Button, Input, Chat } from '@vonlabs/design-components';

function MyComponent() {
  return <Button>Click me</Button>;
}
```

---

## Production Deployment

Both the app and Storybook are deployed separately via AWS App Runner with workspace-aware configurations.

### App Deployment (app/apprunner.yaml)

**Build Process:**
```bash
# 1. Navigate to workspace root (from app/ directory)
cd ..

# 2. Install all workspace dependencies
npm ci

# 3. Build design-components library first
npm run build:design

# 4. Build the app
npm run build:app
```

**Serve:**
```bash
cd app && npm run preview
# Serves from app/dist/ on port 4173
```

**Key Points:**
- AWS App Runner starts in `app/` directory
- Must navigate to root (`cd ..`) to access workspace
- Must build library BEFORE building app
- Environment variables set in apprunner.yaml or AWS console

### Storybook Deployment (design-components/apprunner.yaml)

**Build Process:**
```bash
# 1. Navigate to workspace root (from design-components/ directory)
cd ..

# 2. Install all workspace dependencies
npm ci

# 3. Build Storybook static site
cd design-components && npm run build-storybook
```

**Serve:**
```bash
cd design-components && npx serve storybook-static
# Serves from design-components/storybook-static/ on port 3000
```

**Key Points:**
- AWS App Runner starts in `design-components/` directory
- Must navigate to root (`cd ..`) to access workspace
- Storybook build doesn't need library build (uses source directly)

### CI/CD Pipeline Requirements

**Critical Rules:**

1. **Never set `NODE_ENV=production` before `npm ci`** - It will skip devDependencies
2. **Set `NODE_ENV=production` only during build** - For Vite optimization
3. **Always run from workspace root** - All commands expect workspace context
4. **Build order matters for app** - Library → App

**Example GitHub Actions:**

```yaml
# App Deployment
- name: Install dependencies
  run: npm ci

- name: Build library
  run: npm run build:design

- name: Build app
  run: npm run build:app
  env:
    NODE_ENV: production

- name: Deploy
  run: npm run preview --workspace=app
```

```yaml
# Storybook Deployment
- name: Install dependencies
  run: npm ci

- name: Build Storybook
  run: cd design-components && npm run build-storybook

- name: Deploy
  run: cd design-components && npx serve storybook-static
```

---

## Troubleshooting

### After `npm ci`, commands don't work

If you see "command not found" errors, ensure you don't have `NODE_ENV=production` set in your environment or `.env` file. Remove it if present:

```bash
# In .env, remove this line:
NODE_ENV=production
```

Then reinstall:
```bash
npm ci
```

### Storybook or App won't start

1. Clean reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

2. Verify workspace setup:
```bash
npm list @vonlabs/design-components --depth=0
```

### App can't find design-components (production builds only)

For production builds, you need to build the library first:
```bash
npm run build:design
npm run build:app
```

For development, this is not needed - Vite handles it automatically.

---

## Tech Stack

### App
- React 19.2.0
- React Router 7.9.1
- Vite 7.1.2
- TypeScript 5.8.3

### Design Components
- React 19.2.0
- rsuite 5.70.2
- Storybook 9.1.10
- Vite 7.1.2
- TypeScript 5.8.3
- Jest + Testing Library

---

## Contributing

1. Make changes in appropriate workspace (`app/` or `design-components/`)
2. If modifying design-components:
   - Add/update Storybook stories
   - Rebuild library: `npm run build:design`
   - Test in app: `npm run dev:app`
3. Run linting: `npm run lint`
4. Run type checking: `npm run typecheck`
5. Commit changes

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

## von-fe CLI

`von-fe` is the frontend CLI that wraps common development tasks behind a single command. It is entirely optional — **every `von-fe` command has a direct `npm` equivalent** and you can use whichever you prefer.

### Install the CLI

Run the setup script once after cloning the repo. It makes `bin/von-fe` executable, detects your Node binary (including nvm), and installs a `von-fe` wrapper into your PATH.

```bash
bash setup.sh
```

After installation, open a new terminal (or `source ~/.zshrc`) and verify:

```bash
von-fe help
```

> **Note:** `setup.sh` is idempotent — safe to re-run after pulling updates.

---

### First-time Environment Setup

You must configure your environment before starting the app. You can do this with `von-fe` or `npm` — both produce the same result.

#### Option A — von-fe (guided)

**Step 1:** Run init. This creates a `seed.cfg` file with all required environment keys (no values).

```bash
von-fe setup init
```

**Step 2:** Open `seed.cfg` and fill in your values.

```bash
# seed.cfg is your personal config file — it is gitignored
# Key variables to fill in:
#
#   VITE_API_BASE_URL          → backend API URL (e.g. http://localhost:8000)
#   VITE_SCALEKIT_AUTH_BASE_URL → your ScaleKit environment URL
#   VITE_SCALEKIT_CLIENT_ID    → your ScaleKit client ID
#   VITE_SCALEKIT_REDIRECT_URI → OAuth callback URL
```

**Step 3:** Re-run init. This copies `seed.cfg` → `.env` and runs `npm install` + builds design-components.

```bash
von-fe setup init
```

#### Option B — npm (manual)

```bash
# 1. Create .env manually
cp .env.example .env   # or copy from a teammate's .env

# 2. Edit .env and fill in your values, then:
npm run setup          # runs: npm install && npm run build:design
```

> Both options install the same dependencies and produce the same `.env` + `node_modules` result.

---

### ScaleKit Configuration

ScaleKit is used for SAML/OAuth authentication and organization management. Each developer needs their own ScaleKit environment credentials.

1. Sign up at [app.scalekit.com](https://app.scalekit.com) using your `@vonlabs.ai` email
2. Create a new environment/project in the dashboard
3. Copy the **Environment URL** → set as `VITE_SCALEKIT_AUTH_BASE_URL`
4. Generate **API credentials** and copy the **Client ID** → set as `VITE_SCALEKIT_CLIENT_ID`
5. Set `VITE_SCALEKIT_REDIRECT_URI` to `http://localhost:5173/callback` (or the port your app runs on)

The authorize/token/logout paths (`/oauth/authorize`, `/oauth/token`, `/oauth/logout`) are standard and do not need to be changed.

---

### Daily Development

| Task                    | von-fe                      | npm equivalent          |
| ----------------------- | --------------------------- | ----------------------- |
| Start app               | `von-fe dev up:app`         | `npm run dev:app`       |
| Start Storybook         | `von-fe dev up:storybook`   | `npm run dev:design`    |
| Stop app                | `von-fe dev down:app`       | Ctrl+C in the terminal  |
| Stop Storybook          | `von-fe dev down:storybook` | Ctrl+C in the terminal  |
| Tail app logs           | `von-fe logs app`           | —                       |
| Build everything        | `von-fe build`              | `npm run build:all`     |
| Build app only          | `von-fe build app`          | `npm run build:app`     |
| Build design-components | `von-fe build design`       | `npm run build:design`  |
| Lint                    | `von-fe lint`               | `npm run lint:all`      |
| Type check              | `von-fe typecheck`          | `npm run typecheck:all` |
| Clean node_modules      | `von-fe clean`              | `npm run clean`         |

> **`von-fe dev up:*`** starts services in the background and writes logs to `.von/logs/<service>.log`.
> Use `von-fe logs app` to tail the output without blocking your terminal.

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

| Command                | Description                         |
| ---------------------- | ----------------------------------- |
| `npm run dev:app`      | Start app in development mode       |
| `npm run dev:design`   | Start Storybook in development mode |
| `npm run build:design` | Build design-components as library  |
| `npm run build:app`    | Build app for production            |
| `npm run build:all`    | Build design-components + app       |

### App Scripts

From `app/` directory:

| Command             | Description                  |
| ------------------- | ---------------------------- |
| `npm run dev`       | Start development server     |
| `npm run build`     | Build for production         |
| `npm run preview`   | Preview production build     |
| `npm run lint`      | Lint code                    |
| `npm run typecheck` | Run TypeScript type checking |

### Design Components Scripts

From `design-components/` directory:

| Command                   | Description                  |
| ------------------------- | ---------------------------- |
| `npm run storybook`       | Start Storybook dev server   |
| `npm run build-storybook` | Build Storybook static site  |
| `npm run build`           | Build library (dist/)        |
| `npm run test`            | Run tests                    |
| `npm run lint`            | Lint code                    |
| `npm run typecheck`       | Run TypeScript type checking |

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

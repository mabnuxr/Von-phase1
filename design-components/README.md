# Revenue OS Frontend - Design Components

A React component library built with TypeScript, Vite, and Storybook.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Development
npm run dev          # Start dev server
npm run storybook    # Start Storybook

# Testing
npm test            # Run tests
npm run test:coverage  # Run tests with coverage

# Build
npm run build       # Build for production
npm run build-storybook  # Build Storybook
```

## 📦 Components

- **Button** - Customizable button with primary, secondary, and danger variants
- **Text** - Typography component with h1, h2, h3, body, and caption variants
- **ErrorBoundary** - Error handling wrapper for React components

## 🛠️ Tech Stack

- **React 18.3** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Storybook** - Component documentation
- **Jest** - Testing framework
- **ESLint & Prettier** - Code quality

## 📝 Scripts

| Script | Description |
|--------|-------------|
| `dev` | Start development server |
| `build` | Build for production |
| `lint` | Run ESLint |
| `format` | Format code with Prettier |
| `test` | Run tests |
| `storybook` | Start Storybook dev server |

## 🔧 Configuration

Environment variables are configured in `.env.*` files:
- `.env.development` - Development environment
- `.env.production` - Production environment
- `.env.example` - Example configuration

## 📊 CI/CD

GitHub Actions workflow runs:
- ✅ Linting & formatting checks
- ✅ TypeScript type checking  
- ✅ Tests with coverage thresholds
- ✅ Build verification
- ✅ Security audit

## 📄 License

Private
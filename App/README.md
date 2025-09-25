# ScaleKit Authentication App

A minimal React application with ScaleKit authentication (login/logout only).

## Prerequisites

- Node.js (v18 or higher)
- npm

## Installation

1. Install dependencies:
```bash
npm install
```

## Configuration

Create a `.env` file in the root directory with your ScaleKit credentials:

```env
VITE_SCALEKIT_CLIENT_ID=your_client_id
VITE_SCALEKIT_AUTH_BASE_URL=https://your-domain.scalekit.dev
VITE_SCALEKIT_AUTH_AUTHORIZE_PATH=/oauth/authorize
VITE_SCALEKIT_AUTH_TOKEN_PATH=/oauth/token
VITE_SCALEKIT_AUTH_LOGOUT_PATH=/logout
```

## Running the Application

### Development Mode (with hot reload)

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Production Build

1. Build the application:
```bash
npm run build
```

2. Preview the production build:
```bash
npm run preview
```

The preview will be available at `http://localhost:4173`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

## Features

- ScaleKit OAuth2/OIDC authentication
- PKCE flow for enhanced security
- Session management
- Secure logout with ScaleKit session termination

## Project Structure

```
src/
├── lib/           # Authentication logic
│   ├── auth.ts    # Token management
│   ├── authFlow.ts # OAuth flow
│   └── pkce.ts    # PKCE implementation
├── pages/         # Application pages
│   ├── RootGate.tsx   # Entry point
│   ├── Callback.tsx   # OAuth callback
│   ├── Dashboard.tsx  # Protected route
│   ├── Logout.tsx     # Logout handler
│   └── AuthStart.tsx  # Auth initiation
├── App.tsx        # Router setup
├── config.ts      # Configuration
└── main.tsx       # React entry point
```
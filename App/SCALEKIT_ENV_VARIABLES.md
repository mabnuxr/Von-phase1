# ScaleKit Environment Variables

## Updated Environment Variable Names

The environment variables have been renamed to use the `SCALEKIT_` prefix for better clarity and consistency:

### ✅ New Environment Variables (Required Changes)

| Variable | Description | Default Value | Required |
|----------|------------|---------------|----------|
| `VITE_SCALEKIT_CLIENT_ID` | Your ScaleKit Client ID | _(none)_ | ✅ **Required** |
| `VITE_SCALEKIT_AUTH_BASE_URL` | ScaleKit authentication base URL | `https://vonlabs-afcu5dgbaafqi.scalekit.dev` | Optional |
| `VITE_SCALEKIT_AUTHORIZE_PATH` | OAuth authorization endpoint path | `/oauth/authorize` | Optional |
| `VITE_SCALEKIT_TOKEN_PATH` | OAuth token endpoint path | `/oauth/token` | Optional |
| `VITE_SCALEKIT_LOGOUT_PATH` | OAuth logout endpoint path | `/logout` | Optional |
| `VITE_API_BASE_URL` | API base URL for your backend | `http://localhost:5176` | Optional |

### ❌ Old Environment Variables (Now Deprecated)

| Old Variable | New Variable |
|-------------|-------------|
| `VITE_CLIENT_ID` | `VITE_SCALEKIT_CLIENT_ID` |
| `VITE_AUTH_BASE_URL` | `VITE_SCALEKIT_AUTH_BASE_URL` |
| `VITE_AUTH_AUTHORIZE_PATH` | `VITE_SCALEKIT_AUTHORIZE_PATH` |
| `VITE_AUTH_TOKEN_PATH` | `VITE_SCALEKIT_TOKEN_PATH` |
| `VITE_AUTH_LOGOUT_PATH` | `VITE_SCALEKIT_LOGOUT_PATH` |

## Setup Instructions

### 1. Update Your Environment File

Create a `.env` file in your app root:

```bash
# ScaleKit Configuration
VITE_SCALEKIT_CLIENT_ID=your_scalekit_client_id_here

# Optional - only override if using custom ScaleKit instance
VITE_SCALEKIT_AUTH_BASE_URL=https://your-custom-scalekit.com

# Optional - only override if using custom paths
VITE_SCALEKIT_AUTHORIZE_PATH=/oauth/authorize
VITE_SCALEKIT_TOKEN_PATH=/oauth/token
VITE_SCALEKIT_LOGOUT_PATH=/logout

# Optional - your API backend URL
VITE_API_BASE_URL=http://localhost:5176
```

### 2. Configure ScaleKit Dashboard

Make sure your ScaleKit dashboard has the correct callback URL:
- **Allowed callback URLs**: `http://localhost:5173/callback` (development)
- **Allowed callback URLs**: `https://yourdomain.com/callback` (production)

### 3. Auto-Computed Values

The following values are automatically computed and don't need environment variables:
- **Redirect URI**: `${window.location.origin}/callback`

## Migration Guide

If you have existing environment variables, update them:

1. **Rename** all `VITE_CLIENT_ID` → `VITE_SCALEKIT_CLIENT_ID`
2. **Rename** all `VITE_AUTH_*` → `VITE_SCALEKIT_*` (except logout)
3. **Keep** `VITE_API_BASE_URL` unchanged

## Benefits of SCALEKIT_ Prefix

✅ **Clear Naming**: Instantly identifies ScaleKit-related configuration  
✅ **Namespace Separation**: Prevents conflicts with other auth providers  
✅ **Better Organization**: Groups all ScaleKit settings together  
✅ **Future-Proof**: Easy to add more ScaleKit-specific variables  

## Verification

After updating, verify your configuration works:

```bash
npm run test   # All tests should pass
npm run build  # Build should succeed
npm run dev    # Development server should start correctly
```

The app will automatically use the new environment variable names while maintaining backward compatibility with default values.

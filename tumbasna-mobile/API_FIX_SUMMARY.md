# API Configuration for Tumbasna Mobile App

## Issues Identified:
1. API timeout errors (ERR_TIMED_OUT)
2. No retry logic for failed requests
3. No timeout handling
4. Slow login and payment fetch
5. No fallback mechanism

## Solutions Implemented:

### 1. Created API Utility (src/utils/api.ts)
- ✅ Default timeout: 8 seconds
- ✅ Retry logic: 2 attempts with exponential backoff
- ✅ Proper error handling
- ✅ AbortController for timeout management

### 2. Key Changes Needed:

#### AppContext.tsx:
```typescript
// Add import at top
import { apiGet, apiPost, apiPatch, checkApiHealth } from '../utils/api';

// Add isApiOnline state
const [isApiOnline, setIsApiOnline] = useState(true);

// Replace fetch calls with:
// GET: await apiGet('/api/endpoint', { timeout: 6000, retry: 1 })
// POST: await apiPost('/api/endpoint', data, { timeout: 8000, retry: 2 })
// PATCH: await apiPatch('/api/endpoint', data, { timeout: 5000 })
```

#### OrderDetail.tsx:
```typescript
// Add timeout to fetch
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 10000);

const res = await fetch(url, {
  ...options,
  signal: controller.signal,
});

clearTimeout(timeoutId);
```

### 3. Recommended Timeouts:
- Login: 10 seconds (retry: 2)
- Products: 6 seconds (retry: 1)
- Orders: 5 seconds (retry: 1)
- Payment: 10 seconds (retry: 1)
- Profile: 5 seconds (retry: 1)

### 4. Error Messages:
- Timeout: "Koneksi ke server timeout. Silakan coba lagi."
- Network: "Tidak dapat terhubung ke server. Periksa koneksi internet Anda."
- Server Error: "Server sedang bermasalah. Silakan coba lagi nanti."


# Tesseract.js Worker Solutions for Next.js PWAs

## Problem Analysis

The error
`Failed to execute 'importScripts' on 'WorkerGlobalScope': The URL '/workers/tesseract/worker.min.js' is invalid`
occurs because:

1. **Relative URLs don't work in Web Workers** - Workers need absolute URLs
2. **CSP restrictions** - Content Security Policy blocks certain worker operations
3. **Next.js bundling issues** - Build system changes file paths

Based on research from
[Tesseract.js GitHub issues](https://github.com/naptha/tesseract.js/issues/868) and
[web development community](https://medium.com/@tempmailwithpassword/fixing-content-security-policy-problems-with-javascript-web-workers-and-stripe-js-0c6306089e89),
here are **three proven solutions**:

## Solution 1: Absolute URLs (Recommended) ⭐

**Pros**: Simple, follows documentation, works with CSP **Cons**: Requires knowing the full domain

### Implementation

1. **Use the new worker file**: `public/workers/ocr-worker-absolute.js`
2. **Update worker manager**: Already updated to use absolute URL worker
3. **Key changes**:

   ```javascript
   // Get current origin in worker
   const origin = self.location.origin;

   // Use absolute URLs for all paths
   importScripts(`${origin}/workers/tesseract/tesseract.min.js`);

   worker = await Tesseract.createWorker(language, 1, {
     langPath: `${origin}/workers/tesseract/`,
     workerPath: `${origin}/workers/tesseract/worker.min.js`,
     corePath: `${origin}/workers/tesseract/tesseract-core.wasm.js`,
   });
   ```

### Testing

```bash
npm run dev
# Navigate to https://localhost:3001/file-upload
# Upload Romanian ID and click "Extract Data"
# Should work without CSP violations
```

## Solution 2: Next.js External Packages

**Pros**: Handles bundling issues, works with server-side rendering **Cons**: More complex
configuration, may affect build size

### Implementation

Already configured in `next.config.ts`:

```typescript
experimental: {
  serverComponentsExternalPackages: ['tesseract.js'],
},
outputFileTracingIncludes: {
  '/api/**/*': ['./node_modules/**/*.wasm', './node_modules/**/*.proto'],
},
```

### Usage

```typescript
// In API routes or server components
import { createWorker } from 'tesseract.js';

const worker = await createWorker('ron', 1, {
  workerPath: './node_modules/tesseract.js/src/worker-script/node/index.js',
});
```

## Solution 3: Dynamic Blob Workers

**Pros**: No external files needed, works with strict CSP **Cons**: More complex, requires careful
CSP configuration

### Implementation

Use the `DynamicWorkerManager` class:

```typescript
import { useDynamicWorker } from '@/app/lib/workers/dynamic-worker-manager';

function MyComponent() {
  const { processImage, isLoading, result, error } = useDynamicWorker('ron');

  const handleExtract = async () => {
    await processImage(imageDataUrl);
  };

  return (
    <button onClick={handleExtract} disabled={isLoading}>
      {isLoading ? 'Processing...' : 'Extract Data'}
    </button>
  );
}
```

## CSP Configuration

All solutions require proper CSP headers in `lib/security-headers.ts`:

```typescript
'worker-src': [
  "'self'",
  'blob:', // For blob-based workers
  'data:', // For WASM workers
],
'connect-src': [
  "'self'",
  'data:', // Allow data URLs for WASM loading
  'blob:', // Allow blob URLs for worker communication
],
```

## Verification Steps

1. **Check Network Tab**: No CSP violations for worker files
2. **Check Console**: No "invalid URL" errors
3. **Check Application Tab**: Service Worker active
4. **Test OCR**: Should extract actual text from Romanian ID

## Expected Results

### Before Fix ❌

```
❌ CSP Violation: Refused to connect to 'data:application/octet-stream...'
❌ Worker Error: Failed to execute 'importScripts'... invalid URL
❌ Unknown worker messages
❌ Worker initialization failed
```

### After Fix ✅

```
✅ Service Worker: Activated securely
✅ Worker initialized successfully
✅ OCR processing started
✅ Text extraction completed
```

## Recommended Approach

1. **Start with Solution 1** (Absolute URLs) - simplest and most reliable
2. **If deployment issues occur**, try Solution 2 (External Packages)
3. **For strict CSP environments**, use Solution 3 (Dynamic Workers)

## File Status

- ✅ `public/workers/ocr-worker-absolute.js` - New absolute URL worker
- ✅ `next.config.ts` - External packages configuration
- ✅ `lib/security-headers.ts` - Enhanced CSP configuration
- ✅ `app/lib/workers/dynamic-worker-manager.ts` - Blob-based worker
- ✅ `app/lib/workers/ocr-worker-manager.ts` - Updated to use absolute worker

## References

- [Tesseract.js GitHub Issue #868](https://github.com/naptha/tesseract.js/issues/868)
- [CSP and Web Workers Guide](https://medium.com/@tempmailwithpassword/fixing-content-security-policy-problems-with-javascript-web-workers-and-stripe-js-0c6306089e89)
- [Next.js Web Workers Tutorial](https://blog.stackademic.com/optimizing-your-next-js-app-by-offloading-compute-intensive-tasks-from-main-thread-to-web-workers-bc2fe8e95a6d)
- [Next.js External Packages Documentation](https://nextjs.org/docs/app/api-reference/next-config-js/serverComponentsExternalPackages)

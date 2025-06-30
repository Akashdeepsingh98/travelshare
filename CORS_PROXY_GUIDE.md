# 🚀 Supabase CORS Proxy Guide

This guide explains how to deploy and use the Supabase Edge Function as a CORS proxy to fix "Failed to fetch" errors when dealing with external APIs that don't provide adequate CORS headers.

## 1. Deploy the CORS Proxy Function

First, you need to deploy the `cors-proxy` function to your Supabase project.

1.  **Install Supabase CLI** if you haven't already:
    ```bash
    npm install supabase --save-dev
    ```

2.  **Login to Supabase** (you only need to do this once):
    ```bash
    npx supabase login
    ```

3.  **Link your project** (replace `[PROJECT_ID]` with your actual Supabase project ID from the dashboard URL):
    ```bash
    npx supabase link --project-ref [PROJECT_ID]
    ```

4.  **Deploy the function**:
    ```bash
    npx supabase functions deploy cors-proxy
    ```

After deployment, the function will be available at an endpoint like `https://[PROJECT_ID].supabase.co/functions/v1/cors-proxy`.

## 2. How to Use the CORS Proxy in Your Frontend Code

Instead of making a `fetch` request directly to the problematic API, you will send your request to your new `cors-proxy` function, which will then forward it to the destination.

Here is an example of how to adapt your frontend code:

### Original Fetch (Example)

```javascript
// This might fail due to CORS issues
const response = await fetch('https://api.example.com/data', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({ key: 'value' })
});
```

### Using the CORS Proxy

To use the proxy, you wrap the original URL and fetch options inside a JSON object and send it to your Supabase function.

```javascript
import { supabase } from './lib/supabase'; // Your supabase client

async function fetchViaCorsProxy(url, options) {
  const { data, error } = await supabase.functions.invoke('cors-proxy', {
    body: { url, options }
  });

  if (error) {
    throw new Error(`CORS Proxy Error: ${error.message}`);
  }

  // The 'data' from the function is the raw response from the target API.
  // You need to manually construct a Response object to handle it like a normal fetch.
  // Note: This is a simplified example. Body might be text, blob, etc.
  return new Response(JSON.stringify(data), {
    status: 200, // This is tricky, the actual status is not easily available here
    headers: { 'Content-Type': 'application/json' }
  });
}

// Usage
async function getData() {
  try {
    const targetUrl = 'https://api.example.com/data';
    const fetchOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_API_KEY'
      },
      body: JSON.stringify({ key: 'value' })
    };

    const response = await fetchViaCorsProxy(targetUrl, fetchOptions);
    const result = await response.json();
    console.log('Success:', result);
  } catch (e) {
    console.error('Failed to fetch via proxy:', e);
  }
}

getData();
```

## When to Use This

-   When you are trying to connect to an external API from your frontend application.
-   When that external API does not have the correct CORS headers (e.g., `Access-Control-Allow-Origin`).
-   This is **NOT** needed for requests to your own Supabase database or auth endpoints, as `supabase-js` handles that correctly.
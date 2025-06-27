// Connection testing utility
export async function testSupabaseConnection(): Promise<{
  success: boolean;
  error?: string;
  details: any;
}> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Check if environment variables are available
  if (!supabaseUrl || !anonKey) {
    console.warn('❌ Missing Supabase environment variables');
    return {
      success: false,
      error: 'Missing Supabase configuration. Please check your .env file.',
      details: {
        hasUrl: !!supabaseUrl,
        hasKey: !!anonKey
      }
    };
  }

  console.info('🔍 Testing Supabase Connection...');
  console.info('URL:', supabaseUrl);
  console.info('Anon Key (first 20 chars):', anonKey?.substring(0, 20) + '...');

  try {
    // Test 1: Basic URL accessibility
    console.info('Test 1: Testing basic URL accessibility...');
    const basicResponse = await Promise.race([
      fetch(supabaseUrl, {
        method: 'GET',
        mode: 'cors'
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 5000)
      )
    ]) as Response;
    
    console.info('Basic fetch response status:', basicResponse.status);
    console.info('Basic fetch response headers:', Object.fromEntries(basicResponse.headers.entries()));

    // Test 2: Test REST API endpoint
    console.info('Test 2: Testing REST API endpoint...');
    const restResponse = await Promise.race([
      fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json'
        },
        mode: 'cors'
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 5000)
      )
    ]) as Response;

    console.info('REST API response status:', restResponse.status);
    console.info('REST API response headers:', Object.fromEntries(restResponse.headers.entries()));

    // Test 3: Test a simple query
    console.info('Test 3: Testing simple query...');
    const queryResponse = await Promise.race([
      fetch(`${supabaseUrl}/rest/v1/profiles?select=count`, {
        method: 'GET',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'count=exact'
        },
        mode: 'cors'
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 5000)
      )
    ]) as Response;

    console.info('Query response status:', queryResponse.status);
    
    if (queryResponse.ok) {
      const data = await queryResponse.text();
      console.info('Query response data:', data);
    }

    return {
      success: true,
      details: {
        basicStatus: basicResponse.status,
        restStatus: restResponse.status,
        queryStatus: queryResponse.status
      }
    };

  } catch (error) {
    console.warn('❌ Connection test failed:', error);
    
    // Analyze the error type
    let errorMessage = 'Unknown connection error';
    
    if (error instanceof TypeError && error.message?.includes('Failed to fetch')) {
      errorMessage = 'Network connectivity issue - cannot reach Supabase servers';
    } else if (error instanceof TypeError && error.message?.includes('CORS')) {
      errorMessage = 'CORS configuration issue';
    } else if (error instanceof Error && error.message === 'Request timeout') {
      errorMessage = 'Connection timeout - Supabase servers may be unreachable';
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
      details: {
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        errorMessage: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }
    };
  }
}

export function displayConnectionDiagnostics() {
  const diagnosticsHtml = `
    <div class="connection-diagnostics">
      <h3>🔧 Connection Issue Detected</h3>
      
      <div class="cors-warning">
        <h4>🚨 Most Likely Cause: CORS Configuration</h4>
        <p>The "Failed to fetch" error typically indicates that your Supabase project needs to allow requests from this domain.</p>
        
        <div class="cors-fix-steps">
          <h5>Quick Fix (2 minutes):</h5>
          <ol>
            <li>Open <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">Supabase Dashboard</a></li>
            <li>Select your project</li>
            <li>Go to <strong>Settings → API</strong></li>
            <li>Find the <strong>CORS</strong> section</li>
            <li>Add <code>${window.location.origin}</code> to allowed origins</li>
            <li>Save changes and refresh this page</li>
          </ol>
        </div>
      </div>
      
      <div class="diagnostic-steps">
        <h4>Other things to check if CORS fix doesn't work:</h4>
        <ol>
          <li>
            <strong>Supabase Project Status:</strong>
            <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">
              Check your Supabase Dashboard
            </a>
            - Ensure your project is active and not paused
          </li>
          <li>
            <strong>Direct URL Test:</strong>
            <a href="${import.meta.env.VITE_SUPABASE_URL}" target="_blank" rel="noopener noreferrer">
              Test your Supabase URL directly
            </a>
            - This should show a Supabase page, not an error
          </li>
          <li>
            <strong>Network Connection:</strong>
            - Check your internet connection
            - Disable VPN if active
            - Try a different network if possible
          </li>
          <li>
            <strong>Browser Issues:</strong>
            - Clear browser cache and cookies
            - Disable browser extensions temporarily
            - Try an incognito/private window
          </li>
          <li>
            <strong>Firewall/Security:</strong>
            - Check if corporate firewall is blocking Supabase
            - Ensure antivirus isn't blocking the connection
          </li>
        </ol>
      </div>
      
      <div class="current-config">
        <h4>Current Configuration:</h4>
        <p><strong>Supabase URL:</strong> <code>${import.meta.env.VITE_SUPABASE_URL}</code></p>
        <p><strong>Environment:</strong> <code>${import.meta.env.MODE}</code></p>
        <p><strong>Local URL:</strong> <code>${window.location.origin}</code></p>
        <p><strong>Current Protocol:</strong> <code>${window.location.protocol}</code></p>
      </div>
      
      <div class="troubleshooting-tips">
        <h4>Common Issues:</h4>
        <ul>
          <li><strong>HTTPS/HTTP Mismatch:</strong> If you're using HTTPS locally, ensure your Supabase project allows HTTPS connections</li>
          <li><strong>CORS Issues:</strong> Add <code>${window.location.origin}</code> to your Supabase project's allowed origins</li>
          <li><strong>Network Blocking:</strong> Check if your firewall or antivirus is blocking the connection</li>
          <li><strong>Project Status:</strong> Verify your Supabase project is active and not paused</li>
        </ul>
      </div>
      
      <div class="test-actions">
        <button id="run-connection-test" class="test-btn">Run Connection Test</button>
        <button id="retry-connection" class="retry-btn">Retry Connection</button>
      </div>
      
      <div id="test-results" class="test-results" style="display: none;"></div>
    </div>
  `;
  
  return diagnosticsHtml;
}
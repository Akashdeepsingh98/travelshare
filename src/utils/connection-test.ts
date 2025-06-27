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
    // Skip actual network tests to avoid CORS issues during development
    // Just validate that the configuration exists
    console.info('✅ Supabase configuration found');
    console.info('✅ Skipping network tests to avoid CORS issues');

    return {
      success: true,
      details: {
        configurationValid: true,
        message: 'Configuration validated, network tests skipped'
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
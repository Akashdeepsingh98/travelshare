export function createMCPTestGuide(): HTMLElement {
  const guide = document.createElement('div');
  guide.className = 'mcp-test-guide';
  
  // Get the current origin and replace the port for the mock server
  const currentOrigin = window.location.origin;
  const mockServerUrl = currentOrigin.includes('localhost:5173') 
    ? currentOrigin.replace('5173', '54321') + '/functions/v1/mock-mcp-server'
    : `${currentOrigin}/functions/v1/mock-mcp-server`;
  
  guide.innerHTML = `
    <div class="mcp-guide-content">
      <h2>🔌 MCP Server Testing Guide</h2>
      
      <div class="guide-section">
        <h3>Step 1: Add Mock MCP Server</h3>
        <p>Go to your Profile → Manage MCP Servers and add this test server:</p>
        <div class="code-block">
          <strong>Name:</strong> Test Restaurant Server<br>
          <strong>Description:</strong> Mock restaurant data for testing<br>
          <strong>Category:</strong> Restaurant<br>
          <strong>Endpoint:</strong> ${mockServerUrl}<br>
          <strong>API Key:</strong> (leave empty - no authentication required)
        </div>
        <div class="guide-note">
          <strong>Important:</strong> Leave the API Key field empty. This mock server doesn't require authentication.
        </div>
      </div>
      
      <div class="guide-section">
        <h3>Step 2: Test Connection</h3>
        <p>Click "Test Connection" to verify the MCP server is working. You should see:</p>
        <ul>
          <li>✅ Connection successful!</li>
          <li>Server name: TravelShare Restaurant MCP Server</li>
          <li>Available tools: search_restaurants, get_restaurant_details, check_availability</li>
        </ul>
      </div>
      
      <div class="guide-section">
        <h3>Step 3: Try AI Chat Queries</h3>
        <p>Go to AI Chat and try these example queries:</p>
        <ul>
          <li>"What restaurants are available in Tokyo?"</li>
          <li>"Find Italian restaurants"</li>
          <li>"Show me restaurants with ramen"</li>
          <li>"What's available for dinner in Paris?"</li>
          <li>"Tell me about Thai restaurants"</li>
          <li>"Find restaurants in Bangkok"</li>
          <li>"What Mexican food is available?"</li>
        </ul>
      </div>
      
      <div class="guide-section">
        <h3>Mock Data Available</h3>
        <p>The test server includes restaurants from:</p>
        <ul>
          <li>🇯🇵 Tokyo Ramen House (Tokyo, Japan) - Japanese cuisine</li>
          <li>🇮🇹 Pasta Bella (Rome, Italy) - Italian cuisine</li>
          <li>🇫🇷 Le Petit Bistro (Paris, France) - French cuisine</li>
          <li>🇹🇭 Spice Garden (Bangkok, Thailand) - Thai cuisine</li>
          <li>🇲🇽 Taco Libre (Mexico City, Mexico) - Mexican cuisine</li>
        </ul>
      </div>
      
      <div class="guide-section">
        <h3>Troubleshooting</h3>
        <p>If you encounter issues:</p>
        <ul>
          <li><strong>Authentication failed:</strong> Make sure the API Key field is empty</li>
          <li><strong>Connection timeout:</strong> Check that the endpoint URL is correct</li>
          <li><strong>Server not found:</strong> Verify the URL format and try again</li>
          <li><strong>No MCP data in AI chat:</strong> Ensure the server is marked as "Active"</li>
        </ul>
      </div>
      
      <div class="guide-note">
        <strong>Note:</strong> This is a mock server for testing. In production, you would connect to real restaurant APIs or booking systems that may require authentication.
      </div>
    </div>
  `;
  
  return guide;
}
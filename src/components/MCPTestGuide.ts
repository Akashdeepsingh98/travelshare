export function createMCPTestGuide(): HTMLElement {
  const guide = document.createElement('div');
  guide.className = 'mcp-test-guide';
  
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
          <strong>Endpoint:</strong> ${window.location.origin.replace('5173', '54321')}/functions/v1/mock-mcp-server<br>
          <strong>API Key:</strong> (leave empty)
        </div>
      </div>
      
      <div class="guide-section">
        <h3>Step 2: Test Connection</h3>
        <p>Click "Test Connection" to verify the MCP server is working.</p>
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
        </ul>
      </div>
      
      <div class="guide-section">
        <h3>Mock Data Available</h3>
        <p>The test server includes restaurants from:</p>
        <ul>
          <li>🇯🇵 Tokyo Ramen House (Tokyo, Japan)</li>
          <li>🇮🇹 Pasta Bella (Rome, Italy)</li>
          <li>🇫🇷 Le Petit Bistro (Paris, France)</li>
          <li>🇹🇭 Spice Garden (Bangkok, Thailand)</li>
          <li>🇲🇽 Taco Libre (Mexico City, Mexico)</li>
        </ul>
      </div>
      
      <div class="guide-note">
        <strong>Note:</strong> This is a mock server for testing. In production, you would connect to real restaurant APIs or booking systems.
      </div>
    </div>
  `;
  
  return guide;
}
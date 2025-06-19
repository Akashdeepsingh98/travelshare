export function createMCPTestGuide(): HTMLElement {
  const guide = document.createElement('div');
  guide.className = 'mcp-test-guide';
  
  // Get the current origin and replace the port for the mock server
  const currentOrigin = window.location.origin;
  const mockServerUrl = currentOrigin.includes('localhost:5173') 
    ? currentOrigin.replace('5173', '54321') + '/functions/v1/mock-mcp-server-static'
    : `${currentOrigin}/functions/v1/mock-mcp-server-static`;
  
  guide.innerHTML = `
    <div class="mcp-guide-content">
      <h2>🔌 MCP Server Testing Guide (Static Data)</h2>
      
      <div class="guide-section">
        <h3>Step 1: Add Static Mock MCP Server</h3>
        <p>Go to your Profile → Manage MCP Servers and add this test server:</p>
        <div class="code-block">
          <strong>Name:</strong> Static Restaurant Data<br>
          <strong>Description:</strong> Fixed restaurant data for AI extraction testing<br>
          <strong>Category:</strong> Restaurant<br>
          <strong>Endpoint:</strong> ${mockServerUrl}<br>
          <strong>API Key:</strong> (leave empty - no authentication required)
        </div>
        <div class="guide-note">
          <strong>Important:</strong> Leave the API Key field empty. This mock server doesn't require authentication and always returns the same data.
        </div>
      </div>
      
      <div class="guide-section">
        <h3>Step 2: Test Connection</h3>
        <p>Click "Test Connection" to verify the MCP server is working. You should see:</p>
        <ul>
          <li>✅ Connection successful!</li>
          <li>Server name: TravelShare Static Mock MCP Server</li>
          <li>Available tools: search_restaurants</li>
        </ul>
      </div>
      
      <div class="guide-section">
        <h3>Step 3: Try AI Chat Queries</h3>
        <p>Go to AI Chat and try these example queries. The AI will receive the <strong>entire fixed dataset</strong> from the mock server and then use Gemini to extract and summarize the information:</p>
        <ul>
          <li>"What restaurants are available?"</li>
          <li>"Show me Italian restaurants"</li>
          <li>"Find restaurants in London"</li>
          <li>"What's the highest rated restaurant?"</li>
          <li>"Which restaurants are available for booking?"</li>
          <li>"Tell me about Japanese cuisine options"</li>
          <li>"What are the price ranges of the restaurants?"</li>
          <li>"Which restaurant serves the best sushi?"</li>
        </ul>
      </div>
      
      <div class="guide-section">
        <h3>How It Works</h3>
        <p>This static mock server demonstrates AI extraction capabilities:</p>
        <ul>
          <li><strong>Fixed Data:</strong> The server always returns the same 5 restaurants regardless of the query</li>
          <li><strong>AI Processing:</strong> Gemini receives the full dataset and extracts relevant information based on your question</li>
          <li><strong>Smart Filtering:</strong> The AI understands context and provides targeted answers from the complete data</li>
          <li><strong>No Server Logic:</strong> All intelligence comes from the AI, not the mock server</li>
        </ul>
      </div>
      
      <div class="guide-section">
        <h3>Static Data Provided to AI</h3>
        <p>The mock server always provides this complete dataset to the AI:</p>
        <div class="code-block">
          🍽️ <strong>Global Eats Cafe</strong> (New York, USA)<br>
          &nbsp;&nbsp;&nbsp;Cuisine: International | Rating: 4.5⭐ | Price: $$<br>
          &nbsp;&nbsp;&nbsp;Specialties: World Fusion Bowl, International Tapas, Global Street Food<br>
          &nbsp;&nbsp;&nbsp;Hours: 8:00 AM - 10:00 PM | Status: Available<br><br>
          
          🍽️ <strong>Spice Route Bistro</strong> (London, UK)<br>
          &nbsp;&nbsp;&nbsp;Cuisine: Indian | Rating: 4.7⭐ | Price: $$$<br>
          &nbsp;&nbsp;&nbsp;Specialties: Butter Chicken, Biryani, Tandoori Platter<br>
          &nbsp;&nbsp;&nbsp;Hours: 12:00 PM - 11:00 PM | Status: Limited Seats<br><br>
          
          🍽️ <strong>La Petite Creperie</strong> (Paris, France)<br>
          &nbsp;&nbsp;&nbsp;Cuisine: French | Rating: 4.2⭐ | Price: $$<br>
          &nbsp;&nbsp;&nbsp;Specialties: Sweet Crepes, Savory Galettes, French Onion Soup<br>
          &nbsp;&nbsp;&nbsp;Hours: 7:00 AM - 9:00 PM | Status: Available<br><br>
          
          🍽️ <strong>Sakura Sushi Bar</strong> (Tokyo, Japan)<br>
          &nbsp;&nbsp;&nbsp;Cuisine: Japanese | Rating: 4.8⭐ | Price: $$$$<br>
          &nbsp;&nbsp;&nbsp;Specialties: Omakase, Fresh Sashimi, Specialty Rolls<br>
          &nbsp;&nbsp;&nbsp;Hours: 5:00 PM - 12:00 AM | Status: Fully Booked<br><br>
          
          🍽️ <strong>Mama Mia Pizzeria</strong> (Rome, Italy)<br>
          &nbsp;&nbsp;&nbsp;Cuisine: Italian | Rating: 4.4⭐ | Price: $<br>
          &nbsp;&nbsp;&nbsp;Specialties: Margherita Pizza, Carbonara, Tiramisu<br>
          &nbsp;&nbsp;&nbsp;Hours: 11:00 AM - 11:00 PM | Status: Available
        </div>
      </div>
      
      <div class="guide-section">
        <h3>Testing Different Query Types</h3>
        <p>Try these specific queries to test AI extraction capabilities:</p>
        <ul>
          <li><strong>Location-based:</strong> "What restaurants are in Europe?"</li>
          <li><strong>Cuisine-based:</strong> "Show me Asian restaurants"</li>
          <li><strong>Price-based:</strong> "What are the budget-friendly options?"</li>
          <li><strong>Availability-based:</strong> "Which restaurants can I book right now?"</li>
          <li><strong>Rating-based:</strong> "What's the best rated restaurant?"</li>
          <li><strong>Time-based:</strong> "Which restaurants are open for breakfast?"</li>
          <li><strong>Specialty-based:</strong> "Where can I get good pizza?"</li>
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
          <li><strong>AI not using MCP data:</strong> Try more specific restaurant-related queries</li>
        </ul>
      </div>
      
      <div class="guide-note">
        <strong>Note:</strong> This static mock server demonstrates how AI can extract and filter information from a complete dataset, simulating real-world scenarios where MCP servers provide comprehensive data that needs intelligent processing.
      </div>
    </div>
  `;
  
  return guide;
}
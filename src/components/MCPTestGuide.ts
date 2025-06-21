import { createMCPManager } from './MCPManager';

export function createMCPTestGuide(): HTMLElement {
  const guide = document.createElement('div');
  guide.className = 'mcp-test-guide';
  
  // Get the current origin and replace the port for the mock server
  const currentOrigin = window.location.origin;
  const mockServerUrl = currentOrigin.includes('localhost:5173') 
    ? currentOrigin.replace('5173', '54321') + '/functions/v1/mock-mcp-server-static'
    : `${currentOrigin}/functions/v1/mock-mcp-server-static`;
  
  const mockFlightUrl = currentOrigin.includes('localhost:5173') 
    ? currentOrigin.replace('5173', '54321') + '/functions/v1/mock-flight-server'
    : `${currentOrigin}/functions/v1/mock-flight-server`;
  
  const mockTaxiUrl = currentOrigin.includes('localhost:5173') 
    ? currentOrigin.replace('5173', '54321') + '/functions/v1/mock-taxi-server'
    : `${currentOrigin}/functions/v1/mock-taxi-server`;
  
  const mockHotelUrl = currentOrigin.includes('localhost:5173') 
    ? currentOrigin.replace('5173', '54321') + '/functions/v1/mock-hotel-server'
    : `${currentOrigin}/functions/v1/mock-hotel-server`;
  
  guide.innerHTML = `
    <div class="mcp-guide-content">
      <h2>🔌 MCP Server Testing Guide</h2>
      
      <div class="guide-section">
        <h3>Step 1: Add Mock MCP Servers</h3>
        <p>Go to your Profile → Manage MCP Servers and add these test servers:</p>
        
        <div class="code-block">
          <strong>Name:</strong> Static Restaurant Data<br>
          <strong>Description:</strong> Fixed restaurant data for AI extraction testing<br>
          <strong>Category:</strong> Restaurant<br>
          <strong>Endpoint:</strong> ${mockServerUrl}<br>
          <strong>API Key:</strong> (leave empty - no authentication required)
        </div>
        
        <div class="code-block">
          <strong>Name:</strong> Flight Booking Service<br>
          <strong>Description:</strong> Flight search and booking information<br>
          <strong>Category:</strong> Flight<br>
          <strong>Endpoint:</strong> ${mockFlightUrl}<br>
          <strong>API Key:</strong> (leave empty - no authentication required)
        </div>
        
        <div class="code-block">
          <strong>Name:</strong> Taxi & Transportation<br>
          <strong>Description:</strong> Taxi and transportation services<br>
          <strong>Category:</strong> Taxi<br>
          <strong>Endpoint:</strong> ${mockTaxiUrl}<br>
          <strong>API Key:</strong> (leave empty - no authentication required)
        </div>
        
        <div class="code-block">
          <strong>Name:</strong> Hotel Booking Service<br>
          <strong>Description:</strong> Hotel search and booking information<br>
          <strong>Category:</strong> Hotel<br>
          <strong>Endpoint:</strong> ${mockHotelUrl}<br>
          <strong>API Key:</strong> (leave empty - no authentication required)
        </div>
        
        <div class="guide-note">
          <strong>Important:</strong> Leave the API Key field empty for all mock servers. These mock servers don't require authentication and always return the same data.
        </div>
      </div>
      
      <div class="guide-section">
        <h3>Step 2: Test Connections</h3>
        <p>Click "Test Connection" for each MCP server to verify they are working. You should see:</p>
        <ul>
          <li>✅ Connection successful!</li>
          <li>Server names and available tools will be displayed</li>
          <li>Each server provides different capabilities based on its category</li>
        </ul>
      </div>
      
      <div class="guide-section">
        <h3>Step 3: Try AI Chat with Post Context</h3>
        <p>There are two ways to use the AI chat with MCP data:</p>
        <ol>
          <li><strong>From a post:</strong> Click the "Ask AI" button on any post to start a chat with that post as context</li>
          <li><strong>Direct AI chat:</strong> Use the AI Chat tab in the main navigation</li>
        </ol>
        
        <p>Try these example queries with a post about a specific location:</p>
        <ul>
          <li>"How can I get to this place?"</li>
          <li>"What restaurants are near this location?"</li>
          <li>"Find me flights to this destination"</li>
          <li>"What hotels are available here?"</li>
          <li>"What's the best way to get around this area?"</li>
        </ul>
      </div>
      
      <div class="guide-section">
        <h3>How It Works</h3>
        <p>The mock MCP servers demonstrate how AI can integrate with business data:</p>
        <ul>
          <li><strong>Restaurant Server:</strong> Provides fixed restaurant data for different cuisines and locations</li>
          <li><strong>Flight Server:</strong> Offers flight information between major cities</li>
          <li><strong>Taxi Server:</strong> Provides transportation options in various cities</li>
          <li><strong>Hotel Server:</strong> Offers accommodation information in different locations</li>
        </ul>
        <p>When you ask a question about a post, the AI:</p>
        <ol>
          <li>Analyzes the post content and location</li>
          <li>Queries relevant MCP servers based on your question</li>
          <li>Combines the post context, MCP data, and general knowledge</li>
          <li>Provides a comprehensive response with real-time information</li>
        </ol>
      </div>
      
      <div class="guide-section">
        <h3>Example Scenarios</h3>
        
        <h4>Scenario 1: Restaurant Recommendations</h4>
        <p>For a post about Tokyo:</p>
        <div class="code-block">
          <strong>Ask:</strong> "What restaurants should I try near here?"<br>
          <strong>AI will:</strong> Query the restaurant MCP server and recommend Japanese restaurants like Sakura Sushi Bar
        </div>
        
        <h4>Scenario 2: Transportation Options</h4>
        <p>For a post about London:</p>
        <div class="code-block">
          <strong>Ask:</strong> "How can I get around this city?"<br>
          <strong>AI will:</strong> Query the taxi MCP server and suggest London Black Cabs and other transportation options
        </div>
        
        <h4>Scenario 3: Travel Planning</h4>
        <p>For a post about Rome:</p>
        <div class="code-block">
          <strong>Ask:</strong> "How can I plan a trip here from New York?"<br>
          <strong>AI will:</strong> Query the flight MCP server for New York to Rome flights and the hotel MCP server for accommodations
        </div>
      </div>
      
      <div class="guide-section">
        <h3>Troubleshooting</h3>
        <p>If you encounter issues:</p>
        <ul>
          <li><strong>Connection failed:</strong> Make sure the endpoint URLs are correct</li>
          <li><strong>No MCP data in AI chat:</strong> Ensure the servers are marked as "Active"</li>
          <li><strong>AI not using MCP data:</strong> Try more specific questions related to restaurants, flights, taxis, or hotels</li>
          <li><strong>Post context not working:</strong> Make sure you're clicking the "Ask AI" button on a post</li>
        </ul>
      </div>
      
      <div class="guide-note">
        <strong>Note:</strong> These mock servers demonstrate how AI can integrate with business data sources to provide real-time information. In a production environment, these would connect to actual business systems with live data.
      </div>
    </div>
  `;
  
  return guide;
}
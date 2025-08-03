// Add environment variable support and SSE
require('dotenv').config();
const axios = require('axios');
const EventSource = require('eventsource');

// TODO: Replace with your Apify API token
const APIFY_TOKEN = process.env.APIFY_TOKEN;

// TODO: Replace with the correct MCP server URL for your actor
const MCP_SERVER_URL = 'https://api.apify.com/v2/acts/kaitoeasyapi/twitter-x-data-tweet-scraper-pay-per-result-cheapest/runs';

async function main() {
  const token = process.env.APIFY_TOKEN;
  if (!token) {
    console.error('Please set your APIFY_TOKEN in the .env file');
    return;
  }

  const headers = { Authorization: `Bearer ${token}` };
  const actorId = 'kaitoeasyapi/twitter-x-data-tweet-scraper-pay-per-result-cheapest';
  const runUrl = `https://api.apify.com/v2/acts/${actorId}/runs`;
  const sseUrl = `https://mcp.apify.com/sse?actors=${actorId}`;

  // Start the actor run with initial message
  try {
    const runRes = await axios.post(
      runUrl,
      { message: 'Hello from MCP client!' },
      { headers: { 'Content-Type': 'application/json', ...headers } }
    );
    const runId = runRes.data.id;
    console.log('Actor run started with ID:', runId);

    // Connect to SSE stream for real-time messages
    console.log('Connecting to SSE for real-time updates...');
    const es = new EventSource(sseUrl, { headers });
    es.onmessage = (evt) => {
      console.log('SSE:', evt.data);
      // Upon specific event, you can send new messages via HTTP
    };
    es.onerror = (err) => {
      console.error('SSE error:', err);
      es.close();
    };
  } catch (error) {
    console.error('Error starting actor or connecting SSE:', error.message);
  }
}

main();

const axios = require('axios');

// TODO: Replace with your Apify API token
const APIFY_TOKEN = process.env.APIFY_TOKEN;

// TODO: Replace with the correct MCP server URL for your actor
const MCP_SERVER_URL = 'https://api.apify.com/v2/acts/kaitoeasyapi/twitter-x-data-tweet-scraper-pay-per-result-cheapest/runs';

async function main() {
  if (APIFY_TOKEN === 'YOUR_APIFY_TOKEN') {
    console.error('Please set your Apify API token in the APIFY_TOKEN environment variable or in the script.');
    return;
  }

  console.log('Authenticating and sending a message to the Apify MCP server...');

  try {
    // This is a simplified example of starting an actor (which is like sending a message).
    // The 'dialog' part might require a more specific implementation based on your actor's design.
    // This example starts a run and provides some input.
    const response = await axios.post(
      MCP_SERVER_URL,
      {
        // Your actor's input
        message: 'Hello from MCP client!',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${APIFY_TOKEN}`,
        },
      }
    );

    console.log('Successfully sent message to actor. Server response:');
    console.log(response.data);
  } catch (error) {
    console.error('Error interacting with Apify MCP server:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

main();

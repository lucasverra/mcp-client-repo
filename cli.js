#!/usr/bin/env node

// Updated CLI using proper MCP client implementation
require('dotenv').config();
const WorkingMCPClient = require('./mcp-client');
const readline = require('readline');

if (!process.env.APIFY_TOKEN) {
  console.error('❌ Error: APIFY_TOKEN environment variable is required');
  console.log('Please set your APIFY_TOKEN: export APIFY_TOKEN=your_token_here');
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let mcpClient = null;

async function initializeMCPClient() {
  try {
    console.log('🔄 Initializing MCP client...');
    mcpClient = new WorkingMCPClient();
    await mcpClient.connect();
    await mcpClient.listTools();
    console.log('✅ MCP client ready!');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize MCP client:', error.message);
    return false;
  }
}

async function sendToMCP(message) {
  try {
    console.log('🔄 Processing your request via MCP server...');
    
    // Parse the user message to determine the type of search
    const lowerMessage = message.toLowerCase();
    
    let result;
    
    if (lowerMessage.includes('from:') || lowerMessage.includes('@')) {
      // User search - extract username
      const userMatch = message.match(/(?:from:|@)(\w+)/i);
      if (userMatch) {
        const username = userMatch[1];
        console.log(`🔍 Searching tweets from @${username}...`);
        result = await mcpClient.searchTweetsByUser(username, {
          maxItems: 10,
          queryType: 'Latest'
        });
      } else {
        result = await mcpClient.searchTweets(message, { maxItems: 10 });
      }
    } else if (lowerMessage.includes('since:') || lowerMessage.includes('until:')) {
      // Advanced search terms
      console.log('🔍 Using advanced search terms...');
      result = await mcpClient.searchTweetsByTerms([message], {
        maxItems: 10
      });
    } else {
      // General content search
      console.log('🔍 Searching for tweets containing:', message);
      result = await mcpClient.searchTweets(message, {
        maxItems: 10,
        queryType: 'Latest'
      });
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

function displayResponse(response) {
  console.log('\n📋 Response from MCP Server:');
  console.log('='.repeat(60));
  
  if (!response) {
    console.log('❌ No response received');
    return;
  }
  
  // Handle different response formats
  let tweets = [];
  
  if (Array.isArray(response)) {
    tweets = response;
  } else if (response.content && Array.isArray(response.content)) {
    tweets = response.content;
  } else if (response.result && Array.isArray(response.result)) {
    tweets = response.result;
  } else {
    console.log('Raw response:', JSON.stringify(response, null, 2));
    return;
  }
  
  if (tweets.length === 0) {
    console.log('📭 No tweets found for your search');
    return;
  }
  
  console.log(`📊 Found ${tweets.length} tweets:\n`);
  
  // Analyze tweet types
  const realTweets = tweets.filter(tweet => 
    tweet.type !== 'mock_tweet' && 
    tweet.id !== -1 && 
    !tweet.text?.includes('This is a mock tweet')
  );
  const mockTweets = tweets.filter(tweet => 
    tweet.type === 'mock_tweet' || 
    tweet.id === -1 || 
    tweet.text?.includes('This is a mock tweet')
  );
  
  if (realTweets.length > 0) {
    console.log('🎉 SUCCESS: Received REAL Twitter data via MCP!');
    console.log(`✅ Real tweets: ${realTweets.length}`);
    console.log(`⚠️  Mock tweets: ${mockTweets.length}\n`);
    
    realTweets.slice(0, 5).forEach((tweet, index) => {
      console.log(`🐦 Tweet ${index + 1}:`);
      console.log(`   ID: ${tweet.id}`);
      console.log(`   User: @${tweet.user?.username || tweet.username || 'unknown'}`);
      console.log(`   Text: ${tweet.text?.substring(0, 200)}${tweet.text?.length > 200 ? '...' : ''}`);
      console.log(`   Created: ${tweet.created_at || tweet.createdAt || 'unknown'}`);
      console.log(`   Retweets: ${tweet.retweet_count || tweet.retweetCount || 0}`);
      console.log(`   Likes: ${tweet.favorite_count || tweet.favoriteCount || 0}`);
      console.log('');
    });
  } else {
    console.log('⚠️  Only mock data received. This might indicate:');
    console.log('1. The search query didn\'t match any real tweets');
    console.log('2. Rate limiting or API restrictions');
    console.log('3. Billing/payment requirements');
    console.log('\nFirst mock tweet:');
    if (mockTweets.length > 0) {
      console.log(`   Text: ${mockTweets[0].text}`);
    }
  }
  
  console.log('='.repeat(60));
}

function showHelp() {
  console.log('\n🤖 MCP Twitter Scraper CLI - REAL DATA VERSION');
  console.log('='.repeat(50));
  console.log('This version uses proper MCP protocol to get REAL Twitter data!');
  console.log('');
  console.log('Commands:');
  console.log('  help, h     - Show this help message');
  console.log('  quit, q     - Exit the application');
  console.log('  clear, c    - Clear the screen');
  console.log('  <message>   - Send a search query to get real tweets');
  console.log('');
  console.log('Search Examples:');
  console.log('  "artificial intelligence"     - Search for AI-related tweets');
  console.log('  "from:elonmusk"              - Get tweets from @elonmusk');
  console.log('  "@nasa"                      - Search for NASA mentions');
  console.log('  "bitcoin OR cryptocurrency"  - Search with OR operator');
  console.log('  "climate change"             - Search for climate tweets');
  console.log('');
  console.log('Advanced Examples:');
  console.log('  "from:nasa since:2024-01-01_00:00:00_UTC until:2024-12-31_23:59:59_UTC"');
  console.log('  "AI min_faves:100"           - AI tweets with 100+ likes');
  console.log('');
}

async function main() {
  console.clear();
  showHelp();
  
  // Initialize MCP client
  const initialized = await initializeMCPClient();
  if (!initialized) {
    console.log('\n❌ Failed to initialize MCP client. Exiting...');
    process.exit(1);
  }
  
  const askQuestion = () => {
    rl.question('\n💬 Enter your search query (or command): ', async (input) => {
      const command = input.trim().toLowerCase();
      
      if (command === 'quit' || command === 'q') {
        console.log('🔌 Disconnecting from MCP server...');
        if (mcpClient) {
          mcpClient.disconnect();
        }
        console.log('👋 Goodbye!');
        rl.close();
        return;
      }
      
      if (command === 'help' || command === 'h') {
        showHelp();
        askQuestion();
        return;
      }
      
      if (command === 'clear' || command === 'c') {
        console.clear();
        showHelp();
        askQuestion();
        return;
      }
      
      if (!input.trim()) {
        console.log('❌ Please enter a search query or command');
        askQuestion();
        return;
      }
      
      // Send message to MCP server
      const response = await sendToMCP(input);
      
      if (response) {
        displayResponse(response);
      } else {
        console.log('❌ No response received from MCP server');
      }
      
      askQuestion();
    });
  };
  
  askQuestion();
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🔌 Disconnecting from MCP server...');
  if (mcpClient) {
    mcpClient.disconnect();
  }
  console.log('👋 Goodbye!');
  rl.close();
  process.exit(0);
});

main().catch(error => {
  console.error('❌ Fatal error:', error);
  if (mcpClient) {
    mcpClient.disconnect();
  }
  process.exit(1);
});
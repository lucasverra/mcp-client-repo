// Updated API endpoint using proper MCP client implementation
const WorkingMCPClient = require('../../mcp-client');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Missing message in request body' });
  }

  const token = process.env.APIFY_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'APIFY_TOKEN not configured' });
  }

  let mcpClient = null;

  try {
    console.log('🔄 Initializing MCP client for web request...');
    mcpClient = new WorkingMCPClient();
    
    // Connect to MCP server
    await mcpClient.connect();
    
    // List tools to ensure connection is working
    await mcpClient.listTools();
    
    console.log('🔍 Processing search request:', message);
    
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
          maxItems: 20,
          queryType: 'Latest'
        });
      } else {
        result = await mcpClient.searchTweets(message, { maxItems: 20 });
      }
    } else if (lowerMessage.includes('since:') || lowerMessage.includes('until:')) {
      // Advanced search terms
      console.log('🔍 Using advanced search terms...');
      result = await mcpClient.searchTweetsByTerms([message], {
        maxItems: 20
      });
    } else {
      // General content search
      console.log('🔍 Searching for tweets containing:', message);
      result = await mcpClient.searchTweets(message, {
        maxItems: 20,
        queryType: 'Latest'
      });
    }

    // Process the result
    let tweets = [];
    
    if (Array.isArray(result)) {
      tweets = result;
    } else if (result?.content && Array.isArray(result.content)) {
      tweets = result.content;
    } else if (result?.result && Array.isArray(result.result)) {
      tweets = result.result;
    } else if (result) {
      // If it's not an array but has data, wrap it
      tweets = [result];
    }

    // Analyze tweet types for debugging
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

    console.log(`📊 Results: ${realTweets.length} real tweets, ${mockTweets.length} mock tweets`);

    // Return the response with metadata
    return res.status(200).json({ 
      response: tweets,
      metadata: {
        total: tweets.length,
        realTweets: realTweets.length,
        mockTweets: mockTweets.length,
        searchQuery: message,
        timestamp: new Date().toISOString(),
        source: 'MCP_SERVER'
      }
    });

  } catch (error) {
    console.error('❌ MCP API error:', error);
    
    // Provide detailed error information
    const errorResponse = {
      error: error.message,
      details: 'Failed to get data from MCP server',
      suggestions: [
        'Check your APIFY_TOKEN is valid',
        'Verify MCP server is accessible',
        'Try a different search query',
        'Check your internet connection'
      ]
    };
    
    const status = error.message.includes('timeout') ? 504 : 500;
    return res.status(status).json(errorResponse);
  } finally {
    // Always disconnect the MCP client
    if (mcpClient) {
      console.log('🔌 Disconnecting MCP client...');
      mcpClient.disconnect();
    }
  }
}
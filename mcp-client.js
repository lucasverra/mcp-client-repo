// Working MCP Client Implementation using mcp-remote
require('dotenv').config();
const { spawn } = require('child_process');
const EventEmitter = require('events');

class WorkingMCPClient extends EventEmitter {
  constructor() {
    super();
    this.apiToken = process.env.APIFY_TOKEN;
    this.actorId = 'kaitoeasyapi/twitter-x-data-tweet-scraper-pay-per-result-cheapest';
    this.mcpProcess = null;
    this.messageId = 0;
    this.pendingRequests = new Map();
    
    if (!this.apiToken) {
      throw new Error('APIFY_TOKEN environment variable is required');
    }
  }

  /**
   * Connect to MCP server using mcp-remote
   */
  async connect() {
    return new Promise((resolve, reject) => {
      console.log('🔌 Connecting to MCP server via mcp-remote...');
      
      this.mcpProcess = spawn('npx', [
        'mcp-remote',
        `https://mcp.apify.com/sse?actors=${this.actorId}`,
        '--header',
        `Authorization: Bearer ${this.apiToken}`
      ]);

      let connected = false;
      
      this.mcpProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log('📨 MCP Output:', output);
        
        try {
          // Try to parse JSON responses
          const lines = output.split('\n').filter(line => line.trim());
          for (const line of lines) {
            if (line.startsWith('{')) {
              const message = JSON.parse(line);
              this.handleMessage(message);
              
              if (!connected && message.result) {
                connected = true;
                console.log('✅ Connected to MCP server');
                resolve();
              }
            }
          }
        } catch (error) {
          // Not JSON, just log as regular output
        }
      });

      this.mcpProcess.stderr.on('data', (data) => {
        console.error('❌ MCP Error:', data.toString());
      });

      this.mcpProcess.on('close', (code) => {
        console.log(`MCP process exited with code ${code}`);
        this.emit('disconnected');
      });

      // Send initial tools/list request to test connection
      setTimeout(() => {
        this.sendMessage('tools/list').then(() => {
          if (!connected) {
            connected = true;
            resolve();
          }
        }).catch(reject);
      }, 2000);

      // Timeout after 15 seconds
      setTimeout(() => {
        if (!connected) {
          reject(new Error('Connection timeout'));
        }
      }, 15000);
    });
  }

  /**
   * Handle incoming messages from MCP server
   */
  handleMessage(message) {
    if (message.id && this.pendingRequests.has(message.id)) {
      const { resolve, reject } = this.pendingRequests.get(message.id);
      this.pendingRequests.delete(message.id);

      if (message.error) {
        reject(new Error(message.error.message || 'MCP server error'));
      } else {
        resolve(message.result);
      }
    }
  }

  /**
   * Send a message to the MCP server
   */
  async sendMessage(method, params = {}) {
    if (!this.mcpProcess) {
      throw new Error('Not connected to MCP server');
    }

    const messageId = ++this.messageId;
    const message = {
      jsonrpc: '2.0',
      id: messageId,
      method: method,
      params: params
    };

    console.log('📤 Sending MCP message:', JSON.stringify(message));

    return new Promise((resolve, reject) => {
      // Store the promise resolvers
      this.pendingRequests.set(messageId, { resolve, reject });

      // Send message to mcp-remote process
      this.mcpProcess.stdin.write(JSON.stringify(message) + '\n');

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(messageId)) {
          this.pendingRequests.delete(messageId);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  /**
   * List available tools from the MCP server
   */
  async listTools() {
    try {
      const result = await this.sendMessage('tools/list');
      console.log('🛠️ Available tools:', result.tools?.length || 0);
      return result;
    } catch (error) {
      console.error('❌ Failed to list tools:', error);
      throw error;
    }
  }

  /**
   * Call the Twitter scraper tool
   */
  async scrapeTweets(searchParams) {
    try {
      // The tool name from the MCP server response
      const toolName = 'kaitoeasyapi-slash-twitter-x-data-tweet-scraper-pay-per-result-c';
      
      console.log('🔧 Calling Twitter scraper tool with params:', searchParams);
      
      const result = await this.sendMessage('tools/call', {
        name: toolName,
        arguments: searchParams
      });
      
      console.log('✅ Twitter scraper result:', result);
      return result;
    } catch (error) {
      console.error('❌ Twitter scraping failed:', error);
      throw error;
    }
  }

  /**
   * Search for tweets using proper MCP protocol
   */
  async searchTweets(query, options = {}) {
    const defaultOptions = {
      maxItems: 10,
      queryType: "Latest",
      lang: "en"
    };

    const searchParams = {
      twitterContent: query,
      ...defaultOptions,
      ...options
    };

    return await this.scrapeTweets(searchParams);
  }

  /**
   * Search tweets by user
   */
  async searchTweetsByUser(username, options = {}) {
    const searchParams = {
      from: username,
      maxItems: 10,
      queryType: "Latest",
      ...options
    };

    return await this.scrapeTweets(searchParams);
  }

  /**
   * Search tweets by specific search terms
   */
  async searchTweetsByTerms(searchTerms, options = {}) {
    const searchParams = {
      searchTerms: Array.isArray(searchTerms) ? searchTerms : [searchTerms],
      maxItems: 10,
      queryType: "Latest",
      ...options
    };

    return await this.scrapeTweets(searchParams);
  }

  /**
   * Disconnect from the MCP server
   */
  disconnect() {
    if (this.mcpProcess) {
      console.log('🔌 Disconnecting from MCP server');
      this.mcpProcess.kill();
      this.mcpProcess = null;
    }
    
    // Reject any pending requests
    for (const [id, { reject }] of this.pendingRequests) {
      reject(new Error('Connection closed'));
    }
    this.pendingRequests.clear();
  }
}

module.exports = WorkingMCPClient;

// Example usage
async function main() {
  const client = new WorkingMCPClient();
  
  try {
    // Connect to MCP server
    await client.connect();
    
    // List available tools
    await client.listTools();
    
    // Test 1: Search for tweets about AI
    console.log('\n🔍 Test 1: Searching for AI tweets...');
    const aiTweets = await client.searchTweets('artificial intelligence', {
      maxItems: 5,
      queryType: 'Latest'
    });
    
    // Test 2: Search tweets from a specific user
    console.log('\n🔍 Test 2: Searching tweets from @elonmusk...');
    const elonTweets = await client.searchTweetsByUser('elonmusk', {
      maxItems: 3
    });
    
    // Test 3: Search using specific search terms
    console.log('\n🔍 Test 3: Searching with specific terms...');
    const specificTweets = await client.searchTweetsByTerms([
      'from:nasa since:2024-01-01_00:00:00_UTC until:2024-12-31_23:59:59_UTC'
    ], {
      maxItems: 5
    });
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.disconnect();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}
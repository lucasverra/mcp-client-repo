# 🤖 MCP Server Interface - REAL DATA VERSION

A **properly implemented** client application for interacting with Apify's MCP (Model Context Protocol) server, specifically designed to work with the Twitter/X data scraper and get **REAL Twitter data** instead of dummy data.

## ✅ FIXED: No More Dummy Data!

This version uses the **correct MCP protocol** to get real Twitter data at $0.25 per 1000 tweets.

## Features

- **Real Twitter Data**: Get actual tweets, not mock data
- **Proper MCP Protocol**: Uses correct JSON-RPC 2.0 messaging
- **Multiple Interfaces**: Both CLI and web-based interfaces
- **Data Quality Detection**: Distinguishes real vs mock tweets
- **Advanced Search**: Support for Twitter's advanced search syntax
- **Cost Effective**: Only $0.25 per 1000 real tweets

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env` file in the root directory with:
   ```
   APIFY_TOKEN=your_apify_token_here
   ACTOR_ID=kaitoeasyapi/twitter-x-data-tweet-scraper-pay-per-result-cheapest
   ```

3. **Get your Apify token**:
   - Sign up at [Apify](https://apify.com)
   - Go to your account settings
   - Copy your API token

## Usage

### Option 1: CLI Interface (Real Data)

1. **Run the MCP CLI**:
   ```bash
   npm run cli
   ```

2. **Search for real tweets**:
   - `"artificial intelligence"` - Search AI tweets
   - `"from:elonmusk"` - Get @elonmusk's tweets
   - `"bitcoin OR cryptocurrency"` - Search with OR
   - `"AI min_faves:100"` - AI tweets with 100+ likes

3. **Available commands**:
   - `help` or `h` - Show help
   - `quit` or `q` - Exit and disconnect
   - `clear` or `c` - Clear the screen
   - Any search query - Get real Twitter data

### Option 2: Test MCP Client Directly

1. **Test the MCP client**:
   ```bash
   npm run test
   ```

2. **This will automatically**:
   - Connect to MCP server
   - List available tools
   - Search for real tweets
   - Show data quality analysis

### Option 3: Web Interface

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Open your browser** and go to `http://localhost:3000`

3. **The web interface now uses the proper MCP API endpoint** at `/api/dialog`

## Example Requests (Real Data)

Try these search queries with the proper MCP client:

### Basic Searches
- `"artificial intelligence"` - AI-related tweets
- `"climate change"` - Environmental tweets
- `"bitcoin"` - Cryptocurrency tweets

### User-Specific Searches
- `"from:elonmusk"` - Tweets from Elon Musk
- `"from:nasa"` - NASA's tweets
- `"@openai"` - Mentions of OpenAI

### Advanced Searches
- `"from:nasa since:2024-01-01_00:00:00_UTC until:2024-12-31_23:59:59_UTC"`
- `"AI min_faves:100"` - AI tweets with 100+ likes
- `"bitcoin OR cryptocurrency"` - Either term
- `"machine learning -crypto"` - ML tweets excluding crypto

## Response Format (Real Data)

The proper MCP server returns **real Twitter data** in JSON format:

### Real Tweet Structure
```json
{
  "id": "1234567890123456789",
  "text": "Actual tweet content...",
  "user": {
    "username": "realuser",
    "name": "Real User"
  },
  "created_at": "2024-01-15T10:30:00.000Z",
  "retweet_count": 42,
  "favorite_count": 156,
  "reply_count": 23,
  "type": "real_tweet"
}
```

### Data Quality Indicators
- ✅ `tweet.type !== 'mock_tweet'`
- ✅ `tweet.id !== -1`
- ✅ Real usernames and engagement
- ✅ Current timestamps
- ❌ No "This is a mock tweet" text

## Troubleshooting

### Getting Dummy Data?
- ✅ **Use the proper MCP client**: `npm run cli-mcp` or `npm run test-mcp`
- ❌ **Don't use the old CLI**: `npm run cli` (gets dummy data)

### Common Issues
- **"APIFY_TOKEN not set"**: Create `.env` file with your token
- **"Connection timeout"**: MCP server might be busy, try again
- **"Only mock data"**: You're using the old implementation
- **Network errors**: Check internet and Apify service status

### Verify Real Data
Look for these signs you're getting real data:
- Tweet IDs are long numbers (not -1)
- Real usernames (not "mockuser")
- Current timestamps
- Actual engagement metrics
- No "mock tweet" text

## Architecture

### New (Real Data) Architecture
- **Frontend**: Next.js with React
- **Backend**: Next.js API routes (`/api/dialog-mcp-proper`)
- **MCP Client**: Proper MCP protocol implementation
- **MCP Server**: Apify's Twitter/X data scraper
- **Communication**: JSON-RPC 2.0 over SSE
- **Cost**: $0.25 per 1000 real tweets

### Old (Dummy Data) Architecture
- **Backend**: Direct Apify API calls (`/api/dialog`)
- **Communication**: HTTP REST API
- **Data**: Mock/demo data only
- **Cost**: Free (because it's fake)

## Development Scripts

### Real Data (Recommended)
- `npm run cli-mcp` - Proper MCP CLI interface
- `npm run test-mcp` - Test MCP client directly
- `npm run dev` - Web server (update to use new API)

### Legacy (Dummy Data)
- `npm run cli` - Old CLI (gets dummy data)
- `npm run test-old` - Test old implementation

### Standard
- `npm run build` - Build for production
- `npm run start` - Start production server

## 🎯 Key Difference

| Implementation | Data Quality | Protocol | Cost |
|---------------|-------------|----------|------|
| **New (MCP)** | ✅ Real tweets | MCP/JSON-RPC | $0.25/1000 |
| **Old (Direct)** | ❌ Mock data | HTTP REST | Free |

**Use the new MCP implementation to get real Twitter data!**

import { useCallback, useEffect, useState } from 'react'
import Button from '../components/Button'
import ClickCount from '../components/ClickCount'
import styles from '../styles/home.module.css'

function throwError() {
  console.log(
    // The function body() is not defined
    document.body()
  )
}

function Home() {
  const [count, setCount] = useState(0)
  // Dialog states
  const [dialogMsg, setDialogMsg] = useState('')
  const [dialogResponse, setDialogResponse] = useState([])
  const [loading, setLoading] = useState(false)
  const [conversationHistory, setConversationHistory] = useState([])
  
  const increment = useCallback(() => {
    setCount((v) => v + 1)
  }, [setCount])

  useEffect(() => {
    const r = setInterval(() => {
      increment()
    }, 1000)

    return () => {
      clearInterval(r)
    }
  }, [increment])

  const sendMessage = async () => {
    if (!dialogMsg.trim()) return;
    
    setLoading(true);
    const userMessage = dialogMsg;
    setDialogMsg('');
    
    try {
      const res = await fetch('/api/dialog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setDialogResponse(data.response);
        // Add to conversation history
        setConversationHistory(prev => [...prev, {
          user: userMessage,
          assistant: data.response,
          timestamp: new Date().toLocaleTimeString()
        }]);
      } else {
        console.error(data.error);
        setConversationHistory(prev => [...prev, {
          user: userMessage,
          assistant: { error: data.error },
          timestamp: new Date().toLocaleTimeString()
        }]);
      }
    } catch (err) {
      console.error(err);
      setConversationHistory(prev => [...prev, {
        user: userMessage,
        assistant: { error: 'Network error occurred' },
        timestamp: new Date().toLocaleTimeString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const formatResponse = (response) => {
    if (Array.isArray(response)) {
      return response.map((item, idx) => (
        <div key={idx} style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
            {JSON.stringify(item, null, 2)}
          </pre>
        </div>
      ));
    }
    return <pre>{JSON.stringify(response, null, 2)}</pre>;
  };

  return (
    <main className={styles.main}>
      <h1>🤖 MCP Server Interface</h1>
      <p>
        Interact with the Apify MCP server using natural language. This interface connects to the Twitter/X data scraper.
      </p>
      
      <hr className={styles.hr} />
      
      {/* Enhanced Dialog with MCP server */}
      <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
        <h2>💬 Chat with MCP Server</h2>
        
        {/* Input area */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <input
            type="text"
            value={dialogMsg}
            onChange={(e) => setDialogMsg(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type your natural language request (e.g., 'Search for tweets about AI')"
            style={{ 
              flex: 1,
              padding: '12px', 
              fontSize: '16px',
              border: '1px solid #ddd',
              borderRadius: '5px'
            }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !dialogMsg.trim()}
            style={{ 
              padding: '12px 20px',
              backgroundColor: loading ? '#ccc' : '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px'
            }}
          >
            {loading ? '🔄 Sending...' : '📤 Send'}
          </button>
        </div>

        {/* Conversation History */}
        {conversationHistory.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h3>📋 Conversation History</h3>
            <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '5px', padding: '10px' }}>
              {conversationHistory.map((entry, idx) => (
                <div key={idx} style={{ marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                  <div style={{ marginBottom: '5px' }}>
                    <strong>👤 You ({entry.timestamp}):</strong>
                    <div style={{ marginLeft: '20px', color: '#333' }}>{entry.user}</div>
                  </div>
                  <div>
                    <strong>🤖 Assistant:</strong>
                    <div style={{ marginLeft: '20px' }}>
                      {entry.assistant.error ? (
                        <span style={{ color: 'red' }}>❌ {entry.assistant.error}</span>
                      ) : (
                        formatResponse(entry.assistant)
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Latest Response */}
        {dialogResponse.length > 0 && !loading && (
          <div>
            <h3>📄 Latest Response:</h3>
            <div style={{ backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '5px', border: '1px solid #ddd' }}>
              {formatResponse(dialogResponse)}
            </div>
          </div>
        )}
      </div>

      <hr className={styles.hr} />
      
      {/* Original demo content */}
      <div>
        <p>
          Auto incrementing value. The counter won't reset after edits or if
          there are errors.
        </p>
        <p>Current value: {count}</p>
      </div>
      <hr className={styles.hr} />
      <div>
        <p>Component with state.</p>
        <ClickCount />
      </div>
      <hr className={styles.hr} />
      <div>
        <p>
          The button below will throw 2 errors. You'll see the error overlay to
          let you know about the errors but it won't break the page or reset
          your state.
        </p>
        <Button
          onClick={(e) => {
            setTimeout(() => document.parentNode(), 0)
            throwError()
          }}
        >
          Throw an Error
        </Button>
      </div>
      <hr className={styles.hr} />
    </main>
  )
}

export default Home

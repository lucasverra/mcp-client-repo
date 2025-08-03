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

  return (
    <main className={styles.main}>
      <h1>Fast Refresh Demo</h1>
      <p>
        Fast Refresh is a Next.js feature that gives you instantaneous feedback
        on edits made to your React components, without ever losing component
        state.
      </p>
      <hr className={styles.hr} />
      {/* Dialog with MCP server */}
      <div>
        <h2>Dialog with Actor</h2>
        <input
          type="text"
          value={dialogMsg}
          onChange={(e) => setDialogMsg(e.target.value)}
          placeholder="Type your message"
          style={{ padding: '8px', width: '60%' }}
        />
        <button
          onClick={async () => {
            setLoading(true)
            try {
              const res = await fetch('/api/dialog', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: dialogMsg }),
              })
              const data = await res.json()
              if (res.ok) setDialogResponse(data.response)
              else console.error(data.error)
            } catch (err) {
              console.error(err)
            } finally {
              setLoading(false)
            }
          }}
          disabled={loading || !dialogMsg}
          style={{ marginLeft: '8px', padding: '8px' }}
        >
          Send
        </button>
        {loading && <p>Loading...</p>}
        {dialogResponse.length > 0 && (
          <div>
            <h3>Response:</h3>
            <ul>
              {dialogResponse.map((item, idx) => (
                <li key={idx}>{JSON.stringify(item)}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
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

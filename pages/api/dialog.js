import axios from 'axios';

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
  const actorId = process.env.ACTOR_ID;
  const runUrl = `https://api.apify.com/v2/acts/${actorId}/runs`;

  try {
    // Start the actor run with the message
    const runRes = await axios.post(
      runUrl,
      { message },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const runId = runRes.data.id;
    // Poll the run's dataset for output
    const datasetUrl = `https://api.apify.com/v2/acts/${actorId}/runs/${runId}/dataset/items?format=json`;
    const startTime = Date.now();
    let items = [];
    while (Date.now() - startTime < 10000) {
      const itemsRes = await axios.get(datasetUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      items = itemsRes.data;
      if (Array.isArray(items) && items.length > 0) {
        return res.status(200).json({ response: items });
      }
      // wait 1s before retry
      await new Promise((r) => setTimeout(r, 1000));
    }

    return res.status(504).json({ error: 'Timeout waiting for actor response' });
  } catch (error) {
    console.error('Dialog handler error:', error);
    const status = error.response?.status || 500;
    const data = error.response?.data || error.message;
    return res.status(status).json({ error: data });
  }
}

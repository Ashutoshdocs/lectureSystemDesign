// ---------------------------------------------------------------------------
// Webhooks  ->  "used for event-based notifications"
// Reverse of REST: the server calls YOU. Subscribe a URL, then when an event
// fires the server POSTs the payload to every subscriber.
//
//   POST /api/webhooks/subscribe   { "url": "https://..." }
//   POST /api/webhooks/trigger     { "type": "order.created", "data": {...} }
//   POST /api/webhooks/receiver    <- built-in receiver so you can demo E2E
//   GET  /api/webhooks/receiver/log
//   GET  /api/webhooks/subscribers
// ---------------------------------------------------------------------------
const express = require('express');
const router = express.Router();

router.use(express.json());

const subscribers = new Set();
const deliveries = []; // what the built-in receiver has received

router.post('/subscribe', (req, res) => {
  const { url } = req.body || {};
  if (!url) return res.status(400).json({ error: 'url is required' });
  subscribers.add(url);
  res.status(201).json({ subscribed: url, totalSubscribers: subscribers.size });
});

router.get('/subscribers', (req, res) => res.json([...subscribers]));

// Fire an event -> deliver to all subscribers.
router.post('/trigger', async (req, res) => {
  const event = {
    id: `evt_${Date.now()}`,
    type: (req.body && req.body.type) || 'demo.event',
    data: (req.body && req.body.data) || { message: 'hello from webhook' },
    timestamp: new Date().toISOString(),
  };

  const results = [];
  for (const url of subscribers) {
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Webhook-Event': event.type },
        body: JSON.stringify(event),
      });
      results.push({ url, status: r.status });
    } catch (e) {
      results.push({ url, error: e.message });
    }
  }
  res.json({ event, delivered: results });
});

// Built-in receiver so the whole loop can be demoed without an external service.
router.post('/receiver', (req, res) => {
  deliveries.push({ received: req.body, at: new Date().toISOString() });
  res.status(200).json({ ok: true });
});

router.get('/receiver/log', (req, res) => res.json(deliveries));

module.exports = router;

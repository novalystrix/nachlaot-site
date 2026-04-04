const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

// Image proxy — avoids CORS for luxury-realestate-israel.com images
app.get('/api/proxy', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send('Missing url');

  try {
    const urlObj = new URL(url);
    const allowed = ['luxury-realestate-israel.com', 'nadlan-bneyzion.com', 'uzigil.co.il'];
    if (!allowed.some(d => urlObj.hostname.includes(d))) {
      return res.status(403).send('Domain not allowed');
    }
  } catch {
    return res.status(400).send('Invalid URL');
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Referer': 'https://luxury-realestate-israel.com/'
      }
    });
    if (!response.ok) return res.status(response.status).send('Fetch failed');

    const ct = response.headers.get('content-type');
    if (ct) res.set('Content-Type', ct);
    res.set('Cache-Control', 'public, max-age=86400');

    const buffer = Buffer.from(await response.arrayBuffer());
    res.send(buffer);
  } catch (err) {
    console.error('Proxy error:', err.message);
    res.status(500).send('Proxy failed');
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

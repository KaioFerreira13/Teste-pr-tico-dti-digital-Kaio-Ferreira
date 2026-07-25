export default async function handler(req, res) {
  const targetUrl = process.env.BACKEND_KEEPALIVE_URL || process.env.VITE_API_URL;

  if (!targetUrl) {
    return res.status(500).json({
      ok: false,
      error: 'BACKEND_KEEPALIVE_URL not configured',
    });
  }

  const normalizedUrl = targetUrl.replace(/\/+$/, '');
  const keepaliveUrl = `${normalizedUrl}/health/db`;

  try {
    const response = await fetch(keepaliveUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'vercel-cron-keepalive',
        Accept: 'application/json',
      },
    });

    const body = await response.text();

    return res.status(response.status).send(body);
  } catch (error) {
    return res.status(502).json({
      ok: false,
      error: 'Failed to reach backend keepalive endpoint',
    });
  }
}

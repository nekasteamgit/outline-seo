// Netlify Function — Outline SEO Analyzer
// Fetches a URL and returns heading structure (H1-H6)

const cheerio = require('cheerio');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const { url } = body;

  if (!url || !url.startsWith('http')) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Valid URL required' }) };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; OutlineSEO/1.0; +https://outline-seo.netlify.app)',
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return { statusCode: 502, headers, body: JSON.stringify({ error: `Target returned ${response.status}` }) };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const headings = [];
    $('h1, h2, h3, h4, h5, h6').each((_, el) => {
      headings.push({
        level: parseInt(el.tagName[1]),
        text: $(el).text().trim().replace(/\s+/g, ' '),
      });
    });

    const metrics = {
      total: headings.length,
      h1Count: headings.filter(h => h.level === 1).length,
      h2Count: headings.filter(h => h.level === 2).length,
      h3Count: headings.filter(h => h.level === 3).length,
      maxDepth: headings.length ? Math.max(...headings.map(h => h.level)) : 0,
      avgTextLength: headings.length
        ? Math.round(headings.reduce((a, h) => a + h.text.length, 0) / headings.length)
        : 0,
    };

    const issues = [];
    if (metrics.h1Count === 0) issues.push('No H1 tag found');
    if (metrics.h1Count > 1) issues.push(`Multiple H1 tags (${metrics.h1Count})`);
    if (metrics.maxDepth > 4) issues.push('Heading depth exceeds H4 — consider flattening');
    if (metrics.avgTextLength < 20) issues.push('Headings are very short on average');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        url,
        headings,
        metrics,
        issues,
        exported: headings.map(h => `${'  '.repeat(h.level - 1)}- ${h.text}`).join('\n'),
      }),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message || 'Analysis failed' }) };
  }
};

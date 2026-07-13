// Cloudflare Worker: proxies unknown grocery items to Claude for categorization.
// The Anthropic API key never reaches the browser — it lives only as a Worker secret.

const MODEL = 'claude-haiku-4-5-20251001';
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

// Must stay in sync with CATEGORY_ORDER in index.html.
const CATEGORY_KEYS = [
  'produce', 'bakery', 'deli', 'meat', 'dairy',
  'frozen', 'pantry', 'household', 'checkout', 'other'
];

const MAX_ITEMS = 100;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    if (url.pathname !== '/categorize') {
      return json({ error: 'Not found' }, 404);
    }
    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON body' }, 400);
    }

    const items = Array.isArray(body.items)
      ? body.items.filter((i) => typeof i === 'string' && i.trim().length > 0).slice(0, MAX_ITEMS)
      : [];

    if (items.length === 0) {
      return json({ results: {} });
    }

    try {
      const results = await classifyWithClaude(items, env.ANTHROPIC_API_KEY);
      return json({ results });
    } catch (err) {
      return json({ error: 'Classification failed', message: String(err && err.message ? err.message : err) }, 502);
    }
  },
};

async function classifyWithClaude(items, apiKey) {
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  const numberedList = items.map((item, i) => `${i}: ${item}`).join('\n');

  const tool = {
    name: 'assign_categories',
    description: 'Assign each numbered grocery item to exactly one grocery store category.',
    input_schema: {
      type: 'object',
      properties: {
        assignments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              index: { type: 'integer', description: 'The item number from the input list' },
              category: { type: 'string', enum: CATEGORY_KEYS },
            },
            required: ['index', 'category'],
          },
        },
      },
      required: ['assignments'],
    },
  };

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      temperature: 0,
      system:
        'You categorize grocery shopping list items into store departments. ' +
        `Valid categories are exactly: ${CATEGORY_KEYS.join(', ')}. ` +
        'Use "other" only if no category is a reasonable fit. ' +
        'Respond only by calling the assign_categories tool, with one assignment per item.',
      messages: [
        { role: 'user', content: `Classify each of these grocery items:\n${numberedList}` },
      ],
      tools: [tool],
      tool_choice: { type: 'tool', name: 'assign_categories' },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Anthropic API error ${response.status}: ${detail.slice(0, 300)}`);
  }

  const data = await response.json();
  const toolUse = (data.content || []).find((block) => block.type === 'tool_use' && block.name === 'assign_categories');
  const assignments = (toolUse && toolUse.input && toolUse.input.assignments) || [];

  const results = {};
  for (const { index, category } of assignments) {
    const item = items[index];
    if (item === undefined) continue;
    results[item] = CATEGORY_KEYS.includes(category) ? category : 'other';
  }

  // Anything Claude didn't return an assignment for falls back to 'other'.
  for (const item of items) {
    if (!(item in results)) results[item] = 'other';
  }

  return results;
}

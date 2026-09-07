// Cloudflare Worker that proxies file-analysis requests to Claude.
// Deployed separately from the static site — see the deploy notes in chat/README.
// The Anthropic API key lives only in this Worker's environment (set via
// `wrangler secret put ANTHROPIC_API_KEY`), never in the repo or the browser.

var ALLOWED_ORIGINS = [
  "https://pynec17.github.io",
  "http://localhost:8123" // remove once you're done testing against the local static server
];

var MODEL = "claude-haiku-4-5-20251001"; // cheap/fast; swap for "claude-sonnet-5" for better analysis quality
var MAX_TOKENS = 1024;
var ANALYSIS_INSTRUCTION =
  "Summarize this document in a few sentences, then list its key points as bullets. " +
  "Call out anything that looks like an action item or a date.";

export default {
  async fetch(request, env) {
    var origin = request.headers.get("Origin");
    var corsHeaders = buildCorsHeaders(origin);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405, corsHeaders);
    }

    var body;
    try {
      body = await request.json();
    } catch (err) {
      return json({ error: "Invalid JSON body" }, 400, corsHeaders);
    }

    var filename = body && body.filename;
    var data = body && body.data; // base64 PDF
    var text = body && body.text; // extracted docx text

    if (!data && !text) {
      return json({ error: "No file data or extracted text provided" }, 400, corsHeaders);
    }

    var content = data
      ? [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data: data } },
          { type: "text", text: ANALYSIS_INSTRUCTION }
        ]
      : [
          {
            type: "text",
            text: ANALYSIS_INSTRUCTION + "\n\nDocument: " + (filename || "untitled") + "\n\n" + text
          }
        ];

    var anthropicResponse;
    try {
      anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          messages: [{ role: "user", content: content }]
        })
      });
    } catch (err) {
      return json({ error: "Could not reach the Claude API" }, 502, corsHeaders);
    }

    if (!anthropicResponse.ok) {
      var detail = await anthropicResponse.text();
      return json({ error: "Claude API error", detail: detail }, 502, corsHeaders);
    }

    var result = await anthropicResponse.json();
    var analysis = (result.content && result.content[0] && result.content[0].text) || "";

    return json({ analysis: analysis }, 200, corsHeaders);
  }
};

function buildCorsHeaders(origin) {
  var headers = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  if (ALLOWED_ORIGINS.indexOf(origin) !== -1) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

function json(obj, status, extraHeaders) {
  var headers = { "content-type": "application/json" };
  for (var key in extraHeaders) headers[key] = extraHeaders[key];
  return new Response(JSON.stringify(obj), { status: status, headers: headers });
}

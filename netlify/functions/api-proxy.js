// Proxies /api/* to AWS API Gateway, preserving method, headers, and body
// Configure API_BASE in Netlify env. Default provided for convenience.

export default async (request, context) => {
  try {
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/api\//, "");

    const API_BASE = process.env.API_BASE || "https://721inkpci4.execute-api.us-east-2.amazonaws.com";
    const targetUrl = `${API_BASE}/${path}${url.search}`;

    const headers = new Headers(request.headers);
    // Remove hop-by-hop headers just in case
    headers.delete("host");
    headers.delete("connection");
    headers.delete("content-length");

    const init = {
      method: request.method,
      headers,
      body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.text(),
      redirect: "follow",
    };

    const resp = await fetch(targetUrl, init);
    const respHeaders = new Headers(resp.headers);
    // Ensure CORS for the deployed site
    respHeaders.set("access-control-allow-origin", "*");
    respHeaders.set("access-control-allow-credentials", "true");

    // Pass-through status and body
    return new Response(await resp.arrayBuffer(), {
      status: resp.status,
      headers: respHeaders,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Proxy error", details: String(err) }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }
};



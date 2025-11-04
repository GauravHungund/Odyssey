// Proxies /serpapi/* to serpapi.com, attaching API key if provided in env

export default async (request) => {
  try {
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/serpapi\//, "");

    const SERPAPI_BASE = process.env.SERPAPI_BASE || "https://serpapi.com";
    const SERPAPI_KEY = process.env.SERPAPI_KEY;

    // Append key if not present
    if (SERPAPI_KEY && !url.searchParams.has("api_key")) {
      url.searchParams.set("api_key", SERPAPI_KEY);
    }

    const targetUrl = `${SERPAPI_BASE}/${path}?${url.searchParams.toString()}`;

    const headers = new Headers(request.headers);
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
    respHeaders.set("access-control-allow-origin", "*");
    respHeaders.set("access-control-allow-credentials", "true");

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



// Proxies /places/* to AWS Places endpoint

export default async (request) => {
  try {
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/places\//, "");

    const PLACES_BASE = process.env.PLACES_BASE || "https://places.geo.us-east-2.api.aws";
    const targetUrl = `${PLACES_BASE}/${path}${url.search}`;

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



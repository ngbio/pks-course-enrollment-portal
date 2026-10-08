interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  API_ORIGIN: string;
  EDGE_PROXY_SECRET: string;
}

function unavailable(status = 503) {
  return Response.json(
    {
      error: {
        code: 'API_UNAVAILABLE',
        message:
          'Máy chủ đang khởi động hoặc tạm thời gián đoạn. Vui lòng thử lại.',
        details: [],
      },
    },
    { status, headers: { 'Cache-Control': 'no-store' } },
  );
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname !== '/api' && !url.pathname.startsWith('/api/')) {
      return env.ASSETS.fetch(request);
    }
    let origin: URL;
    try {
      origin = new URL(env.API_ORIGIN);
      if (
        origin.protocol !== 'https:' ||
        origin.origin === url.origin ||
        origin.username ||
        origin.password ||
        origin.pathname !== '/' ||
        origin.search ||
        origin.hash ||
        origin.hostname.toLowerCase().includes('replace-with-') ||
        !env.EDGE_PROXY_SECRET ||
        env.EDGE_PROXY_SECRET.length < 32
      ) {
        return unavailable();
      }
    } catch {
      return unavailable();
    }
    // Assign only path/query, never let a request select an upstream host.
    origin.pathname = url.pathname;
    origin.search = url.search;
    const headers = new Headers(request.headers);
    for (const name of [
      'host',
      'forwarded',
      'x-forwarded-for',
      'x-forwarded-host',
      'x-forwarded-proto',
      'x-pks-client-ip',
      'x-pks-proxy-secret',
    ]) {
      headers.delete(name);
    }
    headers.set('x-pks-proxy-secret', env.EDGE_PROXY_SECRET);
    headers.set(
      'x-pks-client-ip',
      request.headers.get('cf-connecting-ip') ?? '',
    );
    try {
      const upstream = await fetch(origin, {
        method: request.method,
        headers,
        body: ['GET', 'HEAD'].includes(request.method)
          ? undefined
          : request.body,
        redirect: 'manual',
        cache: 'no-store',
        signal: AbortSignal.timeout(25000),
      });
      // Do not leak host-only cookies/credentials via redirects or cache APIs.
      if (upstream.status >= 300 && upstream.status < 400)
        return unavailable(502);
      const response = new Response(upstream.body, upstream);
      response.headers.set('Cache-Control', 'no-store');
      return response;
    } catch {
      return unavailable(502);
    }
  },
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Target Leap backend
    const targetUrl = 'https://gaming-top-up-platform-d3pg4ec82vjikj791feg.lp.dev';
    
    // Rewrite URL to Leap backend
    const proxyUrl = targetUrl + url.pathname + url.search;
    
    // Copy headers from original request
    const headers = new Headers(request.headers);
    
    // Set Host header to target domain
    headers.set('Host', 'gaming-top-up-platform-d3pg4ec82vjikj791feg.lp.dev');
    
    // Forward request to Leap backend
    const modifiedRequest = new Request(proxyUrl, {
      method: request.method,
      headers: headers,
      body: request.body,
      redirect: 'follow'
    });
    
    // Fetch from Leap
    let response = await fetch(modifiedRequest);
    
    // Clone response and copy headers
    response = new Response(response.body, response);
    
    // Add CORS headers for browser
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', '*');
    
    return response;
  }
}

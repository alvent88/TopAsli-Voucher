export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Target Leap backend
    const targetUrl = 'https://gaming-top-up-platform-d3pg4ec82vjikj791feg.lp.dev';
    
    // Build target URL
    const proxyUrl = targetUrl + url.pathname + url.search;
    
    // Create new request with modified headers
    const modifiedRequest = new Request(proxyUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: 'manual'
    });
    
    // Fetch from Leap backend
    const response = await fetch(modifiedRequest);
    
    // Create new response with all headers preserved
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
    
    // Add CORS headers if needed
    newResponse.headers.set('Access-Control-Allow-Origin', '*');
    newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    newResponse.headers.set('Access-Control-Allow-Headers', '*');
    
    // Handle redirects
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('Location');
      if (location) {
        // If redirect is relative, make it absolute to app.topasli.com
        if (location.startsWith('/')) {
          newResponse.headers.set('Location', 'https://app.topasli.com' + location);
        }
      }
    }
    
    return newResponse;
  }
}

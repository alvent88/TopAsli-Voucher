export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Target Leap backend
    const targetUrl = 'https://gaming-top-up-platform-d3pg4ec82vjikj791feg.lp.dev';
    
    // Build target URL
    const proxyUrl = targetUrl + url.pathname + url.search;
    
    // Create headers for backend request
    const headers = new Headers(request.headers);
    
    // IMPORTANT: Remove origin and referer headers to prevent redirect loops
    headers.delete('origin');
    headers.delete('referer');
    
    // Set Host to Leap domain
    headers.set('Host', 'gaming-top-up-platform-d3pg4ec82vjikj791feg.lp.dev');
    
    // Create new request
    const modifiedRequest = new Request(proxyUrl, {
      method: request.method,
      headers: headers,
      body: request.body,
      redirect: 'manual' // Important: don't auto-follow redirects
    });
    
    // Fetch from Leap backend
    let response = await fetch(modifiedRequest);
    
    // If backend returns redirect, rewrite Location header to custom domain
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('Location');
      if (location) {
        const newHeaders = new Headers(response.headers);
        
        // Rewrite Location header from Leap domain to custom domain
        if (location.includes('gaming-top-up-platform-d3pg4ec82vjikj791feg.lp.dev')) {
          const newLocation = location.replace(
            'gaming-top-up-platform-d3pg4ec82vjikj791feg.lp.dev',
            'app.topasli.com'
          );
          newHeaders.set('Location', newLocation);
        } else if (location.startsWith('/')) {
          // Relative redirect - make it absolute to custom domain
          newHeaders.set('Location', 'https://app.topasli.com' + location);
        }
        
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders
        });
      }
    }
    
    // Create new response with all headers preserved
    const newHeaders = new Headers(response.headers);
    
    // Add CORS headers
    newHeaders.set('Access-Control-Allow-Origin', '*');
    newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    newHeaders.set('Access-Control-Allow-Headers', '*');
    
    // Remove any headers that might cause issues
    newHeaders.delete('content-security-policy');
    newHeaders.delete('x-frame-options');
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  }
}

export interface AuditMetadata {
  ipAddress: string;
  userAgent: string;
}

let cachedIpAddress: string | null = null;

export async function getAuditMetadata(): Promise<AuditMetadata> {
  let ipAddress = cachedIpAddress || 'unknown';
  
  if (!cachedIpAddress) {
    try {
      const ipResponse = await fetch('https://api.ipify.org?format=json', { 
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });
      if (ipResponse.ok) {
        const ipData = await ipResponse.json();
        ipAddress = ipData.ip || 'unknown';
        cachedIpAddress = ipAddress;
      }
    } catch (ipError) {
      console.error("Failed to get IP address:", ipError);
    }
  }
  
  const userAgent = navigator.userAgent;
  
  return {
    ipAddress,
    userAgent,
  };
}

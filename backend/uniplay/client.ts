import db from "../db";

export interface UniPlayBalanceResponse {
  status: string;
  message: string;
  saldo: number;
}

export interface UniPlayVoucherDenom {
  id: string;
  package: string;
  price: string;
}

export interface UniPlayVoucher {
  id: string;
  name: string;
  image: string;
  publisher: string;
  publisher_website: string;
  denom: UniPlayVoucherDenom[];
}

export interface UniPlayVoucherResponse {
  status: string;
  message: string;
  list_voucher: UniPlayVoucher[];
}

export interface UniPlayDTUDenom {
  id: string;
  package: string;
  price: string;
}

export interface UniPlayDTUGame {
  id: string;
  name: string;
  image: string;
  publisher: string;
  publisher_website: string;
  denom: UniPlayDTUDenom[];
}

export interface UniPlayDTUResponse {
  status: string;
  message: string;
  list_dtu: UniPlayDTUGame[];
}

export interface UniPlayOrderRequest {
  product_code: string;
  user_id: string;
  zone_id?: string;
  ref_id: string;
}

export interface UniPlayOrderResponse {
  status: string;
  message: string;
  data: {
    trx_id: string;
    ref_id: string;
    product_name: string;
    user_id: string;
    zone_id?: string;
    price: number;
    status: string;
  };
}

export interface UniPlayStatusResponse {
  status: string;
  message: string;
  data: {
    trx_id: string;
    ref_id: string;
    product_name: string;
    status: string;
    sn?: string;
  };
}

async function getUniPlayConfig() {
  const row = await db.queryRow<{ value: string }>`
    SELECT value FROM admin_config WHERE key = 'dashboard_config'
  `;

  if (!row) {
    throw new Error("UniPlay API key not configured");
  }

  const config = JSON.parse(row.value);
  if (!config.uniplay?.apiKey || !config.uniplay?.baseUrl) {
    throw new Error("UniPlay API key not configured");
  }

  return config.uniplay;
}

async function generateSignature(apiKey: string, timestamp: string, bodyJson?: string): Promise<string> {
  try {
    // Create the data to sign
    // Format: api_key + timestamp (+ optional body for some endpoints)
    let dataToSign = apiKey + timestamp;
    
    console.log("=== Generating Signature ===");
    console.log("API Key length:", apiKey.length);
    console.log("Timestamp:", timestamp);
    console.log("Data to sign:", dataToSign.substring(0, 50) + "...");
    
    const encoder = new TextEncoder();
    const keyData = encoder.encode(apiKey);
    const messageData = encoder.encode(dataToSign);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-512' },
      false,
      ['sign']
    );
    
    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    const signature = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    console.log("✅ Signature generated:", signature.substring(0, 40) + "...");
    return signature;
  } catch (err) {
    console.error("❌ Error generating signature:", err);
    throw new Error(`Signature generation failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

interface AccessTokenResponse {
  status: string;
  message: string;
  access_token?: string;
  expired_on?: string;
  timezone?: string;
}

async function getAccessToken(): Promise<string> {
  try {
    const config = await getUniPlayConfig();
    
    const now = new Date();
    const jakartaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    const timestamp = jakartaTime.toISOString().slice(0, 19).replace('T', ' ');
    
    console.log("=== Getting Access Token ===");
    console.log("Server Time:", now.toISOString());
    console.log("Jakarta Time:", jakartaTime.toISOString());
    console.log("Formatted Timestamp:", timestamp);
    
    const signature = await generateSignature(config.apiKey, timestamp);
    console.log("Signature length:", signature.length);
    
    const requestBody = {
      api_key: config.apiKey,
      timestamp: timestamp,
    };
    
    console.log("Request body:", JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(`${config.baseUrl}/access-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "UPL-SIGNATURE": signature,
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    console.log("Access token HTTP status:", response.status);
    console.log("Access token response body:", responseText);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${responseText}`);
    }

    let data;
    try {
      data = JSON.parse(responseText) as AccessTokenResponse;
    } catch (parseErr) {
      throw new Error(`Failed to parse JSON: ${responseText}`);
    }
    
    console.log("Parsed response - status:", data.status, "message:", data.message);
    
    if (data.status !== "200") {
      throw new Error(`API Error ${data.status}: ${data.message}`);
    }
    
    if (!data.access_token) {
      throw new Error(`No access token in response: ${JSON.stringify(data)}`);
    }
    
    console.log("✅ Access token obtained:", data.access_token.substring(0, 20) + "...");
    console.log("✅ Token expires on:", data.expired_on);
    return data.access_token;
  } catch (err) {
    console.error("❌ getAccessToken failed:", err);
    throw err;
  }
}

async function makeRequest<T>(endpoint: string, body: any): Promise<T> {
  const config = await getUniPlayConfig();
  const accessToken = await getAccessToken();
  
  // Generate timestamp for signature
  const now = new Date();
  const jakartaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
  const timestamp = jakartaTime.toISOString().slice(0, 19).replace('T', ' ');
  
  // Generate signature
  const signature = await generateSignature(config.apiKey, timestamp);
  
  const fullUrl = `${config.baseUrl}${endpoint}`;
  console.log("=== UniPlay API Request ===");
  console.log("URL:", fullUrl);
  console.log("Timestamp:", timestamp);
  console.log("Access Token:", accessToken.substring(0, 20) + "...");
  console.log("Signature:", signature.substring(0, 40) + "...");
  
  try {
    // IMPORTANT: Preserve order by constructing object with specific key order
    // Order: api_key, timestamp, then body keys in their original order
    const orderedBody: any = {};
    orderedBody.api_key = config.apiKey;
    orderedBody.timestamp = timestamp;
    
    // Add body keys in specific order if it's inquiry-payment
    if (endpoint === "/inquiry-payment" && body.entitas_id) {
      orderedBody.entitas_id = body.entitas_id;
      orderedBody.denom_id = body.denom_id;
      orderedBody.user_id = body.user_id;
      if (body.server_id) {
        orderedBody.server_id = body.server_id;
      }
    } else {
      // For other endpoints, just spread the body
      Object.assign(orderedBody, body);
    }
    
    console.log("Request body (ordered):", JSON.stringify(orderedBody, null, 2));
    
    const response = await fetch(fullUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "UPL-ACCESS-TOKEN": accessToken,
        "UPL-SIGNATURE": signature,
      },
      body: JSON.stringify(orderedBody),
    });

    console.log("Response status:", response.status);
    
    const responseText = await response.text();
    console.log("Response body (raw):", responseText);
    
    if (!response.ok) {
      console.error("❌ UniPlay API error - Status:", response.status);
      console.error("❌ Response:", responseText);
      throw new Error(`UniPlay API error: ${response.status} ${response.statusText} - ${responseText}`);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("❌ Failed to parse JSON response:", e);
      throw new Error(`Invalid JSON response: ${responseText}`);
    }
    
    console.log("✅ Parsed response:", JSON.stringify(data, null, 2));
    
    if (data.status && data.status !== "success" && data.status !== "200") {
      console.error("❌ API returned error status:", data.status);
      throw new Error(`API Error: ${data.message || data.status}`);
    }
    
    return data as T;
  } catch (err) {
    console.error("❌ Request failed:", err);
    throw err;
  }
}

export async function getBalance(): Promise<UniPlayBalanceResponse> {
  return makeRequest<UniPlayBalanceResponse>("/inquiry-saldo", {});
}

export async function getVoucherList(): Promise<UniPlayVoucherResponse> {
  return makeRequest<UniPlayVoucherResponse>("/inquiry-voucher", {});
}

export async function getDTUList(): Promise<UniPlayDTUResponse> {
  return makeRequest<UniPlayDTUResponse>("/inquiry-dtu", {});
}

export async function createOrder(orderRequest: UniPlayOrderRequest): Promise<UniPlayOrderResponse> {
  return makeRequest<UniPlayOrderResponse>("/create-order", orderRequest);
}

export async function checkStatus(refId?: string, trxId?: string): Promise<UniPlayStatusResponse> {
  const body: any = {};
  if (refId) body.ref_id = refId;
  if (trxId) body.trx_id = trxId;
  
  return makeRequest<UniPlayStatusResponse>("/check-status", body);
}

export interface UniPlayInquiryPaymentRequest {
  entitas_id: string;
  denom_id: string;
  user_id?: string;
  server_id?: string;
}

export interface UniPlayInquiryPaymentResponse {
  status: string;
  message: string;
  inquiry_id: string;
  inquiry_info?: {
    username?: string;
  };
}

export async function inquiryPayment(request: UniPlayInquiryPaymentRequest): Promise<UniPlayInquiryPaymentResponse> {
  return makeRequest<UniPlayInquiryPaymentResponse>("/inquiry-payment", request);
}

export interface UniPlayConfirmPaymentRequest {
  inquiry_id: string;
  pincode: string;
}

export interface UniPlayConfirmPaymentResponse {
  status: string;
  message: string;
  order_id: string;
  order_info: {
    trx_number: string;
    trx_date_order: string;
    trx_item: string;
    trx_price: string;
    trx_status: string;
  };
}

export async function confirmPayment(request: UniPlayConfirmPaymentRequest): Promise<UniPlayConfirmPaymentResponse> {
  return makeRequest<UniPlayConfirmPaymentResponse>("/confirm-payment", request);
}

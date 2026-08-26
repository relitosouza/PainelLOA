const JWT_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "osasco-painel-loa-secret-token-key-2027";
export const SESSION_COOKIE_NAME = "painel_loa_session_v1";

// Helpers para Web Crypto API (compatível com Edge Runtime e Node.js)
function stringToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return atob(base64);
}

export async function hashPassword(password: string): Promise<string> {
  const msgBuffer = stringToUint8Array(password.trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function signSession(payload: { id: string; email: string; papel: string; nome: string }): Promise<string> {
  const header = base64UrlEncode(stringToUint8Array(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const exp = Date.now() + 1000 * 60 * 60 * 24 * 7; // 7 dias
  const body = base64UrlEncode(stringToUint8Array(JSON.stringify({ ...payload, exp })));
  const data = `${header}.${body}`;

  const key = await crypto.subtle.importKey(
    "raw",
    stringToUint8Array(JWT_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign("HMAC", key, stringToUint8Array(data));
  const signature = base64UrlEncode(new Uint8Array(signatureBuffer));

  return `${header}.${body}.${signature}`;
}

export async function verifySession(token: string): Promise<{ id: string; email: string; papel: string; nome: string } | null> {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      stringToUint8Array(JWT_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    // Converte base64url da assinatura para Uint8Array
    const binarySig = atob(signature.replace(/-/g, "+").replace(/_/g, "/"));
    const sigBytes = new Uint8Array(binarySig.length);
    for (let i = 0; i < binarySig.length; i++) {
      sigBytes[i] = binarySig.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      stringToUint8Array(`${header}.${body}`)
    );

    if (!isValid) return null;

    const payload = JSON.parse(base64UrlDecode(body));
    if (payload.exp && Date.now() > payload.exp) {
      return null; // Expirado
    }
    return payload;
  } catch {
    return null;
  }
}

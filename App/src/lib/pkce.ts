export async function sha256(input: string): Promise<ArrayBuffer> {
  const enc = new TextEncoder();
  const data = enc.encode(input);
  return await crypto.subtle.digest('SHA-256', data);
}

export function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function randomString(length = 64): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => ('0' + b.toString(16)).slice(-2)).join('');
}



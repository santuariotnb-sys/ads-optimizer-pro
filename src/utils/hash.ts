export async function hashSHA256(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value.trim().toLowerCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function hashUserData(userData: {
  email?: string;
  phone?: string;
  external_id?: string;
}): Promise<{
  em?: string[];
  ph?: string[];
  external_id?: string[];
}> {
  const result: { em?: string[]; ph?: string[]; external_id?: string[] } = {};
  if (userData.email) {
    result.em = [await hashSHA256(userData.email)];
  }
  if (userData.phone) {
    result.ph = [await hashSHA256(userData.phone)];
  }
  if (userData.external_id) {
    result.external_id = [await hashSHA256(userData.external_id)];
  }
  return result;
}

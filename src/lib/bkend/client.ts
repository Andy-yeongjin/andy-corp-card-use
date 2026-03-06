interface BkendFetchOptions extends RequestInit {
  token?: string;
}

export async function bkendFetch<T = any>(
  path: string,
  options: BkendFetchOptions = {}
): Promise<{ success: boolean; data: T; error?: any }> {
  const { token, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Project-Id": process.env.NEXT_PUBLIC_BKEND_PROJECT_ID!,
    "X-Environment": process.env.NEXT_PUBLIC_BKEND_ENVIRONMENT!,
    ...(customHeaders as Record<string, string>),
  };

  if (token) {
    // User JWT token takes priority — do NOT send API Key simultaneously
    // (bkend treats API Key as primary auth and then requires userId param)
    headers["Authorization"] = `Bearer ${token}`;
  } else if (typeof window === "undefined" && process.env.BKEND_API_KEY) {
    // No user token: fall back to service API Key (server-side only)
    headers["X-API-Key"] = process.env.BKEND_API_KEY;
  }

  // 모든 요청에 /v1 접두사 보장
  const apiPath = path.startsWith("/v1") ? path : `/v1${path}`;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BKEND_API_URL}${apiPath}`,
    { headers, ...rest }
  );

  const result = await res.json();

  if (!res.ok) {
    console.error(`[bkendFetch] ${rest.method ?? "GET"} ${apiPath} → ${res.status}`, JSON.stringify(result));
    const errMsg = typeof result.error === "string"
      ? result.error
      : result.error?.message || result.message || `bkend API error (${res.status})`;
    throw new Error(errMsg);
  }

  return result;
}

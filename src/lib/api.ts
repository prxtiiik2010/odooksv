interface RequestOptions {
  method?: string;
  body?: unknown;
  accessToken?: string | null;
}

function resolveEndpoint(endpoint: string) {
  if (endpoint.startsWith("http")) return endpoint;
  if (endpoint.startsWith("/api/")) return endpoint;
  return `/api${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
}

function getStoredAccessToken() {
  if (typeof window === "undefined") return null;

  try {
    return (
      JSON.parse(localStorage.getItem("auth") || "{}")?.accessToken ?? null
    );
  } catch {
    return null;
  }
}

export async function api(endpoint: string, options: RequestOptions = {}) {
  const { method = "GET", body, accessToken } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const token = accessToken || getStoredAccessToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(resolveEndpoint(endpoint), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || "Request failed");
  }

  return response.json();
}

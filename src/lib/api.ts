const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

interface RequestOptions {
  method?: string;
  body?: unknown;
  accessToken?: string | null;
}

export async function api(endpoint: string, options: RequestOptions = {}) {
  const { method = "GET", body, accessToken } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Resolve token from localStorage if not explicitly provided
  const token =
    accessToken ||
    (typeof window !== "undefined"
      ? localStorage.getItem("auth")
        ? JSON.parse(localStorage.getItem("auth") || "{}").accessToken
        : null
      : null);

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
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

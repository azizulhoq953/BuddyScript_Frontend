const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://192.168.2.38:3300/api/v1'

class HttpError extends Error {
  status: number
  details?: unknown

  constructor(status: number, message: string, details?: unknown) {
    super(message)
    this.status = status
    this.details = details
  }
}

function isJsonResponse(response: Response) {
  return response.headers.get('content-type')?.includes('application/json')
}

async function toError(response: Response) {
  if (isJsonResponse(response)) {
    const payload = (await response.json()) as { message?: string }
    throw new HttpError(response.status, payload.message ?? 'Request failed', payload)
  }

  const text = await response.text()
  throw new HttpError(response.status, text || 'Request failed')
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers = new Headers(options.headers)

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    await toError(response)
  }

  if (response.status === 204) {
    return null as T
  }

  if (isJsonResponse(response)) {
    return (await response.json()) as T
  }

  return null as T
}

export const http = { request, HttpError, API_BASE_URL }


const envApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()

if (!envApiBaseUrl) {
throw new Error('VITE_API_BASE_URL is missing. Create .env and restart the dev server.')
}

const API_BASE_URL = envApiBaseUrl

function normalizeBaseUrl(value: string) {
return value.replace(/\/$/, '')
}

function getBaseUrlCandidates() {
const primary = normalizeBaseUrl(API_BASE_URL)
const candidates = [primary]

// Some environments expose routes without the /api/v1 prefix.
if (primary.endsWith('/api/v1')) {
candidates.push(primary.replace(/\/api\/v1$/, ''))
}

return candidates
}

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

const baseUrls = getBaseUrlCandidates()
let lastResponse: Response | null = null

for (let index = 0; index < baseUrls.length; index += 1) {
const baseUrl = baseUrls[index]
const response = await fetch(`${baseUrl}${path}`, {
...options,
headers,
})

if (response.ok) {
if (response.status === 204) {
return null as T
}

if (isJsonResponse(response)) {
return (await response.json()) as T
}

return null as T
}

lastResponse = response

// Retry only when route is missing in the primary base URL.
if (!(index === 0 && response.status === 404)) {
await toError(response)
}
}

if (lastResponse) {
await toError(lastResponse)
}

return null as T
}

export const http = { request, HttpError, API_BASE_URL }

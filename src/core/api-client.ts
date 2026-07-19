export interface ApiRequestOptions extends RequestInit {
  timeoutMs?: number;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly url: string,
    readonly payload?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiClient {
  constructor(private readonly baseUrl = '') {}

  async json<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
    const { timeoutMs = 0, signal, ...requestOptions } = options;
    const controller = !signal && timeoutMs > 0 ? new AbortController() : undefined;
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : undefined;
    const url = this.resolve(path);

    try {
      const response = await fetch(url, {
        ...requestOptions,
        signal: signal ?? controller?.signal,
      });
      const payload = await this.readPayload(response);
      if (!response.ok) {
        const message = this.errorMessage(payload) || `Request failed with HTTP ${response.status}`;
        throw new ApiError(message, response.status, url, payload);
      }
      return payload as T;
    } finally {
      if (timer !== undefined) clearTimeout(timer);
    }
  }

  private resolve(path: string): string {
    if (/^https?:\/\//i.test(path)) return path;
    return `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  }

  private async readPayload(response: Response): Promise<unknown> {
    const text = await response.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      throw new ApiError('Server returned invalid JSON', response.status, response.url, text);
    }
  }

  private errorMessage(payload: unknown): string {
    if (!payload || typeof payload !== 'object') return '';
    const value = payload as Record<string, unknown>;
    return typeof value.message === 'string'
      ? value.message
      : typeof value.error === 'string' ? value.error : '';
  }
}

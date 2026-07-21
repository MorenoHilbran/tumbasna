/**
 * API Utility dengan timeout, retry logic, dan error handling
 */

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.tumbasna.my.id';
const DEFAULT_TIMEOUT = 8000; // 8 detik timeout default
const RETRY_ATTEMPTS = 2; // Jumlah retry
const RETRY_DELAY = 1000; // Delay antar retry (ms)

export interface ApiConfig {
  timeout?: number;
  retry?: number;
  retryDelay?: number;
  signal?: AbortSignal;
}

/**
 * Helper untuk delay/sleep
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch dengan timeout
 */
const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {},
  timeout: number = DEFAULT_TIMEOUT
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: options.signal || controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - API tidak merespons');
    }
    throw error;
  }
};

/**
 * Fetch dengan retry logic
 */
const fetchWithRetry = async (
  url: string,
  options: RequestInit = {},
  config: ApiConfig = {}
): Promise<Response> => {
  const { timeout = DEFAULT_TIMEOUT, retry = RETRY_ATTEMPTS, retryDelay = RETRY_DELAY } = config;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retry; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options, timeout);
      
      // Jika response OK, return langsung
      if (response.ok) {
        return response;
      }

      // Jika 4xx client error, jangan retry
      if (response.status >= 400 && response.status < 500) {
        return response;
      }

      // Jika 5xx server error, retry
      throw new Error(`Server error: ${response.status}`);
    } catch (error: any) {
      lastError = error;
      console.warn(`[API] Attempt ${attempt + 1}/${retry + 1} failed:`, error.message);

      // Jika masih ada attempt tersisa, tunggu sebelum retry
      if (attempt < retry) {
        await sleep(retryDelay * (attempt + 1)); // Exponential backoff
      }
    }
  }

  // Semua attempt gagal
  throw lastError || new Error('Request failed after retries');
};

/**
 * GET request
 */
export const apiGet = async <T = any>(
  endpoint: string,
  config: ApiConfig = {}
): Promise<{ success: boolean; data?: T; error?: string }> => {
  try {
    const url = `${API_BASE}${endpoint}`;
    const response = await fetchWithRetry(url, { method: 'GET' }, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return data.success !== undefined ? data : { success: true, data };
  } catch (error: any) {
    console.error(`[API GET] ${endpoint}:`, error);
    return {
      success: false,
      error: error.message || 'Network error atau API tidak tersedia',
    };
  }
};

/**
 * POST request
 */
export const apiPost = async <T = any>(
  endpoint: string,
  body: any,
  config: ApiConfig = {}
): Promise<{ success: boolean; data?: T; error?: string }> => {
  try {
    const url = `${API_BASE}${endpoint}`;
    const response = await fetchWithRetry(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
      config
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return data.success !== undefined ? data : { success: true, data };
  } catch (error: any) {
    console.error(`[API POST] ${endpoint}:`, error);
    return {
      success: false,
      error: error.message || 'Network error atau API tidak tersedia',
    };
  }
};

/**
 * PATCH request
 */
export const apiPatch = async <T = any>(
  endpoint: string,
  body: any,
  config: ApiConfig = {}
): Promise<{ success: boolean; data?: T; error?: string }> => {
  try {
    const url = `${API_BASE}${endpoint}`;
    const response = await fetchWithRetry(
      url,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
      config
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return data.success !== undefined ? data : { success: true, data };
  } catch (error: any) {
    console.error(`[API PATCH] ${endpoint}:`, error);
    return {
      success: false,
      error: error.message || 'Network error atau API tidak tersedia',
    };
  }
};

/**
 * Check API health
 */
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${API_BASE}/api/health`, {
      signal: controller.signal,
    }).catch(() => null);

    clearTimeout(timeoutId);
    return response?.ok || false;
  } catch {
    return false;
  }
};

export default {
  get: apiGet,
  post: apiPost,
  patch: apiPatch,
  checkHealth: checkApiHealth,
};

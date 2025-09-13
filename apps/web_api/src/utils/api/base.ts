// Base API configuration and utilities

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const API_CONFIG = {
  BASE_URL: 'http://localhost:3001', // Default API URL
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

// Simulated API delay for development (always enabled for demo)
export const API_DELAY = 500;

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    await delay(API_DELAY);
    
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new ApiError(
        `HTTP error! status: ${response.status}`,
        response.status
      );
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export function createMockResponse<T>(data: T, delay: number = API_DELAY): Promise<ApiResponse<T>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, data });
    }, delay);
  });
}

export function createMockError(message: string, delay: number = API_DELAY): Promise<ApiResponse<never>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: false, error: message });
    }, delay);
  });
}
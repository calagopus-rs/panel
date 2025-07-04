import axios, { AxiosInstance } from 'axios';

export const axiosInstance: AxiosInstance = axios.create({
  // baseURL: import.meta.env.VITE_API_URL,
  headers: {
    Authorization: `Bearer ${import.meta.env.VITE_API_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

/**
 * Converts an error into a human readable response. Mostly just a generic helper to
 * make sure we display the message from the server back to the user if we can.
 */
export function httpErrorToHuman(error: any): string {
  if (error.response && error.response.data) {
    let { data } = error.response;

    // Some non-JSON requests can still return the error as a JSON block. In those cases, attempt
    // to parse it into JSON so we can display an actual error.
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) {
        // do nothing, bad json
      }
    }

    if (data.errors && data.errors[0] && data.errors[0].detail) {
      return data.errors[0].detail;
    }

    if (data.errors && data.errors[0] && typeof data.errors[0] === 'string') {
      return data.errors[0];
    }

    // Errors from wings directory, mostly just for file uploads.
    if (data.error && typeof data.error === 'string') {
      return data.error;
    }
  }

  return error.message;
}

export interface FractalResponseData {
  object: string;
  attributes: {
    [k: string]: any;
    relationships?: Record<string, FractalResponseData | FractalResponseList | null | undefined>;
  };
}

export interface FractalResponseList {
  object: 'list';
  data: FractalResponseData[];
}

export interface FractalPaginatedResponse extends FractalResponseList {
  meta: {
    pagination: {
      total: number;
      count: number;

      per_page: number;
      current_page: number;
      total_pages: number;
    };
  };
}

export function getPaginationSet(data: PaginatedResult<unknown>) {
  return {
    total: data.total,
    per_page: data.per_page,
    page: data.page,
  };
}

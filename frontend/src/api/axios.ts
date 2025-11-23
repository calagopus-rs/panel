import axios, { AxiosInstance } from 'axios';
import { transformKeysToCamelCase } from '../lib/transformers';

export const axiosInstance: AxiosInstance = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auto transform all data to camel case keys
axiosInstance.interceptors.response.use(
  (response) => {
    if (!response.request.responseURL.endsWith('/export')) {
      response.data = transformKeysToCamelCase(response.data);
    }

    return response;
  },
  (error) => {
    if (error.response && error.response.data) {
      error.response.data = transformKeysToCamelCase(error.response.data);
    }
    return Promise.reject(error);
  },
);

/**
 * Converts an error into a human readable response. Mostly just a generic helper to
 * make sure we display the message from the server back to the user if we can.
 */
export function httpErrorToHuman(error: object): string {
  if ('response' in error && typeof error.response === 'object' && 'data' in error.response && error.response.data) {
    let { data } = error.response;

    // Some non-JSON requests can still return the error as a JSON block. In those cases, attempt
    // to parse it into JSON so we can display an actual error.
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch {
        // do nothing, bad json
      }
    }

    if (typeof data === 'object') {
      if ('errors' in data && Array.isArray(data.errors) && data.errors[0] && typeof data.errors[0] === 'string') {
        return data.errors[0];
      }

      // Errors from wings directory, mostly just for file uploads.
      if ('error' in data && typeof data.error === 'string') {
        return data.error;
      }
    }
  }

  if ('message' in error && typeof error.message === 'string') {
    return error.message;
  } else {
    return String(error);
  }
}

export function getPaginationSet(data: ResponseMeta<unknown>) {
  return {
    total: data.total,
    perPage: data.perPage,
    page: data.page,
  };
}

export function getEmptyPaginationSet<T>(): ResponseMeta<T> {
  return {
    total: 0,
    perPage: 0,
    page: 0,
    data: [],
  };
}

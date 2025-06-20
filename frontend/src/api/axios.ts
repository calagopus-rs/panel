import axios, { AxiosInstance } from 'axios';

export const axiosInstance: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    Authorization: `Bearer ${import.meta.env.VITE_API_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

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

export interface PaginatedResult<T> {
  items: T[];
  pagination: PaginationDataSet;
}

export interface PaginationDataSet {
  total: number;
  count: number;
  perPage: number;
  currentPage: number;
  totalPages: number;
}

export function getPaginationSet(data: any): PaginationDataSet {
  return {
    total: data.total,
    count: data.count,
    perPage: data.per_page,
    currentPage: data.current_page,
    totalPages: data.total_pages,
  };
}

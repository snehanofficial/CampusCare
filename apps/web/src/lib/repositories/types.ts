export interface RepositoryQueryParams {
  search?: string;
  filters?: Record<string, any>;
  page?: number;
  pageSize?: number;
}

export interface RepositoryListResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

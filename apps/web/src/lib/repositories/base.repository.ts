import { RepositoryQueryParams, RepositoryListResponse } from "./types.js";

export interface IRepository<T, CreateInput = Partial<T>, UpdateInput = Partial<T>> {
  list(params?: RepositoryQueryParams): Promise<RepositoryListResponse<T>>;
  get(id: string): Promise<T>;
  create(data: CreateInput): Promise<T>;
  update(id: string, data: UpdateInput): Promise<T>;
  delete(id: string): Promise<boolean>;
}

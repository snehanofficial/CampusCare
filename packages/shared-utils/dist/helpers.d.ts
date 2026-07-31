export declare function formatBytes(bytes: number, decimals?: number): string;
export declare function formatDate(date: Date | string): string;
export declare function paginate<T>(items: T[], page: number, limit: number): {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    data: T[];
};
//# sourceMappingURL=helpers.d.ts.map
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function paginate<T>(items: T[], page: number, limit: number) {
  const offset = (page - 1) * limit;
  const paginatedItems = items.slice(offset, offset + limit);
  return {
    page,
    limit,
    totalItems: items.length,
    totalPages: Math.ceil(items.length / limit),
    data: paginatedItems
  };
}

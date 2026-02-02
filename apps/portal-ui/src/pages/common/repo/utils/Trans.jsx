export function formatBytes(bytes = 0) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let idx = 0;
  let value = bytes;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[idx]}`;
}

export function FileHeader({ path, meta }) {
  const name = path?.split("/").pop() || "Select a file";
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-2 bg-white">
      <div className="min-w-0">
        <div className="font-semibold text-slate-900 truncate">{name}</div>
        <div className="text-xs text-slate-500 truncate">{path || "-"}</div>
      </div>
      <div className="text-xs text-slate-600 whitespace-nowrap">
        {meta?.size ? formatBytes(meta.size) : ""}
      </div>
    </div>
  );
}

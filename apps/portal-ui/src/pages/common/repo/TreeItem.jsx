export default function TreeItem({
  node,
  level,
  selectedPath,
  onSelect,
  expanded,
  toggleExpand,
}) {
  // Use 'folder' type check based on RepoViewer logic
  const isDir = node.type === "folder";
  const isExpanded = expanded.has(node.path);
  // Children are now populated in the node object itself by the parent
  const children = node.children || [];

  const handleSelect = () => {
    // Always call onSelect explicitly.
    // Parent handles whether to toggle expand (if folder) or view file (if file)
    onSelect(node);

    // Also toggle local UI state if it's a folder
    if (isDir) toggleExpand(node.path);
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleSelect}
        className={[
          "w-full text-left flex items-center gap-2 rounded-lg px-2 py-1.5",
          selectedPath === node.path ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50",
        ].join(" ")}
        style={{ paddingLeft: 8 + level * 14 }}
      >
        <span className="text-slate-500 w-4">
          {isDir ? (isExpanded ? "▾" : "▸") : "•"}
        </span>
        <span className="truncate">{node.name}</span>
      </button>

      {isDir && isExpanded && (
        <div className="mt-1">
          {/* We rely on parent to load children. If it's empty/loading, parent status handles it */}
          {children.length > 0 ? (
            children.map((child) => (
              <TreeItem
                key={child.path}
                node={child}
                level={level + 1}
                selectedPath={selectedPath}
                onSelect={onSelect}
                expanded={expanded}
                toggleExpand={toggleExpand}
              />
            ))
          ) : (
            /* If expanded but no children yet, it might be loading or empty */
            <div className="text-xs text-slate-400 px-3 pl-8 py-1">
              {/* Could indicate loading state passed from props if needed, for now simplified */}
              ...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
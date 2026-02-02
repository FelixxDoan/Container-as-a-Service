import { useState } from "react";
import TreeItem from "./TreeItem";

export default function RepoTree({ repo, selectedPath, onSelect }) {
  const [expanded, setExpanded] = useState(new Set([""]));

  const toggleExpand = (path) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-3 h-full">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold text-slate-900">Repository</div>
      </div>

      <div className="space-y-1">
        {repo.map((node) => (
          <TreeItem
            key={node.path}
            node={node}
            level={0}
            selectedPath={selectedPath}
            onSelect={onSelect}
            expanded={expanded}
            toggleExpand={toggleExpand}
          />
        ))}
      </div>
    </div>
  );
}
import React, { useEffect, useState, useCallback } from "react";
import RepoTree from "../../pages/common/repo/RepoTree";
import CodeViewer from "../../pages/common/repo/CodeViewer";
import { FileHeader } from "../../pages/common/repo/utils/Trans";
import { useAuthStore } from "../../session/store";
import listTree from "../../hooks/repo/ListTree";
import { normalizeItem, updateTreeNodes } from "../../utils/treeUtils";
import { useFindClasses } from "../../hooks/class/useFindClasses";

const gateway_service = import.meta.env.GATEWAY_SERVICE || "/api/homework";



export default function RepoViewer() {
  const user = useAuthStore((s) => s.user);
  const classIds = user?.ref_class || [];

  const { classes, loading: classesLoading } = useFindClasses(classIds);

  const [selectedClassId, setSelectedClassId] = useState("");
  const [treeStructure, setTreeStructure] = useState([]);
  const [loadingRepo, setLoadingRepo] = useState(false);

  const [selectedNode, setSelectedNode] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [fileError, setFileError] = useState("");

  const selectedClass = classes.find(c => String(c._id) === String(selectedClassId)) || classes[0];

  useEffect(() => {
    if (!selectedClassId && classes.length > 0) {
      setSelectedClassId(classes[0]._id);
    }
  }, [classes, selectedClassId]);

  // Initial Load (Root)
  useEffect(() => {
    if (!selectedClass?.code) return;

    const loadRoot = async () => {
      setLoadingRepo(true);
      setTreeStructure([]);
      setSelectedNode(null);

      try {
        const prefix = `submissions/${selectedClass.code}/`;
        const data = await listTree(prefix);

        if (Array.isArray(data)) {
          const rootNodes = data.map(normalizeItem).filter(Boolean);
          setTreeStructure(rootNodes);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingRepo(false);
      }
    };
    loadRoot();
  }, [selectedClass]);

  // Lazy Load Children or View File
  const handleSelect = async (node) => {
    setSelectedNode(node);

    // Case 1: Folder -> Lazy Load
    if (node.type === 'folder') {
      // If already loaded, do nothing (toggle handled by Tree component for UI)
      if (node.isLoaded) return;

      try {
        // Fetch children using the folder's path (prefix)
        const data = await listTree(node.path);
        if (Array.isArray(data)) {
          const children = data.map(normalizeItem).filter(Boolean);

          // Update State
          setTreeStructure(prev => updateTreeNodes(prev, node.path, children));
        }
      } catch (err) {
        console.error("Failed to load folder", err);
      }
      return;
    }

    // Case 2: File -> View Content
    if (node.type === 'file') {
      setFileContent(null);
      setFileError("");
      setLoadingFile(true);
      try {
        const fullPath = node.meta?.objectName || node.path;
        const res = await fetch(`${gateway_service}/object?objectName=${encodeURIComponent(fullPath)}`, {
          credentials: 'include'
        });

        if (!res.ok) throw new Error("Failed to load content");
        const { data } = await res.json();
        setFileContent(data);

      } catch (err) {
        setFileError("Could not load file content: " + err.message);
      } finally {
        setLoadingFile(false);
      }
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-4">
      <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
        <h2 className="font-bold text-slate-700">Repositories</h2>
        <div className="flex gap-2">
          {classesLoading && <span className="text-sm text-slate-400">Loading classes...</span>}
          <select
            className="border border-slate-300 rounded px-2 py-1 text-sm min-w-[200px]"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            disabled={classesLoading}
          >
            {classes.map(c => (
              <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 grid gap-4 lg:grid-cols-[320px_1fr] min-h-0">
        <div className="flex flex-col min-h-0 bg-white rounded-lg border border-slate-200">
          {loadingRepo ? (
            <div className="p-4 text-center text-slate-400">Loading tree...</div>
          ) : treeStructure.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-sm">
              No submissions for this class.
            </div>
          ) : (
            <RepoTree
              repo={treeStructure}
              selectedPath={selectedNode?.path}
              onSelect={handleSelect}
            />
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col min-h-0">
          <FileHeader path={selectedNode?.name} meta={selectedNode?.meta} />
          <div className="flex-1 overflow-auto">
            <CodeViewer
              content={fileContent}
              loading={loadingFile}
              error={fileError}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

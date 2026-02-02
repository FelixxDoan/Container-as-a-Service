export default function CodeViewer({ content, loading, error }) {
  if (loading) {
    return <div className="p-4 text-slate-500">Loading file...</div>;
  }
  if (error) {
    return <div className="p-4 text-rose-600">{error}</div>;
  }
  if (!content) {
    return <div className="p-4 text-slate-500">Select a file to preview.</div>;
  }

  const lines = content.split("\n");
  return (
    <pre className="text-sm leading-6 overflow-auto">
      <code className="block">
        {lines.map((line, idx) => (
          <div
            key={idx}
            className="grid grid-cols-[48px_1fr] gap-3 px-4"
          >
            <span className="text-right text-slate-400 select-none">
              {idx + 1}
            </span>
            <span className="whitespace-pre-wrap text-slate-800">{line}</span>
          </div>
        ))}
      </code>
    </pre>
  );
}
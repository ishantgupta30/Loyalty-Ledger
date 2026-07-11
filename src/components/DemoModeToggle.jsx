export default function DemoModeToggle({ demoMode, setDemoMode }) {
  return (
    <button className="demo-toggle" onClick={() => setDemoMode((d) => !d)}>
      {demoMode ? "✕ Exit Demo Preview" : "▶ Demo Preview"}
    </button>
  );
}

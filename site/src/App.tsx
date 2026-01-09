import { Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import Header from "./components/Header";
import HomePage from "./components/HomePage";
import FrameworkDetail from "./components/FrameworkDetail";

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] transition-colors duration-200">
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/framework/:id" element={<FrameworkDetail />} />
        </Routes>
      </main>
      <footer className="border-t border-[var(--border-color)] py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-[var(--text-secondary)]">
          <p>
            BenchHub is open source.{" "}
            <a
              href="https://github.com/your-org/benchhub"
              className="text-[var(--accent)] hover:underline"
            >
              Contribute on GitHub
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

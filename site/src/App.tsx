import { Routes, Route, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Header from "./components/Header";
import Sidebar, { ViewType } from "./components/Sidebar";
import HomePage from "./components/HomePage";
import FrameworkDetail from "./components/FrameworkDetail";

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>("plaintext_rps");
  const location = useLocation();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const isHomePage = location.pathname === "/" || location.pathname === "";

  return (
    <>
      {/* Animated background */}
      <div className="animated-bg" />

      <div className="min-h-screen relative">
        <Header
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          showMenuButton={isHomePage}
        />

        {/* Sidebar - only on home page */}
        {isHomePage && (
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            currentView={currentView}
            onViewChange={setCurrentView}
          />
        )}

        <main className={`container mx-auto px-4 py-8 transition-all duration-300 ${isHomePage ? "lg:pl-72" : ""
          }`}>
          <Routes>
            <Route path="/" element={<HomePage currentView={currentView} />} />
            <Route path="/framework/:id" element={<FrameworkDetail />} />
          </Routes>
        </main>

        <footer className={`border-t border-[var(--border-color)] py-12 mt-16 transition-all duration-300 ${isHomePage ? "lg:pl-64" : ""
          }`}>
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
                  <span className="text-white font-bold">⚡</span>
                </div>
                <span className="font-semibold gradient-text">Awesome Bench</span>
              </div>

              <div className="flex items-center gap-6 text-sm text-[var(--text-secondary)]">
                <a
                  href="https://github.com/carnojs/awesome-bench"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--accent)] transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                  GitHub
                </a>
                <a
                  href="https://github.com/carnojs/awesome-bench/blob/master/CONTRIBUTING.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--accent)] transition-colors"
                >
                  Contribute
                </a>
              </div>

              <p className="text-sm text-[var(--text-muted)]">
                Scientific benchmarks for HTTP frameworks
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

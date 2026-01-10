import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import type { IndexFile, FrameworkResult } from "../types";
import type { ViewType } from "./Sidebar";

// Estimate production performance: value * 4
const estimateProduction = (value: number) => value * 4;

type SortDirection = "asc" | "desc";

interface FrameworkData {
  id: string;
  framework: string;
  language: string;
  url?: string;
  plaintext_rps: number;
  plaintext_p95: number;
  plaintext_p99: number;
  json_rps: number;
  json_p95: number;
  json_p99: number;
  echo_rps: number;
  echo_p95: number;
  echo_p99: number;
  search_rps: number;
  search_p95: number;
  search_p99: number;
  user_rps: number;
  user_p95: number;
  user_p99: number;
  measured_at: string;
}

interface HomePageProps {
  currentView: ViewType;
}

const getLanguageClass = (lang: string): string => {
  const normalized = lang.toLowerCase();
  if (normalized.includes("javascript") || normalized === "js") return "javascript";
  if (normalized.includes("bun")) return "bun";
  if (normalized.includes("go")) return "go";
  if (normalized.includes("rust")) return "rust";
  if (normalized.includes("python")) return "python";
  return "default";
};

const viewTitles: Record<ViewType, { title: string; subtitle: string; metric: string }> = {
  plaintext_rps: { title: "Plaintext Performance", subtitle: "Ranked by requests per second", metric: "req/s" },
  json_rps: { title: "JSON Performance", subtitle: "Ranked by requests per second", metric: "req/s" },
  echo_rps: { title: "Echo POST Performance", subtitle: "JSON parsing speed (POST body)", metric: "req/s" },
  search_rps: { title: "Query Params Performance", subtitle: "Querystring parsing speed", metric: "req/s" },
  user_rps: { title: "Path Params Performance", subtitle: "Router pattern matching efficiency", metric: "req/s" },
  latency_p95: { title: "Best Latency (p95)", subtitle: "Ranked by 95th percentile response time", metric: "p95" },
  latency_p99: { title: "Best Latency (p99)", subtitle: "Ranked by 99th percentile response time", metric: "p99" },
  all_metrics: { title: "All Metrics", subtitle: "Complete comparison of all benchmarks", metric: "" },
};

export default function HomePage({ currentView }: HomePageProps) {
  const [index, setIndex] = useState<IndexFile | null>(null);
  const [frameworks, setFrameworks] = useState<FrameworkData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");

  useEffect(() => {
    async function loadData() {
      try {
        // Use cache: no-cache to always revalidate with server
        const fetchOptions: RequestInit = { cache: "no-cache" };

        const indexRes = await fetch("/awesome-bench/results/index.json", fetchOptions);
        if (!indexRes.ok) {
          setError("No benchmark results available yet.");
          setLoading(false);
          return;
        }
        const indexData: IndexFile = await indexRes.json();
        setIndex(indexData);

        const frameworkPromises = indexData.frameworks.map(async (entry) => {
          const res = await fetch(`/awesome-bench/${entry.latest}`, fetchOptions);
          if (!res.ok) return null;
          const result: FrameworkResult = await res.json();
          return {
            id: entry.id,
            framework: result.framework,
            language: result.language,
            url: result.url,
            plaintext_rps: result.benchmarks.plaintext?.requests_per_sec ?? 0,
            plaintext_p95: result.benchmarks.plaintext?.latency_ms.p95 ?? 0,
            plaintext_p99: result.benchmarks.plaintext?.latency_ms.p99 ?? 0,
            json_rps: result.benchmarks.json?.requests_per_sec ?? 0,
            json_p95: result.benchmarks.json?.latency_ms.p95 ?? 0,
            json_p99: result.benchmarks.json?.latency_ms.p99 ?? 0,
            echo_rps: result.benchmarks.echo?.requests_per_sec ?? 0,
            echo_p95: result.benchmarks.echo?.latency_ms.p95 ?? 0,
            echo_p99: result.benchmarks.echo?.latency_ms.p99 ?? 0,
            search_rps: result.benchmarks.search?.requests_per_sec ?? 0,
            search_p95: result.benchmarks.search?.latency_ms.p95 ?? 0,
            search_p99: result.benchmarks.search?.latency_ms.p99 ?? 0,
            user_rps: result.benchmarks.user?.requests_per_sec ?? 0,
            user_p95: result.benchmarks.user?.latency_ms.p95 ?? 0,
            user_p99: result.benchmarks.user?.latency_ms.p99 ?? 0,
            measured_at: result.measured_at,
          };
        });

        const results = (await Promise.all(frameworkPromises)).filter(
          (r) => r !== null
        ) as FrameworkData[];
        setFrameworks(results);
      } catch {
        setError("Failed to load benchmark data.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Get the metric value based on current view
  const getMetricValue = (fw: FrameworkData): number => {
    switch (currentView) {
      case "plaintext_rps": return fw.plaintext_rps;
      case "json_rps": return fw.json_rps;
      case "echo_rps": return fw.echo_rps;
      case "search_rps": return fw.search_rps;
      case "user_rps": return fw.user_rps;
      case "latency_p95": return fw.plaintext_p95;
      case "latency_p99": return fw.plaintext_p99;
      default: return fw.plaintext_rps;
    }
  };

  // Check if current view is latency-based (lower is better)
  const isLatencyView = currentView === "latency_p95" || currentView === "latency_p99";

  // Get unique languages for filter
  const languages = useMemo(() => {
    const unique = [...new Set(frameworks.map((f) => f.language))];
    return unique.sort();
  }, [frameworks]);

  // Filter frameworks
  const filteredFrameworks = useMemo(() => {
    return frameworks.filter((fw) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!fw.framework.toLowerCase().includes(query) &&
          !fw.language.toLowerCase().includes(query)) {
          return false;
        }
      }
      // Language filter
      if (selectedLanguage !== "all" && fw.language !== selectedLanguage) {
        return false;
      }
      return true;
    });
  }, [frameworks, searchQuery, selectedLanguage]);

  const sortedFrameworks = useMemo(() => {
    return [...filteredFrameworks].sort((a, b) => {
      const aVal = getMetricValue(a);
      const bVal = getMetricValue(b);

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredFrameworks, currentView, sortDirection]);

  // Reset sort direction when view changes
  useEffect(() => {
    setSortDirection(isLatencyView ? "asc" : "desc");
  }, [currentView]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(0);
  };

  const formatLatency = (ms: number): string => {
    if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`;
    return `${ms.toFixed(2)}ms`;
  };

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getRankBadgeClass = (rank: number): string => {
    if (rank === 1) return "gold";
    if (rank === 2) return "silver";
    if (rank === 3) return "bronze";
    return "default";
  };

  // Calculate stats
  const stats = useMemo(() => {
    if (frameworks.length === 0) return null;

    const uniqueLanguages = new Set(frameworks.map((f) => f.language));
    const sorted = [...frameworks].sort((a, b) => {
      const aVal = getMetricValue(a);
      const bVal = getMetricValue(b);
      return isLatencyView ? aVal - bVal : bVal - aVal;
    });
    const best = sorted[0];

    return {
      totalFrameworks: frameworks.length,
      totalLanguages: uniqueLanguages.size,
      bestPerformer: best?.framework || "N/A",
      bestValue: getMetricValue(best) || 0,
    };
  }, [frameworks, currentView]);

  // Calculate max value for progress bar
  const maxValue = useMemo(() => {
    const values = frameworks.map(getMetricValue);
    return Math.max(...values);
  }, [frameworks, currentView]);

  // Get progress percentage (inverted for latency)
  const getProgressPercent = (value: number): number => {
    if (isLatencyView) {
      const minValue = Math.min(...frameworks.map(getMetricValue));
      if (maxValue === minValue) return 100;
      return ((maxValue - value) / (maxValue - minValue)) * 100;
    }
    return (value / maxValue) * 100;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-[var(--border-color)] rounded-full" />
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-[var(--accent)] rounded-full animate-spin" />
        </div>
        <p className="text-[var(--text-secondary)] animate-pulse">Loading benchmarks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] mb-6">
          <svg className="w-10 h-10 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-3">No Results Yet</h2>
        <p className="text-[var(--text-secondary)] max-w-md mx-auto mb-6">
          {error} Benchmarks run automatically when frameworks are added or updated.
        </p>
        <a
          href="https://github.com/carnojs/awesome-bench"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
        >
          Contribute a Framework
        </a>
      </div>
    );
  }

  const viewInfo = viewTitles[currentView];

  return (
    <div className="space-y-6">
      {/* View Header */}
      <header className="fade-in-up">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">
          <span className="gradient-text">{viewInfo.title}</span>
        </h1>
        <p className="text-[var(--text-secondary)]">{viewInfo.subtitle}</p>
      </header>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 fade-in-up delay-100">
          <div className="stats-card">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-[var(--accent-light)]">
                <svg className="w-6 h-6 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-[var(--text-secondary)] font-medium">Frameworks</p>
                <p className="text-2xl font-bold">{stats.totalFrameworks}</p>
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-[var(--success-light)]">
                <svg className="w-6 h-6 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-[var(--text-secondary)] font-medium">Languages</p>
                <p className="text-2xl font-bold">{stats.totalLanguages}</p>
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-[var(--warning-light)]">
                <svg className="w-6 h-6 text-[var(--warning)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-[var(--text-secondary)] font-medium">Best</p>
                <p className="text-lg font-bold truncate">{stats.bestPerformer}</p>
                <p className="text-sm text-[var(--success)] font-semibold">
                  {isLatencyView ? formatLatency(stats.bestValue) : `${formatNumber(estimateProduction(stats.bestValue))} req/s`}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Banner */}
      <div className="premium-card p-4 sm:p-5 fade-in-up delay-200">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="p-2 rounded-lg bg-[var(--accent-light)] flex-shrink-0">
            <svg className="w-5 h-5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Tests run in <strong>Docker containers with limited resources</strong> (CI environment).
              The "requests" column shows projected performance on production hardware.
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 fade-in-up delay-250">
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search frameworks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-sm placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Language Filter */}
        <div className="relative">
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="appearance-none w-full sm:w-48 px-4 py-3 pr-10 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all cursor-pointer"
          >
            <option value="all">All Languages</option>
            {languages.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Results count */}
      {(searchQuery || selectedLanguage !== "all") && (
        <div className="text-sm text-[var(--text-secondary)]">
          Showing <strong>{sortedFrameworks.length}</strong> of <strong>{frameworks.length}</strong> frameworks
          {selectedLanguage !== "all" && <span> in <strong>{selectedLanguage}</strong></span>}
        </div>
      )}

      {/* All Metrics View */}
      {currentView === "all_metrics" ? (
        <div className="premium-card overflow-hidden fade-in-up delay-300">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--bg-tertiary)] border-b border-[var(--border-color)]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    Framework
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    Language
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    Plaintext
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    JSON
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    Echo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    Search
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    p95
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    p99
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {sortedFrameworks.map((fw) => (
                  <tr key={fw.id} className="hover:bg-[var(--accent-light)] transition-colors">
                    <td className="px-4 py-4">
                      <Link
                        to={`/framework/${fw.id}`}
                        className="font-semibold text-[var(--accent)] hover:underline"
                      >
                        {fw.framework}
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`language-badge ${getLanguageClass(fw.language)}`}>
                        {fw.language}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-mono text-sm font-semibold">
                      {formatNumber(estimateProduction(fw.plaintext_rps))}
                    </td>
                    <td className="px-4 py-4 font-mono text-sm font-semibold">
                      {formatNumber(estimateProduction(fw.json_rps))}
                    </td>
                    <td className="px-4 py-4 font-mono text-sm font-semibold">
                      {formatNumber(estimateProduction(fw.echo_rps))}
                    </td>
                    <td className="px-4 py-4 font-mono text-sm font-semibold">
                      {formatNumber(estimateProduction(fw.search_rps))}
                    </td>
                    <td className="px-4 py-4 font-mono text-sm font-semibold">
                      {formatNumber(estimateProduction(fw.user_rps))}
                    </td>
                    <td className="px-4 py-4 font-mono text-sm text-[var(--text-secondary)]">
                      {formatLatency(fw.plaintext_p95)}
                    </td>
                    <td className="px-4 py-4 font-mono text-sm text-[var(--text-secondary)]">
                      {formatLatency(fw.plaintext_p99)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Standard Ranking View */
        <>
          {/* Desktop Table */}
          <div className="premium-card overflow-hidden fade-in-up delay-300 hidden md:block relative z-10">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--bg-tertiary)] border-b border-[var(--border-color)]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] w-16">
                      Rank
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                      Framework
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                      Language
                    </th>
                    {isLatencyView ? (
                      <th
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text-primary)]"
                        onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
                      >
                        <div className="flex items-center gap-1">
                          Latency
                          <span className="text-[var(--accent)]">{sortDirection === "asc" ? "↑" : "↓"}</span>
                        </div>
                      </th>
                    ) : (
                      <>
                        <th
                          className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text-primary)]"
                          onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
                        >
                          <div className="flex items-center gap-1">
                            Requests/sec
                            <span className="text-[var(--accent)]">{sortDirection === "asc" ? "↑" : "↓"}</span>
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                          Measured
                        </th>
                      </>
                    )}
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                      Measured
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {sortedFrameworks.map((fw, index) => {
                    const value = getMetricValue(fw);
                    const rank = index + 1;

                    return (
                      <tr key={fw.id} className="hover:bg-[var(--accent-light)] transition-colors">
                        <td className="px-4 py-4">
                          <span className={`rank-badge ${getRankBadgeClass(rank)}`}>
                            {rank}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <Link
                              to={`/framework/${fw.id}`}
                              className="font-semibold text-[var(--accent)] hover:underline"
                            >
                              {fw.framework}
                            </Link>
                            {fw.url && (
                              <a
                                href={fw.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`language-badge ${getLanguageClass(fw.language)}`}>
                            {fw.language}
                          </span>
                        </td>
                        {isLatencyView ? (
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-24 h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{
                                    width: `${getProgressPercent(value)}%`,
                                    background: "linear-gradient(90deg, #10b981, #14b8a6)",
                                  }}
                                />
                              </div>
                              <span className="font-mono font-semibold text-sm min-w-[80px]">
                                {formatLatency(value)}
                              </span>
                            </div>
                          </td>
                        ) : (
                          <>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-20 h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                      width: `${getProgressPercent(value)}%`,
                                      background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
                                    }}
                                  />
                                </div>
                                <span className="font-mono font-bold text-sm">
                                  {formatNumber(estimateProduction(value))}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span className="font-mono text-xs text-[var(--text-muted)]">
                                {formatNumber(value)}
                              </span>
                            </td>
                          </>
                        )}
                        <td className="px-4 py-4 text-sm text-[var(--text-muted)]">
                          {formatDate(fw.measured_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4 fade-in-up delay-300">
            {sortedFrameworks.map((fw, index) => {
              const value = getMetricValue(fw);
              const rank = index + 1;

              return (
                <Link
                  key={fw.id}
                  to={`/framework/${fw.id}`}
                  className="block premium-card p-4 active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className={`rank-badge ${getRankBadgeClass(rank)}`}>
                        {rank}
                      </span>
                      <div>
                        <h3 className="font-semibold text-[var(--text-primary)]">{fw.framework}</h3>
                        <span className={`language-badge ${getLanguageClass(fw.language)} mt-1`}>
                          {fw.language}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      {isLatencyView ? (
                        <p className="font-mono font-bold text-lg text-[var(--accent)]">
                          {formatLatency(value)}
                        </p>
                      ) : (
                        <>
                          <p className="font-mono font-bold text-lg text-[var(--accent)]">
                            {formatNumber(estimateProduction(value))}
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">
                            measured: {formatNumber(value)}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 w-full h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${getProgressPercent(value)}%`,
                        background: isLatencyView
                          ? "linear-gradient(90deg, #10b981, #14b8a6)"
                          : "linear-gradient(90deg, #6366f1, #8b5cf6)",
                      }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}

      {/* Footer Info */}
      {index && (
        <div className="text-center text-sm text-[var(--text-muted)] fade-in-up delay-400">
          <p>
            Last updated: <span className="font-medium">{formatDate(index.generated_at)}</span>
            <span className="mx-2">·</span>
            64 connections · 6s duration
          </p>
        </div>
      )}
    </div>
  );
}

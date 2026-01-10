import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import type { FrameworkResult } from "../types";

// Estimate production performance: (value/1000)² × 100
const estimateProduction = (value: number) => Math.pow(value / 1000, 2) * 100;

export default function FrameworkDetail() {
  const { id } = useParams<{ id: string }>();
  const [result, setResult] = useState<FrameworkResult | null>(null);
  const [history, setHistory] = useState<FrameworkResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!id) return;

      try {
        const res = await fetch(`/awesome-bench/results/frameworks/${id}/latest.json`);
        if (!res.ok) {
          setError("Framework not found.");
          setLoading(false);
          return;
        }
        const data: FrameworkResult = await res.json();
        setResult(data);
        setHistory([data]);
      } catch {
        setError("Failed to load framework data.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

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
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold mb-2">Framework Not Found</h2>
        <p className="text-[var(--text-secondary)] mb-4">{error}</p>
        <Link to="/" className="text-[var(--accent)] hover:underline">
          Back to Home
        </Link>
      </div>
    );
  }

  const benchmarks = Object.entries(result.benchmarks);

  return (
    <div>
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-8 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to all frameworks
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <h1 className="text-3xl font-bold">{result.framework}</h1>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[var(--bg-secondary)] border border-[var(--border-color)]">
            {result.language}
          </span>
          {result.url && (
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Documentation
            </a>
          )}
        </div>
        <p className="text-[var(--text-secondary)]">
          Last measured: {formatDate(result.measured_at)}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-12">
        {benchmarks.map(([routeId, benchmark]) => (
          <div
            key={routeId}
            className="rounded-2xl border border-[var(--border-color)] p-6 bg-[var(--bg-secondary)]/50"
          >
            <h3 className="text-lg font-semibold mb-4 capitalize">{routeId} Route</h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-start mb-1">
                  <span className="text-sm text-[var(--text-secondary)]">Requests/sec</span>
                  <div className="text-right">
                    <span className="block text-2xl font-bold font-mono text-[var(--accent)]">
                      {formatNumber(estimateProduction(benchmark.requests_per_sec))}
                    </span>
                    <span className="block text-xs text-[var(--text-muted)] mt-1">
                      measured: {formatNumber(benchmark.requests_per_sec)}
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-[var(--bg-primary)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[var(--border-color)]">
                <div>
                  <p className="text-xs text-[var(--text-secondary)] mb-1">p50</p>
                  <p className="font-mono font-medium">{formatLatency(benchmark.latency_ms.p50)}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-secondary)] mb-1">p95</p>
                  <p className="font-mono font-medium">{formatLatency(benchmark.latency_ms.p95)}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-secondary)] mb-1">p99</p>
                  <p className="font-mono font-medium">{formatLatency(benchmark.latency_ms.p99)}</p>
                </div>
              </div>

              {benchmark.errors > 0 && (
                <div className="flex items-center gap-2 text-red-500 text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {benchmark.errors} errors during benchmark
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-[var(--border-color)] p-6">
        <h3 className="text-lg font-semibold mb-4">Environment Details</h3>
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <dt className="text-sm text-[var(--text-secondary)]">OS</dt>
            <dd className="font-medium">{result.environment.os}</dd>
          </div>
          <div>
            <dt className="text-sm text-[var(--text-secondary)]">CI</dt>
            <dd className="font-medium">{result.environment.ci || "N/A"}</dd>
          </div>
          <div>
            <dt className="text-sm text-[var(--text-secondary)]">oha version</dt>
            <dd className="font-medium font-mono text-sm">{result.environment.oha_version}</dd>
          </div>
          <div>
            <dt className="text-sm text-[var(--text-secondary)]">Contract version</dt>
            <dd className="font-medium">{result.contract_version}</dd>
          </div>
        </dl>
      </div>

      {history.length > 1 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">History</h3>
          <div className="space-y-3">
            {history.map((entry, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]"
              >
                <span className="text-sm text-[var(--text-secondary)]">
                  {formatDate(entry.measured_at)}
                </span>
                <div className="flex gap-6">
                  {Object.entries(entry.benchmarks).map(([routeId, bm]) => (
                    <span key={routeId} className="text-sm">
                      <span className="text-[var(--text-secondary)]">{routeId}:</span>{" "}
                      <span className="font-mono font-medium">
                        {formatNumber(bm.requests_per_sec)} req/s
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

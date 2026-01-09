export interface LatencyMs {
  p50: number;
  p95: number;
  p99: number;
}

export interface BenchmarkResult {
  duration_seconds: number;
  requests_per_sec: number;
  latency_ms: LatencyMs;
  errors: number;
}

export interface Environment {
  os: string;
  ci: string;
  oha_version: string;
}

export interface FrameworkResult {
  framework_id: string;
  language: string;
  framework: string;
  measured_at: string;
  contract_version: number;
  runner_version: string;
  environment: Environment;
  benchmarks: Record<string, BenchmarkResult>;
}

export interface IndexEntry {
  id: string;
  language: string;
  framework: string;
  measured_at: string;
  latest: string;
}

export interface IndexFile {
  generated_at: string;
  contract_version: number;
  frameworks: IndexEntry[];
}

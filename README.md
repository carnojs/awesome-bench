# BenchHub

Standardized HTTP benchmarks for web frameworks across different programming languages.

## Overview

BenchHub provides a fair, reproducible comparison of HTTP framework performance. All frameworks implement the same routes and are tested under identical conditions.

### Key Features

- **Standardized Tests**: All frameworks implement the same routes defined in a global contract
- **Automated Benchmarks**: Tests run automatically when frameworks are added or updated
- **Reproducible**: Docker-based execution ensures consistent environments
- **Transparent**: All results and methodology are open source

## Benchmark Parameters

| Parameter | Value |
|-----------|-------|
| Duration | 6 seconds per route |
| Connections | 64 concurrent |
| Warmup | 1 second |
| Tool | [oha](https://github.com/hatoo/oha) |

## Current Frameworks

| Framework | Language |
|-----------|----------|
| Fiber | Go |
| net/http | Go |
| Express | JavaScript (Node.js) |
| Fastify | JavaScript (Node.js) |
| Bun.serve | Bun |
| Elysia | Bun |

## Routes Tested

All frameworks must implement these routes:

| Route | Method | Response |
|-------|--------|----------|
| `/health` | GET | Status 200 |
| `/plaintext` | GET | `OK` (text/plain) |
| `/json` | GET | `{"message":"OK"}` (application/json) |

## How It Works

1. **On merge to main**: When a framework is added or modified, the CI automatically detects changes
2. **Build & Validate**: The framework's Docker image is built and validated against the contract
3. **Benchmark**: Each route is benchmarked for 6 seconds with 64 concurrent connections
4. **Publish**: Results are saved and the site is updated

## Running Locally

### Prerequisites

- Docker
- [oha](https://github.com/hatoo/oha) (`cargo install oha` or download binary)
- jq
- Bash

### Test a Framework

```bash
# Make scripts executable
chmod +x runner/*.sh

# Run benchmark for a specific framework
./runner/run_framework.sh frameworks/go/fiber
```

### Validate Contract Compliance

```bash
# Start your framework on port 8080, then:
./runner/validate_contract.sh http://localhost:8080
```

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on adding new frameworks.

### Quick Start

1. Create a directory: `frameworks/<language>/<framework>/`
2. Add `framework.json` with metadata
3. Add `Dockerfile` that builds and runs your server on port 8080
4. Implement the routes from the contract
5. Submit a PR

## Project Structure

```
benchhub/
├── benchmarks/
│   └── contract.json      # Route definitions
├── frameworks/
│   └── <language>/
│       └── <framework>/
│           ├── Dockerfile
│           ├── framework.json
│           └── src/
├── runner/
│   ├── run_framework.sh   # Main benchmark runner
│   ├── validate_contract.sh
│   ├── benchmark.sh
│   └── aggregate_results.ts
├── results/
│   ├── frameworks/
│   │   └── <framework-id>/
│   │       └── latest.json
│   └── index.json
└── site/                  # React + Vite site
```

## Methodology Notes

- Results are captured at different times as frameworks are updated
- All tests run on GitHub Actions runners (ubuntu-latest)
- Network overhead is minimal as benchmarks run locally within Docker
- Results should be used for relative comparisons, not absolute performance claims

## License

Apache 2.0 - See [LICENSE](LICENSE) for details.

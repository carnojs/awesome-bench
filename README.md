# BenchHub

**Standardized HTTP benchmarks for web frameworks across different programming languages.**

BenchHub provides a fair, transparent, and reproducible way to compare the performance of HTTP frameworks. Every framework implements the same routes under identical conditions, ensuring meaningful comparisons.

## Why BenchHub?

Benchmark comparisons are often inconsistent—different methodologies, environments, and test scenarios make it hard to draw conclusions. BenchHub solves this by enforcing a strict contract that all frameworks must follow, running tests in isolated containers, and publishing results openly.

### Key Principles

- **Standardized Contract**: All frameworks implement identical routes with the same expected responses
- **Reproducible Environment**: Docker-based execution ensures consistent, isolated testing
- **Incremental Updates**: Only changed frameworks are re-benchmarked, preserving historical data
- **Full Transparency**: All code, methodology, and results are open source

## Benchmark Configuration

| Parameter | Value |
|-----------|-------|
| Duration | 6 seconds per route |
| Concurrent Connections | 64 |
| Warmup | 1 second |
| Tool | [oha](https://github.com/hatoo/oha) |

## Routes Tested

Every framework must implement these endpoints on port 8080:

| Route | Method | Response | Content-Type |
|-------|--------|----------|--------------|
| `/health` | GET | Status 200 | Any |
| `/plaintext` | GET | `OK` | `text/plain; charset=utf-8` |
| `/json` | GET | `{"message":"OK"}` | `application/json; charset=utf-8` |

## Included Frameworks

| Framework | Language | Documentation |
|-----------|----------|---------------|
| Fiber | Go | [github.com/gofiber/fiber](https://github.com/gofiber/fiber) |
| net/http | Go | [pkg.go.dev/net/http](https://pkg.go.dev/net/http) |
| Express | JavaScript | [github.com/expressjs/express](https://github.com/expressjs/express) |
| Fastify | JavaScript | [github.com/fastify/fastify](https://github.com/fastify/fastify) |
| Bun.serve | Bun | [bun.sh/docs/api/http](https://bun.sh/docs/api/http) |
| Elysia | Bun | [github.com/elysiajs/elysia](https://github.com/elysiajs/elysia) |

## How It Works

1. **Trigger**: When code in `frameworks/` is merged to `master`, CI detects which frameworks changed
2. **Build**: Each changed framework's Docker image is built
3. **Validate**: The runner verifies the framework implements all routes correctly
4. **Benchmark**: Each route is tested for 6 seconds with 64 concurrent connections
5. **Publish**: Results are saved and the site is automatically updated

Frameworks that weren't modified retain their existing results.

## Running Locally

### Prerequisites

- Docker
- [oha](https://github.com/hatoo/oha)
- jq
- Bash

### Run a Benchmark

```bash
chmod +x runner/*.sh
./runner/run_framework.sh frameworks/go/fiber
```

### Validate Contract Compliance

```bash
# Start your framework on port 8080, then:
./runner/validate_contract.sh http://localhost:8080
```

## Contributing

We welcome contributions. To add a new framework:

1. Create `frameworks/<language>/<framework>/`
2. Add `framework.json` with metadata and documentation URL
3. Add a `Dockerfile` that builds and runs the server on port 8080
4. Implement all routes from the contract
5. Submit a pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed instructions.

## Project Structure

```
benchhub/
├── benchmarks/
│   └── contract.json          # Route definitions (source of truth)
├── frameworks/
│   └── <language>/
│       └── <framework>/
│           ├── Dockerfile
│           ├── framework.json
│           └── src/
├── runner/
│   ├── run_framework.sh       # Main orchestrator
│   ├── validate_contract.sh   # Contract validation
│   ├── benchmark.sh           # Benchmark execution
│   └── aggregate_results.ts   # Results aggregation
├── results/
│   └── frameworks/
│       └── <id>/latest.json   # Latest results per framework
└── site/                      # Results website (React + Vite)
```

## Methodology Notes

- Results are captured at different times as frameworks are updated individually
- All tests run on GitHub Actions runners (ubuntu-latest)
- Benchmarks run locally within Docker, minimizing network variance
- Results should be used for relative comparisons, not absolute performance claims

## License

Apache 2.0 — See [LICENSE](LICENSE) for details.

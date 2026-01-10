# Awesome Bench

**Standardized, contract-driven HTTP benchmarks for web frameworks across different languages.**

![License](https://img.shields.io/badge/license-Apache_2.0-blue.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)
![Frameworks](https://img.shields.io/badge/frameworks-8-orange)

Awesome Bench provides a fair, transparent, and reproducible way to compare the performance of HTTP frameworks. Every framework implements the **same routes** under **identical conditions**, ensuring meaningful side-by-side comparisons.

---

## Why Awesome Bench?

Benchmark comparisons are often inconsistent—different methodologies, environments, and test scenarios make it hard to draw conclusions. Awesome Bench solves this by enforcing a strict contract that all frameworks must follow.

- **Standardized Contract**: All frameworks implement identical routes with the same expected responses.
- **Reproducible Environment**: Docker-based execution ensures consistent, isolated testing.
- **Incremental Updates**: Only changed frameworks are re-benchmarked, preserving historical data.
- **Full Transparency**: All code, methodology, and results are open source.

## Benchmark Configuration

All benchmarks are executed in a standardized environment to ensure fairness.

| Parameter | Value |
|-----------|-------|
| **Duration** | 6 seconds per route |
| **Connections** | 64 concurrent connections |
| **Warmup** | 1 second |
| **Tool** | [oha](https://github.com/hatoo/oha) (HTTP load generator) |
| **Environment** | Linux Docker Containers (GitHub Actions) |

## Routes Tested

Every framework must implement the following endpoints on port **8080**:

| Route | Method | Response | Content-Type |
|-------|--------|----------|--------------|
| `/health` | `GET` | Status 200 | Any |
| `/plaintext` | `GET` | `OK` | `text/plain` |
| `/json` | `GET` | `{"message":"OK"}` | `application/json` |

## Included Frameworks

We currently track performance for the following frameworks:

| Framework | Language | Documentation |
|-----------|----------|---------------|
| **Fiber** | Go | [github.com/gofiber/fiber](https://github.com/gofiber/fiber) |
| **net/http** | Go | [pkg.go.dev/net/http](https://pkg.go.dev/net/http) |
| **Express** | JavaScript | [github.com/expressjs/express](https://github.com/expressjs/express) |
| **Fastify** | JavaScript | [github.com/fastify/fastify](https://github.com/fastify/fastify) |
| **Bun.serve** | Bun | [bun.sh/docs/api/http](https://bun.sh/docs/api/http) |
| **Elysia** | Bun | [github.com/elysiajs/elysia](https://github.com/elysiajs/elysia) |
| **Hono** | Bun | [github.com/honojs/hono](https://github.com/honojs/hono) |
| **Carno.js** | Bun | [github.com/carnojs/carno.js](https://github.com/carnojs/carno.js) |

## How It Works

1. **Trigger**: Code changes in `frameworks/` trigger the CI pipeline.
2. **Build**: Docker images are built for changed frameworks.
3. **Validate**: The runner verifies strict contract compliance (status, headers, body).
4. **Benchmark**: Routes are stress-tested using `oha`.
5. **Publish**: Results are automatically pushed to the website.

## Running Locally

### Prerequisites
- Docker
- [oha](https://github.com/hatoo/oha)
- jq
- Bash environment

### 1. Run a Benchmark
Builds the container and runs the benchmark suite against it.

```bash
chmod +x runner/*.sh
./runner/run_framework.sh frameworks/go/fiber
```

### 2. Validate Contract Compliance
Quickly check if a framework (running locally) satisfies the benchmark requirements.

```bash
# Assuming your framework is running on localhost:8080
./runner/validate_contract.sh http://localhost:8080
```

## Contributing

We welcome contributions! To add a new framework:

1. Create `frameworks/<language>/<framework>/`
2. Add `framework.json` with metadata.
3. Add a `Dockerfile` (must expose port 8080).
4. Implement the required routes (`/health`, `/plaintext`, `/json`).
5. Submit a Pull Request.

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed instructions.

## Project Structure

```
awesome-bench/
├── benchmarks/
│   └── contract.json          # Route definitions (source of truth)
├── frameworks/
│   └── <language>/
│       └── <framework>/       # Framework implementation
├── runner/
│   ├── run_framework.sh       # Main orchestrator
│   └── validate_contract.sh   # Contract validator
├── results/                   # Benchmark data storage
└── site/                      # React + Vite visualization dashboard
```

## License

Apache 2.0 — See [LICENSE](LICENSE) for details.

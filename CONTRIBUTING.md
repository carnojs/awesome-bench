# Contributing to BenchHub

Thank you for your interest in contributing to BenchHub! This guide will help you add a new framework or improve existing ones.

## Adding a New Framework

### 1. Create the Framework Directory

Create a new directory under `frameworks/<language>/<framework-name>/`:

```
frameworks/
  <language>/
    <framework-name>/
      Dockerfile
      framework.json
      src/
        ...
```

### 2. Create framework.json

This file contains metadata about your framework:

```json
{
  "id": "<language>-<framework>",
  "language": "<language>",
  "framework": "<framework-name>",
  "url": "https://github.com/...",
  "contract_version": 1
}
```

- `id`: Unique identifier (lowercase, hyphen-separated)
- `language`: Programming language (e.g., "go", "javascript", "bun", "rust")
- `framework`: Framework name as it should appear on the site
- `url`: Link to the framework's documentation or GitHub repository
- `contract_version`: Must match the current version in `benchmarks/contract.json`

### 3. Implement the Routes

Your server must implement all routes defined in `benchmarks/contract.json`. Currently:

| Route | Method | Response | Content-Type |
|-------|--------|----------|--------------|
| `/health` | GET | Any (status 200) | Any |
| `/plaintext` | GET | `OK` | `text/plain` |
| `/json` | GET | `{"message":"OK"}` | `application/json` |

**Important:**
- Server must listen on port **8080**
- Responses must match exactly (including headers)
- The `/health` endpoint is used for readiness checks

### 4. Create the Dockerfile

Your Dockerfile must:

1. Build the application
2. Expose port 8080
3. Start the server with `CMD`

Example for a Go framework:

```dockerfile
FROM golang:1.22-alpine AS builder

WORKDIR /app
COPY src/ .
RUN go mod init myapp && go build -o server .

FROM alpine:3.19
WORKDIR /app
COPY --from=builder /app/server .
EXPOSE 8080
CMD ["./server"]
```

### 5. Test Locally

Before submitting, test your implementation locally:

```bash
# Build and run your container
docker build -t my-framework frameworks/<language>/<framework>/
docker run -p 8080:8080 my-framework

# In another terminal, validate the contract
./runner/validate_contract.sh http://localhost:8080

# Run a quick benchmark
oha -z 2s -c 10 http://localhost:8080/plaintext
```

### 6. Submit a Pull Request

1. Fork the repository
2. Create a branch: `git checkout -b add-<framework-name>`
3. Add your framework
4. Submit a PR to the `main` branch

**Note:** Benchmarks only run when your PR is merged to `main`. The CI will automatically detect your new framework and run benchmarks.

## Updating an Existing Framework

If you want to update an existing framework (e.g., update dependencies, optimize code):

1. Make your changes
2. Test locally to ensure contract compliance
3. Submit a PR

When merged, only the changed framework will be re-benchmarked.

## Code Style Guidelines

- Keep implementations minimal and focused on performance
- Don't add unnecessary dependencies
- Use production-ready configurations (disable logging, debug modes, etc.)
- Follow the existing patterns for your language

## Questions?

Open an issue if you have questions or need help adding a framework.

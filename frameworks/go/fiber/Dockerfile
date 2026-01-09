FROM golang:1.22-alpine AS builder

WORKDIR /app

COPY src/main.go .

RUN go mod init benchhub/go-fiber && \
    go mod tidy && \
    CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o server main.go

FROM alpine:3.19

WORKDIR /app

COPY --from=builder /app/server .

EXPOSE 8080

CMD ["./server"]

FROM golang:1.21-alpine3.18

RUN apk add --update --no-cache ca-certificates curl

WORKDIR /app

COPY go.mod go.sum /app/

# Install dependencies
RUN go mod download

# Triggers rebuild on file changes
RUN go install github.com/githubnemo/CompileDaemon@v1.4.0

COPY Makefile /app/

# We can do copy . . but that will copy extra files too for no reason
COPY main.go /app/main.go

# cache build for faster subsequent builds, usefull when doing first docker compose up
RUN go build -o ./app main.go

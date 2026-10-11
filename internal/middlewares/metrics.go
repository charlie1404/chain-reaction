package middlewares

import (
	"bufio"
	"errors"
	"fmt"
	"net"
	"net/http"
	"time"

	"github.com/charlie1404/chain-reaction/internal/o11y/metrics"
)

type responseWriter struct {
	http.ResponseWriter
	statusCode int
	hijacked   bool
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

func (rw *responseWriter) Hijack() (net.Conn, *bufio.ReadWriter, error) {
	rw.hijacked = true

	h, ok := rw.ResponseWriter.(http.Hijacker)
	if !ok {
		return nil, nil, errors.New("hijack not supported")
	}
	return h.Hijack()
}

func HttpMetricsHandler(next http.Handler) http.Handler {
	fn := func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		rw := &responseWriter{w, http.StatusOK, false}

		defer func() {
			if rw.hijacked {
				return
			}
			elapsedMs := float64(time.Since(start).Microseconds())

			statusText := fmt.Sprintf("%d", rw.statusCode)
			if metrics.HttpRequestsCounter != nil {
				metrics.IncHttpRequestsCounter(statusText, r.URL.Path)
			}
			if metrics.HttpRequestDurHistogram != nil {
				metrics.ObserveHttpRequestsDuration(statusText, r.URL.Path, elapsedMs)
			}
		}()

		next.ServeHTTP(rw, r)
	}

	return http.HandlerFunc(fn)
}

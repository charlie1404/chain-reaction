package metrics

import (
	"context"
	"log/slog"
	"net/http"
	"net/http/pprof"
	"time"

	"github.com/prometheus/client_golang/prometheus/promhttp"

	"github.com/charlie1404/chain-reaction/internal/config"
)

type MetricsServer struct {
	httpServer *http.Server
}

func (s *MetricsServer) Shutdown() error {
	slog.Debug("SHUTTING_DOWN_METRICS_SERVER")

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	err := s.httpServer.Shutdown(ctx)

	if err != nil {
		slog.Error("METRICS_HTTP_SERVER_SHUTDOWN_FAILED", "error", err)
	} else {
		slog.Debug("METRICS_SHUTDOWN_COMPLETE")
	}

	return err
}

func (s *MetricsServer) StartServer() {
	// runtime.SetMutexProfileFraction(5)
	// runtime.SetBlockProfileRate(5)

	srvMux := http.NewServeMux()

	srvMux.HandleFunc("/debug/pprof/", pprof.Index)
	srvMux.HandleFunc("/debug/pprof/cmdline", pprof.Cmdline)
	srvMux.HandleFunc("/debug/pprof/profile", pprof.Profile)
	srvMux.HandleFunc("/debug/pprof/symbol", pprof.Symbol)
	srvMux.HandleFunc("/debug/pprof/trace", pprof.Trace)

	srvMux.Handle("/metrics", promhttp.HandlerFor(registry, promhttp.HandlerOpts{
		Registry: registry,
	}))

	srvMux.Handle("/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(`<a href="/metrics">/metrics</a>`))
	}))

	s.httpServer = &http.Server{
		Addr:    config.AppConfig.Metrics.Host,
		Handler: srvMux,
	}

	slog.Debug("METRICS_SERVER_STARTING")
	err := s.httpServer.ListenAndServe()
	if err == http.ErrServerClosed {
		slog.Debug("METRICS_HTTP_SERVER_STOPPED")
		return
	}
	if err != nil {
		slog.Error("METRICS_HTTP_SERVER_STOPPED_UNEXPECTED", "error", err)
	}
}

func New() *MetricsServer {
	initRegistry()
	s := &MetricsServer{}
	return s
}

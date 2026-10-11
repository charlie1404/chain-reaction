package metrics

import (
	"regexp"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/collectors"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

var (
	registry               *prometheus.Registry
	requestSizesBucket     = []float64{100, 200, 400, 600, 800, 1600, 6400, 12800, 51200, 102400, 271360}
	requestDurationsBucket = []float64{50, 100, 200, 400, 800, 2000, 5000, 50000, 100000, 500000, 1000000}
)

func initRegistry() {
	registry = prometheus.NewRegistry()

	// registry.MustRegister(collectors.NewGoCollector())
	registry.MustRegister(collectors.NewBuildInfoCollector())
	registry.MustRegister(collectors.NewGoCollector(
		collectors.WithGoCollectorRuntimeMetrics(collectors.GoRuntimeMetricsRule{Matcher: regexp.MustCompile("/.*")}),
	))

	registry.MustRegister(
		collectors.NewProcessCollector(collectors.ProcessCollectorOpts{}),
	)

	promWithRegistry := promauto.With(registry)

	HttpRequestsCounter = promWithRegistry.NewCounterVec(prometheus.CounterOpts{
		Namespace: "cr",
		Subsystem: "http",
		Name:      "requests_total",
		Help:      "The total number of HTTP requests.",
	}, []string{STATUS_CODE_LABEL, ACTION_LABEL})

	HttpRequestDurHistogram = promWithRegistry.NewHistogramVec(prometheus.HistogramOpts{
		Namespace: "cr",
		Subsystem: "http",
		Name:      "request_duration_micros",
		Help:      "The latency of the HTTP requests.",
		Buckets:   requestDurationsBucket,
	}, []string{STATUS_CODE_LABEL, ACTION_LABEL})

	HttpRequestSizeHistogram = promWithRegistry.NewHistogramVec(prometheus.HistogramOpts{
		Namespace: "cr",
		Subsystem: "http",
		Name:      "request_size_bytes",
		Help:      "The size of the HTTP requests.",
		Buckets:   requestSizesBucket,
	}, []string{STATUS_CODE_LABEL, ACTION_LABEL})

	HttpResponseSizeHistogram = promWithRegistry.NewHistogramVec(prometheus.HistogramOpts{
		Namespace: "cr",
		Subsystem: "http",
		Name:      "response_size_bytes",
		Help:      "The size of the HTTP responses.",
		Buckets:   requestSizesBucket,
	}, []string{STATUS_CODE_LABEL, ACTION_LABEL})

	HttpRequestsInflight = promWithRegistry.NewGaugeVec(prometheus.GaugeOpts{
		Namespace: "cr",
		Subsystem: "http",
		Name:      "requests_inflight",
		Help:      "The number of inflight requests being handled at the same time.",
	}, []string{})
}

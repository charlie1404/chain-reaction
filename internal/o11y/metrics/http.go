package metrics

import "github.com/prometheus/client_golang/prometheus"

var (
	HttpRequestsCounter       *prometheus.CounterVec
	HttpRequestDurHistogram   *prometheus.HistogramVec
	HttpRequestSizeHistogram  *prometheus.HistogramVec
	HttpResponseSizeHistogram *prometheus.HistogramVec
	HttpRequestsInflight      *prometheus.GaugeVec
)

func IncHttpRequestsCounter(status, action string) {
	HttpRequestsCounter.WithLabelValues(status, action).Inc()
}

func ObserveHttpRequestsDuration(status, action string, duration float64) {
	HttpRequestDurHistogram.WithLabelValues(status, action).Observe(duration)
}

func ObserveHttpRequestSize(status, action string, sizeBytes float64) {
	HttpRequestSizeHistogram.WithLabelValues(status, action).Observe(sizeBytes)
}

func ObserveHttpResponseSize(status, action string, sizeBytes float64) {
	HttpResponseSizeHistogram.WithLabelValues(status, action).Observe(sizeBytes)
}

func IncHttpRequestsInflight(service, id string, quantity float64) {
	HttpRequestsInflight.WithLabelValues(service, id).Add(quantity)
}

func DecHttpRequestsInflight(service, id string, quantity float64) {
	HttpRequestsInflight.WithLabelValues(service, id).Sub(quantity)
}

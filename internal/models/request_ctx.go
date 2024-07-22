package models

type RequestCtx struct {
	// RequestID is a unique identifier for the request
	RequestID string

	// UserID is the user id of the user making the request
	UserID []byte

	// IP is the IP address of the user making the request
	IP string

	// UserAgent is the user agent of the user making the request
	UserAgent string
}

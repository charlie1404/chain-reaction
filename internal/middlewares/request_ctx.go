package middlewares

import (
	"context"
	"net/http"
	"unsafe"

	"github.com/charlie1404/chain-reaction/internal/constants"
	"github.com/charlie1404/chain-reaction/internal/models"
	"github.com/charlie1404/chain-reaction/internal/utils"
)

var RequestIDSize = 14
var NullUserID = []byte{}

func InjectRequestContext(next http.Handler) http.Handler {
	fn := func(w http.ResponseWriter, r *http.Request) {
		requestId := utils.NewStr(RequestIDSize)

		requestCtx := &models.RequestCtx{
			UserID:    NullUserID,
			UserAgent: r.Header.Get("User-Agent"),
			IP:        r.Header.Get("X-Forwarded-For") + ", " + r.RemoteAddr,
			RequestID: unsafe.String(unsafe.SliceData(requestId), RequestIDSize),
		}

		ctx := context.WithValue(r.Context(), constants.ContextKeyRequestCtx, requestCtx)
		next.ServeHTTP(w, r.WithContext(ctx))
	}

	return http.HandlerFunc(fn)
}

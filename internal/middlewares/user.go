package middlewares

import (
	"errors"
	"net/http"
	"unsafe"

	"github.com/charlie1404/chain-reaction/internal/constants"
	"github.com/charlie1404/chain-reaction/internal/models"
	"github.com/charlie1404/chain-reaction/internal/utils"
)

var IdSize = 8

func getNewSignedUserCookie() string {
	uidValue := utils.NewStr(IdSize)
	uisSign := utils.ComputeHmac(uidValue)

	return unsafe.String(unsafe.SliceData(uidValue), IdSize) + "." + uisSign
}

func EnsureUserContext(next http.Handler) http.Handler {
	fn := func(w http.ResponseWriter, r *http.Request) {
		uid, err := r.Cookie("uid")
		var cookieValue string

		if err != nil {
			if !errors.Is(err, http.ErrNoCookie) {
				http.Error(w, "server error", http.StatusInternalServerError)
				return
			}

			cookieValue = getNewSignedUserCookie()
		} else {
			cookieValue = uid.Value

			uidValue := cookieValue[:IdSize]
			uidSign := cookieValue[IdSize+1:]
			computedHmac := utils.ComputeHmac(unsafe.Slice(unsafe.StringData(uidValue), IdSize))

			// no concept of unauthenticated user, just create a new cookie
			// just a prevention for impersonation by editing cookie
			// let them play
			if computedHmac != uidSign {
				cookieValue = getNewSignedUserCookie()
			}
		}

		http.SetCookie(w, &http.Cookie{
			Name:     "uid",
			Value:    cookieValue,
			Path:     "/",
			MaxAge:   31_536_000, // seconds in a year
			HttpOnly: true,
			Secure:   true,
			SameSite: http.SameSiteLaxMode,
		})

		requestCtx := r.Context().Value(constants.ContextKeyRequestCtx).(*models.RequestCtx)
		requestCtx.UserID = unsafe.Slice(unsafe.StringData(cookieValue[:IdSize]), len(cookieValue[:IdSize]))

		next.ServeHTTP(w, r)
	}

	return http.HandlerFunc(fn)
}

package middlewares

import (
	"crypto/md5"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	randv2 "math/rand/v2"
	"net/http"
	"unsafe"
)

// N1PCdw3M2B1TfJhoaY2mL736p2vCUc47N1PCdw3M2B1TfJhoaY2mL736p2vCUc47

var IdSize = 8

var HASH_FUNCTION = md5.Sum

var HMAC_SECRET_KEY = "MY_SUPER_SECRET"
var HMAC_SECRET = sha256.Sum256([]byte(HMAC_SECRET_KEY))
var HMAC_SECRET_SIZE = sha256.Size
var HMAC_HASH_SIZE = md5.Size

var innerPaddedKey = make([]byte, HMAC_SECRET_SIZE)
var outerPaddedKey = make([]byte, HMAC_SECRET_SIZE)

// keep this of length 64, else on byte[i] & 63 will not work
var ALPHABET = []byte("CR0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")

func init() {
	for i := range HMAC_SECRET_SIZE {
		innerPaddedKey[i] = 0x36 ^ HMAC_SECRET[i]
		outerPaddedKey[i] = 0x5c ^ HMAC_SECRET[i]
	}
}

func newId() []byte {
	id := make([]byte, IdSize)
	bytes := make([]byte, IdSize)

	if _, err := rand.Read(bytes); err != nil {
		// fallback to math/rand
		for i := range IdSize {
			id[i] = ALPHABET[randv2.UintN(64)]
		}
	} else {
		for i := range IdSize {
			id[i] = ALPHABET[bytes[i]&63]
		}
	}

	return id[:IdSize]
}

func computeHmac(msg []byte) string {
	msgSlice := make([]byte, len(msg)+HMAC_SECRET_SIZE)
	hmacSlice := make([]byte, HMAC_SECRET_SIZE+HMAC_HASH_SIZE)

	copy(msgSlice, innerPaddedKey)
	copy(msgSlice[HMAC_SECRET_SIZE:], msg)

	msgHash := HASH_FUNCTION(msgSlice)

	copy(hmacSlice, outerPaddedKey)
	copy(hmacSlice[HMAC_SECRET_SIZE:], msgHash[:])

	hmac := HASH_FUNCTION(hmacSlice)

	return base64.RawURLEncoding.EncodeToString(hmac[:])
}

func getNewSignedUserCookie() string {
	uidValue := newId()
	uisSign := computeHmac(uidValue)

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
			computedHmac := computeHmac(unsafe.Slice(unsafe.StringData(uidValue), IdSize))

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

		next.ServeHTTP(w, r)
	}

	return http.HandlerFunc(fn)
}

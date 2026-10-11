package utils

import (
	"crypto/md5"
	"crypto/sha256"
	"encoding/base64"
)

var HMAC_SECRET_KEY = "MY_SUPER_SECRET"
var HMAC_SECRET = sha256.Sum256([]byte(HMAC_SECRET_KEY))

var innerPaddedKey = make([]byte, sha256.Size)
var outerPaddedKey = make([]byte, sha256.Size)

func init() {
	for i := range sha256.Size {
		innerPaddedKey[i] = 0x36 ^ HMAC_SECRET[i]
		outerPaddedKey[i] = 0x5c ^ HMAC_SECRET[i]
	}
}

func ComputeHmac(msg []byte) string {
	msgSlice := make([]byte, len(msg)+sha256.Size)
	hmacSlice := make([]byte, sha256.Size+md5.Size)

	copy(msgSlice, innerPaddedKey)
	copy(msgSlice[sha256.Size:], msg)

	msgHash := md5.Sum(msgSlice)

	copy(hmacSlice, outerPaddedKey)
	copy(hmacSlice[sha256.Size:], msgHash[:])

	hmac := md5.Sum(hmacSlice)

	return base64.RawURLEncoding.EncodeToString(hmac[:])
}

package utils

import (
	"crypto/rand"
	randv2 "math/rand/v2"
)

// keep this of length 64, else on byte[i] & 63 will not work
var alphabet = []byte("CR0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")

func NewStr(size int) []byte {
	id := make([]byte, size)
	bytes := make([]byte, size)

	if _, err := rand.Read(bytes); err != nil {
		// fallback to math/rand
		for i := range size {
			id[i] = alphabet[randv2.UintN(64)]
		}
	} else {
		for i := range size {
			id[i] = alphabet[bytes[i]&63]
		}
	}

	return id[:size]
}

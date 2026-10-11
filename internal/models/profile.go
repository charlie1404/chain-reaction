package models

var BucketProfiles = []byte("profiles")

type StoredProfile struct {
	Name   string `json:"name"`
	Avatar string `json:"avatar"`
}


package api

import (
	"encoding/json"
	"errors"
	"net/http"
	"unsafe"

	"github.com/charlie1404/chain-reaction/internal/constants"
	"github.com/charlie1404/chain-reaction/internal/models"
	"go.etcd.io/bbolt"
)

type UserProfileResponse struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Avatar string `json:"avatar"`
}

func (s *ApiApp) GetStoredProfile(userId []byte) (models.StoredProfile, error) {
	if s.db == nil {
		return models.StoredProfile{Name: "Player", Avatar: "cyber-bot"}, errors.New("db not initialized")
	}

	var rawData []byte
	s.db.View(func(tx *bbolt.Tx) error {
		b := tx.Bucket(models.BucketProfiles)
		if b != nil {
			raw := b.Get(userId)
			if len(raw) > 0 {
				rawData = append([]byte(nil), raw...)
			}
		}
		return nil
	})

	if len(rawData) == 0 {
		return models.StoredProfile{}, errors.New("profile not found")
	}

	var profile models.StoredProfile
	if err := json.Unmarshal(rawData, &profile); err != nil || profile.Name == "" {
		return models.StoredProfile{Name: string(rawData), Avatar: "cyber-bot"}, nil
	}

	return profile, nil
}

func (s *ApiApp) GetProfile(w http.ResponseWriter, r *http.Request) {
	requestCtxVal := r.Context().Value(constants.ContextKeyRequestCtx)
	if requestCtxVal == nil {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]any{"error": "Unauthorized: identity not present"})
		return
	}

	requestCtx := requestCtxVal.(*models.RequestCtx)
	if len(requestCtx.UserID) == 0 {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]any{"error": "Unauthorized: identity not present"})
		return
	}

	userId := requestCtx.UserID
	userIdStr := unsafe.String(unsafe.SliceData(userId), len(userId))

	profile, err := s.GetStoredProfile(userId)
	if err != nil {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]any{"error": "Profile not found"})
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	json.NewEncoder(w).Encode(UserProfileResponse{
		ID:     userIdStr,
		Name:   profile.Name,
		Avatar: profile.Avatar,
	})
}

func (s *ApiApp) SetProfile(w http.ResponseWriter, r *http.Request) {
	userId := r.Context().Value(constants.ContextKeyRequestCtx).(*models.RequestCtx).UserID
	userIdStr := unsafe.String(unsafe.SliceData(userId), len(userId))

	var reqBody struct {
		Name   string `json:"name"`
		Avatar string `json:"avatar"`
	}

	if r.Header.Get("Content-Type") == "application/json" {
		if err := json.NewDecoder(r.Body).Decode(&reqBody); err != nil {
			http.Error(w, "invalid json body", http.StatusBadRequest)
			return
		}
	} else {
		r.ParseForm()
		reqBody.Name = r.FormValue("name")
		reqBody.Avatar = r.FormValue("avatar")
	}

	if reqBody.Name == "" {
		http.Error(w, "name is required", http.StatusBadRequest)
		return
	}

	if len(reqBody.Name) > 100 {
		http.Error(w, "name is too long", http.StatusBadRequest)
		return
	}

	if reqBody.Avatar == "" {
		reqBody.Avatar = "cyber-bot"
	}

	stored := models.StoredProfile{
		Name:   reqBody.Name,
		Avatar: reqBody.Avatar,
	}

	jsonBytes, err := json.Marshal(stored)
	if err != nil {
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if s.db != nil {
		err = s.db.Update(func(tx *bbolt.Tx) error {
			b := tx.Bucket(models.BucketProfiles)
			if b == nil {
				var bErr error
				b, bErr = tx.CreateBucketIfNotExists(models.BucketProfiles)
				if bErr != nil {
					return bErr
				}
			}
			return b.Put(userId, jsonBytes)
		})
		if err != nil {
			http.Error(w, "error saving profile", http.StatusInternalServerError)
			return
		}
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	json.NewEncoder(w).Encode(UserProfileResponse{
		ID:     userIdStr,
		Name:   stored.Name,
		Avatar: stored.Avatar,
	})
}

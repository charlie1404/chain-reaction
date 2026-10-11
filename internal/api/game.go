package api

import (
	"encoding/json"
	"errors"
	"net/http"
	"unsafe"

	"github.com/charlie1404/chain-reaction/internal/constants"
	"github.com/charlie1404/chain-reaction/internal/game"
	"github.com/charlie1404/chain-reaction/internal/models"
	"github.com/charlie1404/chain-reaction/internal/utils"
)

var GameIdSize = 10

type CreateGameRequest struct {
	BoardSize       string `json:"boardSize"`
	TurnWaitSeconds int    `json:"turnWaitSeconds"`
}

func (s *ApiApp) CreateGame(w http.ResponseWriter, r *http.Request) {
	requestCtx := r.Context().Value(constants.ContextKeyRequestCtx).(*models.RequestCtx)
	userIdStr := unsafe.String(unsafe.SliceData(requestCtx.UserID), len(requestCtx.UserID))

	var req CreateGameRequest
	if r.Header.Get("Content-Type") == "application/json" {
		_ = json.NewDecoder(r.Body).Decode(&req)
	}

	settings := game.LobbySettings{
		BoardSize:       req.BoardSize,
		TurnWaitSeconds: req.TurnWaitSeconds,
	}
	if settings.BoardSize != "s" && settings.BoardSize != "l" {
		settings.BoardSize = "s"
	}
	if settings.TurnWaitSeconds == 0 && req.TurnWaitSeconds != 0 {
		settings.TurnWaitSeconds = 60
	}

	gameId := utils.NewStr(GameIdSize)
	gameIdStr := unsafe.String(unsafe.SliceData(gameId), len(gameId))

	_ = game.CreateGameFile(gameId, requestCtx.UserID)

	profile, _ := s.GetStoredProfile(requestCtx.UserID)

	snapshot, hostPlayer := s.gameManager.CreateGame(gameIdStr, userIdStr, profile.Name, profile.Avatar, settings)

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	json.NewEncoder(w).Encode(map[string]any{
		"roomId":      gameIdStr,
		"settings":    snapshot.Settings,
		"currentUser": hostPlayer,
	})
}

func (s *ApiApp) GetOrJoinLobby(w http.ResponseWriter, r *http.Request) {
	roomId := r.URL.Query().Get("roomId")
	if roomId == "" {
		roomId = r.URL.Query().Get("id")
	}
	if roomId == "" {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]any{
			"valid": false,
			"error": "roomId parameter is required",
		})
		return
	}

	requestCtx := r.Context().Value(constants.ContextKeyRequestCtx).(*models.RequestCtx)
	userIdStr := unsafe.String(unsafe.SliceData(requestCtx.UserID), len(requestCtx.UserID))

	profile, _ := s.GetStoredProfile(requestCtx.UserID)

	snapshot, player, err := s.gameManager.GetOrJoinLobby(roomId, userIdStr, profile.Name, profile.Avatar)
	if err != nil {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		if errors.Is(err, game.ErrGameNotFound) {
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]any{
				"valid": false,
				"error": "Game not found",
			})
			return
		}
		if errors.Is(err, game.ErrLobbyFull) {
			w.WriteHeader(http.StatusConflict)
			json.NewEncoder(w).Encode(map[string]any{
				"valid": false,
				"error": "Lobby is full",
			})
			return
		}

		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]any{
			"valid": false,
			"error": err.Error(),
		})
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	json.NewEncoder(w).Encode(map[string]any{
		"valid":              true,
		"roomId":             snapshot.ID,
		"status":             snapshot.Status,
		"settings":           snapshot.Settings,
		"isHost":             (userIdStr == snapshot.OwnerID),
		"currentUser":        player,
		"assignedSlot":       player.Slot,
		"assignedColorIndex": player.ColorIndex,
		"assignedColor":      player.Color,
		"players":            snapshot.Players,
		"winner":             snapshot.Winner,
	})
}

func (s *ApiApp) UpdateLobbySettings(w http.ResponseWriter, r *http.Request) {
	requestCtx := r.Context().Value(constants.ContextKeyRequestCtx).(*models.RequestCtx)
	userIdStr := unsafe.String(unsafe.SliceData(requestCtx.UserID), len(requestCtx.UserID))

	var req struct {
		RoomID          string `json:"roomId"`
		BoardSize       string `json:"boardSize"`
		TurnWaitSeconds int    `json:"turnWaitSeconds"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]any{"error": "Invalid request body"})
		return
	}

	snapshot, err := s.gameManager.UpdateSettings(req.RoomID, userIdStr, game.LobbySettings{
		BoardSize:       req.BoardSize,
		TurnWaitSeconds: req.TurnWaitSeconds,
	})
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]any{"error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	json.NewEncoder(w).Encode(snapshot)
}

func (s *ApiApp) StartLobbyGame(w http.ResponseWriter, r *http.Request) {
	requestCtx := r.Context().Value(constants.ContextKeyRequestCtx).(*models.RequestCtx)
	userIdStr := unsafe.String(unsafe.SliceData(requestCtx.UserID), len(requestCtx.UserID))

	var req struct {
		RoomID string `json:"roomId"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]any{"error": "Invalid request body"})
		return
	}

	snapshot, err := s.gameManager.StartGame(req.RoomID, userIdStr)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]any{"error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	json.NewEncoder(w).Encode(snapshot)
}

func (s *ApiApp) RemoveLobbyPlayer(w http.ResponseWriter, r *http.Request) {
	requestCtx := r.Context().Value(constants.ContextKeyRequestCtx).(*models.RequestCtx)
	userIdStr := unsafe.String(unsafe.SliceData(requestCtx.UserID), len(requestCtx.UserID))

	var req struct {
		RoomID   string `json:"roomId"`
		PlayerID string `json:"playerId"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]any{"error": "Invalid request body"})
		return
	}

	snapshot, err := s.gameManager.RemovePlayer(req.RoomID, userIdStr, req.PlayerID)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]any{"error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	json.NewEncoder(w).Encode(snapshot)
}

func (s *ApiApp) FinishLobbyGame(w http.ResponseWriter, r *http.Request) {
	var req struct {
		RoomID   string `json:"roomId"`
		WinnerID string `json:"winnerId"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]any{"error": "Invalid request body"})
		return
	}

	snapshot, err := s.gameManager.FinishGame(req.RoomID, req.WinnerID)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]any{"error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	json.NewEncoder(w).Encode(snapshot)
}

func (s *ApiApp) ResetLobbyGame(w http.ResponseWriter, r *http.Request) {
	requestCtx := r.Context().Value(constants.ContextKeyRequestCtx).(*models.RequestCtx)
	userIdStr := unsafe.String(unsafe.SliceData(requestCtx.UserID), len(requestCtx.UserID))

	var req struct {
		RoomID string `json:"roomId"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]any{"error": "Invalid request body"})
		return
	}

	snapshot, err := s.gameManager.ResetGame(req.RoomID, userIdStr)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]any{"error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	json.NewEncoder(w).Encode(snapshot)
}

func (s *ApiApp) Heartbeat(w http.ResponseWriter, r *http.Request) {
	requestCtx := r.Context().Value(constants.ContextKeyRequestCtx).(*models.RequestCtx)
	userIdStr := unsafe.String(unsafe.SliceData(requestCtx.UserID), len(requestCtx.UserID))

	var req struct {
		RoomID string `json:"roomId"`
	}
	if r.Header.Get("Content-Type") == "application/json" && r.Body != nil {
		_ = json.NewDecoder(r.Body).Decode(&req)
	}
	if req.RoomID == "" {
		req.RoomID = r.URL.Query().Get("roomId")
	}

	if req.RoomID == "" {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]any{"error": "roomId parameter is required"})
		return
	}

	err := s.gameManager.Heartbeat(req.RoomID, userIdStr)
	if err != nil {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		if errors.Is(err, game.ErrGameNotFound) {
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]any{"error": "Game not found"})
			return
		}
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]any{"error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	json.NewEncoder(w).Encode(map[string]any{"success": true})
}

package api

import (
	"net/http"

	"github.com/charlie1404/chain-reaction/internal/constants"
	"github.com/charlie1404/chain-reaction/internal/game"
	"github.com/charlie1404/chain-reaction/internal/models"
	"github.com/charlie1404/chain-reaction/internal/utils"
)

var GameIdSize = 10

func (s *ApiApp) CreateGame(w http.ResponseWriter, r *http.Request) {
	// create game logic
	gameId := utils.NewStr(GameIdSize)

	requestCtx := r.Context().Value(constants.ContextKeyRequestCtx).(*models.RequestCtx)

	game.CreateGameFile(gameId, requestCtx.UserID)

	w.Write(gameId)
}

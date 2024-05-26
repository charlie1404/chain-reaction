package models

import (
	"time"

	"github.com/gorilla/websocket"
)

var Colors = [8]string{
	"#FF0000", // red
	"#00FF00", // green
	"#0000FF", // blue
	"#FFFF00", // yellow
	"#FF00FF", // magenta
	"#00FFFF", // cyan
	"#FF7F00", // orange
	"#FFFFFF", // white
}

// Player represents a single player
type Player struct {
	UserName     string `json:"username"`
	Color        string `json:"color"`
	wsConnection *websocket.Conn
}

// GameInstance represents a single game instance
type GameInstance struct {
	Board        [][]uint16
	PlayersCount uint8
	CurrentTurn  uint64
	AllPlayers   []uint64
	Winner       uint64
	RoomID       uint64
	CreatedOn    int64
}

// Init initializes game instance
func (i *GameInstance) Init(name string) {
	i.CreatedOn = time.Now().UTC()
	i.ExpiresOn = i.CreatedOn.Add(time.Minute * time.Duration(25))
	i.CurrentTurn = 0
	i.Board = make([]Pixel, i.Dimension*i.Dimension)
	i.RoomName = name
	i.AvailableColors = Colors
	i.RecvMove = make(chan MoveMsg)
	i.UpdatedBoard = make(chan []int)
}

// GetJoinedPlayersCount gets count of currently joined players count and increase it by one
func (i *GameInstance) GetJoinedPlayersCount() int {
	i.joinedPlayersCntMutex.Lock()
	defer i.joinedPlayersCntMutex.Unlock()
	return i.joinedPlayersCnt
}

// IncJoinedPlayersCount gets count of currently joined players count and increase it by one
func (i *GameInstance) IncJoinedPlayersCount() {
	i.joinedPlayersCntMutex.Lock()
	defer i.joinedPlayersCntMutex.Unlock()
	i.joinedPlayersCnt++
}

// IncCurrentActivePlayers increases current active players count safely
func (i *GameInstance) IncCurrentActivePlayers() {
	i.currActivePlayersCntMutex.Lock()
	i.currActivePlayersCnt++
	i.currActivePlayersCntMutex.Unlock()
}

// DecCurrentActivePlayersCount decreases active players count safely
func (i *GameInstance) DecCurrentActivePlayersCount() {
	i.currActivePlayersCntMutex.Lock()
	i.currActivePlayersCnt--
	i.currActivePlayersCntMutex.Unlock()
}

// GetCurrentActivePlayersCount gets the current active players count safely
func (i *GameInstance) GetCurrentActivePlayersCount() int {
	i.currActivePlayersCntMutex.Lock()
	val := i.currActivePlayersCnt
	i.currActivePlayersCntMutex.Unlock()
	return val
}

// GetPlayerByUsername returns Player struct from instance id
func (i *GameInstance) GetPlayerByUsername(username string) (*Player, bool) {
	for a := range i.AllPlayers {
		if i.AllPlayers[a].UserName == username {
			return &i.AllPlayers[a], true
		}
	}
	return nil, false
}

// SetWinner sets winner of game
func (i *GameInstance) SetWinner(p *Player) {
	i.winnerMutex.Lock()
	i.Winner = p
	i.winnerMutex.Unlock()
}

// GetWinner sets winner of game
func (i *GameInstance) GetWinner() *Player {
	i.winnerMutex.Lock()
	defer i.winnerMutex.Unlock()
	return i.Winner
}

// SetIfAllPlayedOnce sets if everyone played once
func (i *GameInstance) SetIfAllPlayedOnce(uname string) {
	i.allPlayedMutex.Lock()
	if i.AllPlayers[i.PlayersCount-1].UserName == uname {
		i.allPlayedOnce = true
	}
	i.allPlayedMutex.Unlock()
}

// GetIfAllPlayedOnce sets if everyone played once
func (i *GameInstance) GetIfAllPlayedOnce() bool {
	i.allPlayedMutex.Lock()
	defer i.allPlayedMutex.Unlock()
	return i.allPlayedOnce
}

// IncCellCountOfPlayer accepts color and increases cell count
// for the given player who has that color
func (i *GameInstance) IncCellCountOfPlayer(color string, cnt int) {
	for a := range i.AllPlayers {
		if i.AllPlayers[a].Color == color {
			i.AllPlayers[a].CellCount += cnt
			break
		}
	}
}

// DecCellCountOfPlayer accepts color and decreases cell count
// for the given player who has that color and
// sets defeated value to true if count becomes 0
func (i *GameInstance) DecCellCountOfPlayer(color string, cnt int) {
	for a := range i.AllPlayers {
		if i.AllPlayers[a].Color == color {
			i.AllPlayers[a].CellCount -= cnt
			if i.AllPlayers[a].CellCount == 0 {
				i.AllPlayers[a].Defeated = true
				i.DecCurrentActivePlayersCount()
				i.Defeated <- &i.AllPlayers[a]
			}
			break
		}
	}
}

// SetNewCurrentTurn sets new current turn after each move
func (i *GameInstance) SetNewCurrentTurn() {
	c := (i.CurrentTurn + 1) % i.PlayersCount
	for i.AllPlayers[c].Defeated {
		c = (i.CurrentTurn + 1) % i.PlayersCount
	}
	i.CurrentTurn = c
}

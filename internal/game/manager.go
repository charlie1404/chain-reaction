package game

import (
	"errors"
	"math/rand/v2"
	"sync"
	"time"
)

var (
	ErrGameNotFound = errors.New("game not found")
	ErrLobbyFull    = errors.New("lobby is full")
	ErrUnauthorized = errors.New("unauthorized: host only action")
	ErrGameStarted  = errors.New("game already started")
)

const (
	StatusWaiting  = "waiting"
	StatusPlaying  = "playing"
	StatusFinished = "finished"
)

// COLORS represents the canonical color order in 0xRRGGBB format.
// Turn 0 is red, Turn 1 is green, Turn 2 is blue, etc.
var COLORS = []uint32{
	0xff0000, // red
	0x00ff00, // green
	0x0000ff, // blue
	0xffff00, // yellow
	0xff00ff, // magenta
	0x00ffff, // cyan
	0xff7f00, // orange
	0xffffff, // white
}

const MaxPlayers = 8

type LobbySettings struct {
	BoardSize       string `json:"boardSize"`
	TurnWaitSeconds int    `json:"turnWaitSeconds"`
}

type LobbyPlayer struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	Avatar       string    `json:"avatar"`
	Slot         int       `json:"slot"`
	ColorIndex   int       `json:"colorIndex"`
	Color        uint32    `json:"color"`
	IsHost       bool      `json:"isHost"`
	IsConnected  bool      `json:"isConnected"`
	IsEliminated bool      `json:"isEliminated"`
	LastSeen     time.Time `json:"lastSeen,omitempty"`
}

type SessionSnapshot struct {
	ID        string        `json:"id"`
	OwnerID   string        `json:"ownerId"`
	Status    string        `json:"status"` // "waiting", "playing", "finished"
	Settings  LobbySettings `json:"settings"`
	Players   []LobbyPlayer `json:"players"`
	Winner    *LobbyPlayer  `json:"winner,omitempty"`
	CreatedAt time.Time     `json:"createdAt"`
	EndedAt   *time.Time    `json:"endedAt,omitempty"`
}

type GameSession struct {
	mu        sync.Mutex
	ID        string
	OwnerID   string
	Status    string // "waiting", "playing", "finished"
	Settings  LobbySettings
	Players   []*LobbyPlayer
	Winner    *LobbyPlayer
	CreatedAt time.Time
	EndedAt   *time.Time
}

func (s *GameSession) toSnapshotLocked() *SessionSnapshot {
	players := make([]LobbyPlayer, len(s.Players))
	for i, p := range s.Players {
		players[i] = *p
	}
	var winnerCopy *LobbyPlayer
	if s.Winner != nil {
		w := *s.Winner
		winnerCopy = &w
	}
	return &SessionSnapshot{
		ID:        s.ID,
		OwnerID:   s.OwnerID,
		Status:    s.Status,
		Settings:  s.Settings,
		Players:   players,
		Winner:    winnerCopy,
		CreatedAt: s.CreatedAt,
		EndedAt:   s.EndedAt,
	}
}

type GameManager struct {
	mu       sync.RWMutex
	sessions map[string]*GameSession
	stopCh   chan struct{}
}

func NewGameManager() *GameManager {
	return &GameManager{
		sessions: make(map[string]*GameSession),
	}
}

func (gm *GameManager) CreateGame(gameID, ownerID, ownerName, ownerAvatar string, settings LobbySettings) (*SessionSnapshot, *LobbyPlayer) {
	if settings.BoardSize != "s" && settings.BoardSize != "l" {
		settings.BoardSize = "s"
	}
	validTimer := false
	for _, t := range []int{0, 60, 120, 180, 240, 300} {
		if settings.TurnWaitSeconds == t {
			validTimer = true
			break
		}
	}
	if !validTimer {
		settings.TurnWaitSeconds = 60
	}

	hostPlayer := &LobbyPlayer{
		ID:           ownerID,
		Name:         ownerName,
		Avatar:       ownerAvatar,
		Slot:         -1,
		ColorIndex:   -1,
		IsHost:       true,
		IsConnected:  true,
		IsEliminated: false,
		LastSeen:     time.Now(),
	}

	session := &GameSession{
		ID:        gameID,
		OwnerID:   ownerID,
		Status:    StatusWaiting,
		Settings:  settings,
		Players:   []*LobbyPlayer{hostPlayer},
		Winner:    nil,
		CreatedAt: time.Now(),
	}

	gm.mu.Lock()
	gm.sessions[gameID] = session
	gm.mu.Unlock()

	session.mu.Lock()
	defer session.mu.Unlock()
	return session.toSnapshotLocked(), hostPlayer
}

func (gm *GameManager) GetOrJoinLobby(gameID, userID, userName, userAvatar string) (*SessionSnapshot, *LobbyPlayer, error) {
	gm.mu.RLock()
	session, exists := gm.sessions[gameID]
	gm.mu.RUnlock()

	if !exists {
		return nil, nil, ErrGameNotFound
	}

	session.mu.Lock()
	defer session.mu.Unlock()

	// 1. Check if user is already in session
	for _, p := range session.Players {
		if p.ID == userID {
			p.IsConnected = true
			p.LastSeen = time.Now()
			if userName != "" {
				p.Name = userName
			}
			if userAvatar != "" {
				p.Avatar = userAvatar
			}
			playerCopy := *p
			return session.toSnapshotLocked(), &playerCopy, nil
		}
	}

	// 2. Reject joining an in-progress game if player wasn't part of it
	if session.Status == StatusPlaying {
		return nil, nil, ErrGameStarted
	}

	// 3. New player joining: check capacity (hard limit of 8 players)
	if len(session.Players) >= MaxPlayers {
		return nil, nil, ErrLobbyFull
	}

	newPlayer := &LobbyPlayer{
		ID:           userID,
		Name:         userName,
		Avatar:       userAvatar,
		Slot:         -1,
		ColorIndex:   -1,
		IsHost:       (userID == session.OwnerID),
		IsConnected:  true,
		IsEliminated: false,
		LastSeen:     time.Now(),
	}

	session.Players = append(session.Players, newPlayer)

	playerCopy := *newPlayer
	return session.toSnapshotLocked(), &playerCopy, nil
}

func (gm *GameManager) UpdateSettings(gameID, userID string, newSettings LobbySettings) (*SessionSnapshot, error) {
	gm.mu.RLock()
	session, exists := gm.sessions[gameID]
	gm.mu.RUnlock()

	if !exists {
		return nil, ErrGameNotFound
	}

	session.mu.Lock()
	defer session.mu.Unlock()

	if session.OwnerID != userID {
		return nil, ErrUnauthorized
	}

	if session.Status != StatusWaiting {
		return nil, ErrGameStarted
	}

	if newSettings.BoardSize == "s" || newSettings.BoardSize == "l" {
		session.Settings.BoardSize = newSettings.BoardSize
	}

	for _, t := range []int{0, 60, 120, 180, 240, 300} {
		if newSettings.TurnWaitSeconds == t {
			session.Settings.TurnWaitSeconds = t
			break
		}
	}

	return session.toSnapshotLocked(), nil
}

func (gm *GameManager) StartGame(gameID, userID string) (*SessionSnapshot, error) {
	gm.mu.RLock()
	session, exists := gm.sessions[gameID]
	gm.mu.RUnlock()

	if !exists {
		return nil, ErrGameNotFound
	}

	session.mu.Lock()
	defer session.mu.Unlock()

	if session.OwnerID != userID {
		return nil, ErrUnauthorized
	}

	if len(session.Players) < 2 {
		return nil, errors.New("at least 2 players required to start")
	}

	// Only player turn order is randomized
	rand.Shuffle(len(session.Players), func(i, j int) {
		session.Players[i], session.Players[j] = session.Players[j], session.Players[i]
	})

	// Color order is preserved according to COLORS:
	// Turn 0 = Red, Turn 1 = Green, Turn 2 = Blue, Turn 3 = Yellow, etc.
	for i, p := range session.Players {
		p.Slot = i
		p.ColorIndex = i % len(COLORS)
		p.Color = COLORS[i%len(COLORS)]
	}

	session.Status = StatusPlaying
	session.Winner = nil
	session.EndedAt = nil
	return session.toSnapshotLocked(), nil
}

func (gm *GameManager) FinishGame(gameID, winnerID string) (*SessionSnapshot, error) {
	gm.mu.RLock()
	session, exists := gm.sessions[gameID]
	gm.mu.RUnlock()

	if !exists {
		return nil, ErrGameNotFound
	}

	session.mu.Lock()
	defer session.mu.Unlock()

	session.Status = StatusFinished
	now := time.Now()
	session.EndedAt = &now

	for _, p := range session.Players {
		if p.ID == winnerID {
			winnerCopy := *p
			session.Winner = &winnerCopy
			break
		}
	}
	if session.Winner == nil && len(session.Players) > 0 {
		fallbackWinner := *session.Players[0]
		session.Winner = &fallbackWinner
	}

	return session.toSnapshotLocked(), nil
}

func (gm *GameManager) ResetGame(gameID, userID string) (*SessionSnapshot, error) {
	gm.mu.RLock()
	session, exists := gm.sessions[gameID]
	gm.mu.RUnlock()

	if !exists {
		return nil, ErrGameNotFound
	}

	session.mu.Lock()
	defer session.mu.Unlock()

	if session.OwnerID != userID {
		return nil, ErrUnauthorized
	}

	session.Status = StatusWaiting
	session.Winner = nil
	session.EndedAt = nil

	for _, p := range session.Players {
		p.IsEliminated = false
		p.Slot = -1
		p.ColorIndex = -1
		p.Color = 0
	}

	return session.toSnapshotLocked(), nil
}

func (gm *GameManager) RemovePlayer(gameID, hostID, targetUserID string) (*SessionSnapshot, error) {
	gm.mu.RLock()
	session, exists := gm.sessions[gameID]
	gm.mu.RUnlock()

	if !exists {
		return nil, ErrGameNotFound
	}

	session.mu.Lock()
	defer session.mu.Unlock()

	if session.OwnerID != hostID {
		return nil, ErrUnauthorized
	}

	if targetUserID == session.OwnerID {
		return nil, errors.New("cannot remove host")
	}

	filtered := make([]*LobbyPlayer, 0, len(session.Players))
	for _, p := range session.Players {
		if p.ID != targetUserID {
			filtered = append(filtered, p)
		}
	}
	session.Players = filtered

	return session.toSnapshotLocked(), nil
}

func (gm *GameManager) SetPlayerConnection(gameID, userID string, isConnected bool) {
	gm.mu.RLock()
	session, exists := gm.sessions[gameID]
	gm.mu.RUnlock()

	if !exists {
		return
	}

	session.mu.Lock()
	defer session.mu.Unlock()

	for _, p := range session.Players {
		if p.ID == userID {
			p.IsConnected = isConnected
			break
		}
	}
}

func (gm *GameManager) Heartbeat(gameID, userID string) error {
	gm.mu.RLock()
	session, exists := gm.sessions[gameID]
	gm.mu.RUnlock()

	if !exists {
		return ErrGameNotFound
	}

	session.mu.Lock()
	defer session.mu.Unlock()

	for _, p := range session.Players {
		if p.ID == userID {
			p.LastSeen = time.Now()
			p.IsConnected = true
			return nil
		}
	}

	return errors.New("player not in game")
}

func (gm *GameManager) CheckHeartbeats(timeout time.Duration) {
	gm.mu.RLock()
	sessions := make([]*GameSession, 0, len(gm.sessions))
	for _, s := range gm.sessions {
		sessions = append(sessions, s)
	}
	gm.mu.RUnlock()

	now := time.Now()
	var wg sync.WaitGroup

	for _, session := range sessions {
		wg.Add(1)
		go func(s *GameSession) {
			defer wg.Done()
			s.mu.Lock()
			defer s.mu.Unlock()

			for _, p := range s.Players {
				if p.IsConnected && now.Sub(p.LastSeen) > timeout {
					p.IsConnected = false
				}
			}
		}(session)
	}

	wg.Wait()
}

func (gm *GameManager) StartHeartbeatChecker(interval, timeout time.Duration) {
	gm.mu.Lock()
	if gm.stopCh != nil {
		gm.mu.Unlock()
		return
	}
	gm.stopCh = make(chan struct{})
	stopCh := gm.stopCh
	gm.mu.Unlock()

	go func() {
		ticker := time.NewTicker(interval)
		defer ticker.Stop()
		for {
			select {
			case <-stopCh:
				return
			case <-ticker.C:
				gm.CheckHeartbeats(timeout)
			}
		}
	}()
}

func (gm *GameManager) StopHeartbeatChecker() {
	gm.mu.Lock()
	defer gm.mu.Unlock()
	if gm.stopCh != nil {
		close(gm.stopCh)
		gm.stopCh = nil
	}
}


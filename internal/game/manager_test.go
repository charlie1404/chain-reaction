package game

import (
	"fmt"
	"sync"
	"testing"
	"time"
)

func TestCreateGame(t *testing.T) {
	gm := NewGameManager()
	settings := LobbySettings{
		BoardSize:       "s",
		TurnWaitSeconds: 60,
	}

	snap, hostPlayer := gm.CreateGame("room123", "user1", "Alice", "cyber-bot", settings)
	if snap.ID != "room123" {
		t.Fatalf("expected room ID room123, got %s", snap.ID)
	}
	if snap.OwnerID != "user1" {
		t.Fatalf("expected owner user1, got %s", snap.OwnerID)
	}
	if hostPlayer.Slot != -1 {
		t.Fatalf("expected host slot -1 in lobby, got %d", hostPlayer.Slot)
	}
	if hostPlayer.ColorIndex != -1 {
		t.Fatalf("expected host color -1 in lobby, got %d", hostPlayer.ColorIndex)
	}
	if !hostPlayer.IsHost {
		t.Fatalf("expected host to be marked isHost")
	}
	if len(snap.Players) != 1 {
		t.Fatalf("expected 1 player in snapshot, got %d", len(snap.Players))
	}
}

func TestConcurrentJoinLobby(t *testing.T) {
	gm := NewGameManager()
	settings := LobbySettings{
		BoardSize:       "s",
		TurnWaitSeconds: 60,
	}

	gm.CreateGame("room_concurrent", "host1", "HostAlice", "cyber-bot", settings)

	// Concurrently join 7 other users (total 8 players = max capacity)
	numJoiners := 7
	var wg sync.WaitGroup
	wg.Add(numJoiners)

	type joinResult struct {
		user   string
		player *LobbyPlayer
		err    error
	}

	results := make([]joinResult, numJoiners)

	for i := 0; i < numJoiners; i++ {
		idx := i
		go func() {
			defer wg.Done()
			userID := fmt.Sprintf("joiner_%d", idx)
			userName := fmt.Sprintf("Player_%d", idx)
			_, p, err := gm.GetOrJoinLobby("room_concurrent", userID, userName, "sample-avatar")
			results[idx] = joinResult{
				user:   userID,
				player: p,
				err:    err,
			}
		}()
	}

	wg.Wait()

	// Verify all joined successfully without errors
	for i, r := range results {
		if r.err != nil {
			t.Fatalf("joiner %d failed to join: %v", i, r.err)
		}
		if r.player == nil {
			t.Fatalf("joiner %d got nil player", i)
		}
	}

	// Verify players in lobby have unassigned slot and color (-1)
	snap, _, err := gm.GetOrJoinLobby("room_concurrent", "host1", "HostAlice", "cyber-bot")
	if err != nil {
		t.Fatalf("host failed to re-query lobby: %v", err)
	}

	if len(snap.Players) != 8 {
		t.Fatalf("expected exactly 8 players in lobby, got %d", len(snap.Players))
	}

	for _, p := range snap.Players {
		if p.Slot != -1 {
			t.Fatalf("expected unassigned slot (-1) in lobby, got %d for user %s", p.Slot, p.ID)
		}
		if p.ColorIndex != -1 {
			t.Fatalf("expected unassigned color (-1) in lobby, got %d for user %s", p.ColorIndex, p.ID)
		}
	}

	// Try 9th user: should be rejected with ErrLobbyFull
	_, _, err = gm.GetOrJoinLobby("room_concurrent", "extra_user", "Extra", "avatar")
	if err != ErrLobbyFull {
		t.Fatalf("expected ErrLobbyFull, got %v", err)
	}

	// Start game: turn order is randomized, but color order is preserved according to COLORS
	startedSnap, err := gm.StartGame("room_concurrent", "host1")
	if err != nil {
		t.Fatalf("failed to start game: %v", err)
	}
	if startedSnap.Status != StatusPlaying {
		t.Fatalf("expected status playing, got %s", startedSnap.Status)
	}

	if len(startedSnap.Players) != 8 {
		t.Fatalf("expected 8 players, got %d", len(startedSnap.Players))
	}

	for i, p := range startedSnap.Players {
		if p.Slot != i {
			t.Fatalf("expected slot %d at index %d, got %d", i, i, p.Slot)
		}
		if p.ColorIndex != i {
			t.Fatalf("expected preserved colorIndex %d at index %d, got %d", i, i, p.ColorIndex)
		}
		if p.Color != COLORS[i] {
			t.Fatalf("expected preserved color 0x%x at index %d, got 0x%x", COLORS[i], i, p.Color)
		}
	}
}

func TestRejoinSameUser(t *testing.T) {
	gm := NewGameManager()
	settings := LobbySettings{
		BoardSize:       "s",
		TurnWaitSeconds: 60,
	}

	gm.CreateGame("room_rejoin", "host", "Host", "avatar1", settings)

	// User 2 joins
	_, p1, err := gm.GetOrJoinLobby("room_rejoin", "user2", "Bob", "avatar2")
	if err != nil {
		t.Fatalf("user2 join failed: %v", err)
	}

	// User 2 rejoins / refreshes
	snap, p2, err := gm.GetOrJoinLobby("room_rejoin", "user2", "BobUpdated", "avatar2_updated")
	if err != nil {
		t.Fatalf("user2 rejoin failed: %v", err)
	}

	if p1.Slot != p2.Slot {
		t.Fatalf("slot changed on rejoin: originally %d, now %d", p1.Slot, p2.Slot)
	}
	if p1.ColorIndex != p2.ColorIndex {
		t.Fatalf("color changed on rejoin: originally %d, now %d", p1.ColorIndex, p2.ColorIndex)
	}
	if p2.Name != "BobUpdated" {
		t.Fatalf("name not updated on rejoin: got %s", p2.Name)
	}
	if len(snap.Players) != 2 {
		t.Fatalf("expected 2 players total, got %d", len(snap.Players))
	}
}

func TestInvalidRoom(t *testing.T) {
	gm := NewGameManager()
	_, _, err := gm.GetOrJoinLobby("non_existent", "user1", "Alice", "avatar")
	if err != ErrGameNotFound {
		t.Fatalf("expected ErrGameNotFound, got %v", err)
	}
}

func TestGameStatesAndWinner(t *testing.T) {
	gm := NewGameManager()
	settings := LobbySettings{
		BoardSize:       "s",
		TurnWaitSeconds: 60,
	}

	snap, _ := gm.CreateGame("room_states", "host", "Host", "avatar1", settings)
	if snap.Status != StatusWaiting {
		t.Fatalf("expected status waiting, got %s", snap.Status)
	}

	// Player 2 joins
	_, _, err := gm.GetOrJoinLobby("room_states", "p2", "Player 2", "avatar2")
	if err != nil {
		t.Fatalf("player 2 join failed: %v", err)
	}

	// Host starts game
	snap, err = gm.StartGame("room_states", "host")
	if err != nil {
		t.Fatalf("failed to start game: %v", err)
	}
	if snap.Status != StatusPlaying {
		t.Fatalf("expected status playing, got %s", snap.Status)
	}

	// An outsider tries to join during playing state
	_, _, err = gm.GetOrJoinLobby("room_states", "outsider", "Outsider", "avatar3")
	if err != ErrGameStarted {
		t.Fatalf("expected ErrGameStarted for new player joining during match, got %v", err)
	}

	// Existing player can still fetch lobby snapshot
	snap, _, err = gm.GetOrJoinLobby("room_states", "p2", "Player 2", "avatar2")
	if err != nil {
		t.Fatalf("existing player failed to fetch lobby: %v", err)
	}
	if snap.Status != StatusPlaying {
		t.Fatalf("expected playing status, got %s", snap.Status)
	}

	// Game finishes with Player 2 winning
	snap, err = gm.FinishGame("room_states", "p2")
	if err != nil {
		t.Fatalf("failed to finish game: %v", err)
	}
	if snap.Status != StatusFinished {
		t.Fatalf("expected status finished, got %s", snap.Status)
	}
	if snap.Winner == nil || snap.Winner.ID != "p2" {
		t.Fatalf("expected winner to be p2, got %v", snap.Winner)
	}

	// Host resets the game
	snap, err = gm.ResetGame("room_states", "host")
	if err != nil {
		t.Fatalf("failed to reset game: %v", err)
	}
	if snap.Status != StatusWaiting {
		t.Fatalf("expected status waiting after reset, got %s", snap.Status)
	}
	if snap.Winner != nil {
		t.Fatalf("expected nil winner after reset, got %v", snap.Winner)
	}
	for _, p := range snap.Players {
		if p.Slot != -1 || p.ColorIndex != -1 || p.Color != 0 {
			t.Fatalf("expected reset player %s to have slot -1, colorIndex -1, color 0, got slot=%d colorIndex=%d color=0x%x", p.ID, p.Slot, p.ColorIndex, p.Color)
		}
	}
}

func TestHeartbeatAndTimeout(t *testing.T) {
	gm := NewGameManager()
	settings := LobbySettings{
		BoardSize:       "s",
		TurnWaitSeconds: 60,
	}

	gm.CreateGame("room_hb", "p1", "Player 1", "avatar1", settings)
	_, _, err := gm.GetOrJoinLobby("room_hb", "p2", "Player 2", "avatar2")
	if err != nil {
		t.Fatalf("failed to join p2: %v", err)
	}

	// P1 and P2 should initially be connected
	session := gm.sessions["room_hb"]
	session.mu.Lock()
	if !session.Players[0].IsConnected || !session.Players[1].IsConnected {
		t.Fatalf("expected both players to be connected initially")
	}

	// Simulate p2 going silent 10 seconds ago
	session.Players[1].LastSeen = time.Now().Add(-10 * time.Second)
	session.mu.Unlock()

	// Check heartbeats with 5 second timeout
	gm.CheckHeartbeats(5 * time.Second)

	session.mu.Lock()
	if !session.Players[0].IsConnected {
		t.Fatalf("expected p1 to remain connected")
	}
	if session.Players[1].IsConnected {
		t.Fatalf("expected p2 to be marked disconnected after timeout")
	}
	session.mu.Unlock()

	// P2 sends heartbeat now
	err = gm.Heartbeat("room_hb", "p2")
	if err != nil {
		t.Fatalf("heartbeat failed: %v", err)
	}

	session.mu.Lock()
	if !session.Players[1].IsConnected {
		t.Fatalf("expected p2 to be reconnected after heartbeat")
	}
	session.mu.Unlock()

	// Test Start/Stop HeartbeatChecker
	gm.StartHeartbeatChecker(10*time.Millisecond, 50*time.Millisecond)
	// Idempotent start
	gm.StartHeartbeatChecker(10*time.Millisecond, 50*time.Millisecond)
	gm.StopHeartbeatChecker()
}

func TestColorOrderPreservedWithRandomizedTurns(t *testing.T) {
	gm := NewGameManager()
	settings := LobbySettings{
		BoardSize:       "s",
		TurnWaitSeconds: 60,
	}

	gm.CreateGame("room_color_order", "player_1", "Player 1", "avatar1", settings)
	for i := 2; i <= 8; i++ {
		_, _, err := gm.GetOrJoinLobby("room_color_order", fmt.Sprintf("player_%d", i), fmt.Sprintf("Player %d", i), "avatar")
		if err != nil {
			t.Fatalf("failed to join player %d: %v", i, err)
		}
	}

	snap, err := gm.StartGame("room_color_order", "player_1")
	if err != nil {
		t.Fatalf("failed to start game: %v", err)
	}

	expectedColors := []uint32{
		0xff0000, // red (slot 0)
		0x00ff00, // green (slot 1)
		0x0000ff, // blue (slot 2)
		0xffff00, // yellow (slot 3)
		0xff00ff, // magenta (slot 4)
		0x00ffff, // cyan (slot 5)
		0xff7f00, // orange (slot 6)
		0xffffff, // white (slot 7)
	}

	for i, p := range snap.Players {
		if p.Slot != i {
			t.Fatalf("expected slot %d at index %d, got %d", i, i, p.Slot)
		}
		if p.ColorIndex != i {
			t.Fatalf("expected color index %d at slot %d, got %d", i, i, p.ColorIndex)
		}
		if p.Color != expectedColors[i] {
			t.Fatalf("expected color 0x%x at slot %d, got 0x%x", expectedColors[i], i, p.Color)
		}
	}
}



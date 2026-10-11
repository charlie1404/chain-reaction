package game

type GameStatus uint8

const (
	GameStatusCreated GameStatus = 0
	GameStatusStarted GameStatus = 1
	GameStatusEnded   GameStatus = 2
)

type GameFile struct {
	MagicNum           uint64
	Owner              uint64
	GameStatus         GameStatus
	CurrentPlayer      uint8
	PlayersCount       uint8
	ActivePlayersCount uint8
	PlayerIds          []uint64
	ActivePlayers      []uint64
	Grid               [][]uint16
}

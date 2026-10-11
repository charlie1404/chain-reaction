package game

import (
	"encoding/binary"
	"fmt"
	"log/slog"
	"os"
	"path"
	"syscall"
	"unsafe"

	"github.com/charlie1404/chain-reaction/internal/config"
	"github.com/charlie1404/chain-reaction/internal/constants"
)

const GAME_FILE_SIZE uint32 = 1 << 14 // 16KB

func CreateGameFile(gameID, ownerID []byte) error {
	gameIDStr := unsafe.String(unsafe.SliceData(gameID), len(gameID))
	gameFilePath := path.Join(config.AppConfig.App.GamesPath, gameIDStr+".game")

	if _, err := os.Stat(gameFilePath); err == nil {
		return fmt.Errorf("game file already exists")
	}

	gameFileHandler, err := os.OpenFile(gameFilePath, os.O_RDWR|os.O_CREATE, 0600)
	if err != nil {
		return err
	}
	defer gameFileHandler.Close()

	if err := syscall.Truncate(gameFilePath, int64(GAME_FILE_SIZE)); err != nil {
		os.Remove(gameFilePath)
		return err
	}

	memAddr, _, err := syscall.Syscall6(
		syscall.SYS_MMAP,
		0,                                    // let kernel choose the address
		uintptr(GAME_FILE_SIZE),              // size of the memory region
		syscall.PROT_READ|syscall.PROT_WRITE, // read and write access
		syscall.MAP_SHARED,                   //
		gameFileHandler.Fd(),                 // this is backed by game file
		0,                                    // offset
	)
	if err != syscall.Errno(0) {
		slog.Error("MMAP_FAILED", "error", err)
		return err
	}

	gameFileMmap := (*GameFile)(unsafe.Pointer(memAddr)) // unsafe.Pointer to GameFile

	gameFileMmap.MagicNum = constants.MAGIC_NUMBER
	gameFileMmap.Owner = binary.BigEndian.Uint64(ownerID)
	gameFileMmap.GameStatus = GameStatusCreated

	_, _, err = syscall.Syscall(syscall.SYS_MUNMAP, memAddr, uintptr(GAME_FILE_SIZE), 0)
	if err != syscall.Errno(0) {
		slog.Error("MUNMAP_FAILED", "error", err)
		return err
	}

	return nil
}

package app

import (
	"errors"
	"log/slog"
	"os"
	"os/signal"
	"sync"
	"syscall"

	"github.com/charlie1404/chain-reaction/internal/api"
	"github.com/charlie1404/chain-reaction/internal/config"
	"github.com/charlie1404/chain-reaction/internal/o11y/metrics"
)

func clearScreen() {
	// https://gist.github.com/fnky/458719343aabd01cfb17a3a4f7296797
	// fmt.Println("\x1B[H\x1B[2J\x1B[3J")
}

func initLogger() {
	handlerOpts := &slog.HandlerOptions{Level: slog.LevelDebug}
	logger := slog.New(slog.NewTextHandler(os.Stdout, handlerOpts))

	slog.SetDefault(logger)
}

func ensureDataFolderExist() error {
	slog.Debug("CHECKING_DATA_DIR")

	var dirName string = ".data"
	var folderMode os.FileMode = 0700 | os.ModeDir

	info, err := os.Stat(dirName)

	if os.IsNotExist(err) {
		slog.Debug("DATA_DIR_NOT_EXIST")
		if err := os.Mkdir(dirName, folderMode); err != nil {
			slog.Error("DATA_DIR_CREATE_FAILED", "error", err)
			return err
		}
		slog.Debug("DATA_DIR_CREATED")
		return nil
	}

	if !info.IsDir() {
		return errors.New("DATA_DIR_PATH_IS_NOT_A_DIR")
	}

	if info.Mode() != folderMode {
		if err := os.Chmod(dirName, folderMode); err != nil {
			slog.Error("DATA_DIR_SET_PERMISSIONS_FAILED", "error", err)
			return errors.New("DATA_DIR_SET_PERMISSIONS_FAILED")
		}

		slog.Debug("DATA_DIR_PERMISSIONS_UPDATED")
	} else {
		slog.Debug("DATA_DIR_EXISTS")
	}

	return nil
}

func New() {
	clearScreen()
	config.InitConfig()
	initLogger()

	err := ensureDataFolderExist()
	if err != nil {
		slog.Error("DATA_DIR_CREATE_FAILED", "error", err)
		os.Exit(1)
	}

	var apiApp *api.ApiApp
	var metricsApp *metrics.MetricsServer

	DB := initDB()

	// Metrics Server
	go func() {
		metricsApp = metrics.New()
		metricsApp.StartServer()
	}()

	// App Server
	go func() {
		apiApp = api.New(DB)
		apiApp.StartServer()
	}()

	stopCh := make(chan os.Signal, 1)
	signal.Notify(stopCh, os.Interrupt, syscall.SIGTERM, syscall.SIGINT)

	<-stopCh

	slog.Warn("INTERRUPT_SIGNAL_RECEIVED")

	var wg sync.WaitGroup
	var err1, err2 error

	wg.Add(2)

	go func() {
		defer wg.Done()
		err1 = apiApp.Shutdown()
	}()

	go func() {
		defer wg.Done()
		err2 = metricsApp.Shutdown()
	}()

	wg.Wait()
	DB.Close()

	if err1 != nil || err2 != nil {
		slog.Error("SHUTDOWN_FAILED", "error1", err1, "error2", err2)
		os.Exit(1)
	}
}

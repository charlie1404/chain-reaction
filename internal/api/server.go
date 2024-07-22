package api

import (
	"context"
	"log/slog"
	"net/http"
	"sync"
	"time"

	"github.com/charlie1404/chain-reaction/internal/config"
	"go.etcd.io/bbolt"
	"golang.org/x/sys/unix"
)

type ApiApp struct {
	mu               sync.RWMutex
	epollFd          int
	epollConnections map[int]*Connection
	httpServer       *http.Server
	db               *bbolt.DB
}

func (s *ApiApp) InitHttpServer() {
	s.httpServer = &http.Server{
		Addr:              config.AppConfig.App.Host,
		Handler:           s.setupRoutes(),
		ReadHeaderTimeout: 1 * time.Second,
		ReadTimeout:       2 * time.Second,
		WriteTimeout:      1 * time.Second,
		IdleTimeout:       30 * time.Second,
	}
}

func (s *ApiApp) InitEpollFd() error {
	fd, err := unix.EpollCreate1(0)
	if err != nil {
		slog.Error("EPOLL_CREATE_FAILED", "error", err)
		return err
	}

	s.epollFd = fd
	s.epollConnections = make(map[int]*Connection)

	return nil
}

func (s *ApiApp) StartServer() {
	slog.Debug("API_SERVER_STARTING")

	go s.StartSocketPolling()

	err := s.httpServer.ListenAndServe()
	if err == http.ErrServerClosed {
		slog.Debug("API_HTTP_SERVER_STOPPED")
		return
	}

	if err != nil {
		slog.Error("API_HTTP_SERVER_STOPPED_UNEXPECTED", "error", err)
	}
}

func (s *ApiApp) Shutdown() error {
	slog.Debug("SHUTTING_DOWN_API_SERVER")

	s.httpServer.SetKeepAlivesEnabled(false)

	time.Sleep(1 * time.Second) // wait for connections to close

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	err := s.httpServer.Shutdown(ctx)

	if err != nil {
		slog.Error("API_HTTP_SERVER_SHUTDOWN_FAILED", "error", err)
	} else {
		slog.Debug("API_SHUTDOWN_COMPLETE")
	}

	s.CloseEpoll()

	return err
}

func New(db *bbolt.DB) *ApiApp {
	s := &ApiApp{db: db}

	err := s.InitEpollFd()
	if err != nil {
		panic(err)
	}
	s.InitHttpServer()

	return s
}

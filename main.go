package main

import (
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"net/http/pprof"
	"os"
	"reflect"
	"sync"
	"syscall"

	"github.com/gobwas/ws"
	"github.com/gobwas/ws/wsutil"
	"golang.org/x/sys/unix"
)

var epoller *epoll

type epoll struct {
	fd          int
	connections sync.Map
}

func MkEpoll() (*epoll, error) {
	fd, err := unix.EpollCreate1(0)
	if err != nil {
		return nil, err
	}
	return &epoll{fd: fd}, nil
}

func (e *epoll) Add(conn net.Conn) error {
	// Extract file descriptor associated with the connection
	fd := websocketFD(conn)
	err := unix.EpollCtl(e.fd, syscall.EPOLL_CTL_ADD, fd, &unix.EpollEvent{Events: unix.POLLIN | unix.POLLHUP, Fd: int32(fd)})
	if err != nil {
		return err
	}

	e.connections.Store(fd, conn)

	return nil
}

func (e *epoll) Remove(conn net.Conn) error {
	fd := websocketFD(conn)
	err := unix.EpollCtl(e.fd, syscall.EPOLL_CTL_DEL, fd, nil)
	if err != nil {
		return err
	}
	e.connections.Delete(fd)

	return nil
}

func (e *epoll) Wait() ([]net.Conn, error) {
	events := make([]unix.EpollEvent, 100)
	n, err := unix.EpollWait(e.fd, events, 100)
	if err != nil {
		return nil, err
	}

	var connections []net.Conn

	for i := 0; i < n; i++ {
		conn, _ := e.connections.Load(events[i].Fd)
		connections = append(connections, conn.(net.Conn))
	}

	return connections, nil
}

func websocketFD(conn net.Conn) int {
	tcpConn := reflect.Indirect(reflect.ValueOf(conn)).FieldByName("conn")
	fdVal := tcpConn.FieldByName("fd")
	pfdVal := reflect.Indirect(fdVal).FieldByName("pfd")

	return int(pfdVal.FieldByName("Sysfd").Int())
}

func wsHandler(w http.ResponseWriter, r *http.Request) {
	// Upgrade connection
	conn, _, _, err := ws.UpgradeHTTP(r, w)
	if err != nil {
		return
	}

	if err := epoller.Add(conn); err != nil {
		slog.Error("CONNECTION_ADD_FAILED", "error", err)
		conn.Close()
	}
}

func Start() {
	for {
		connections, err := epoller.Wait()
		if err != nil {
			slog.Error("EPOLL_WAIT_ERROR", "error", err)
			continue
		}
		for _, conn := range connections {
			if conn == nil {
				break
			}
			if msg, _, err := wsutil.ReadClientData(conn); err != nil {
				if err := epoller.Remove(conn); err != nil {
					slog.Error("EPOLL_REMOVE_CONN_FAILED", "error", err)
				}
				conn.Close()
			} else {
				slog.Debug("WEBSOCKET_RECEIVED_MESSAGE", "msg", string(msg))
			}
		}
	}
}

func enablePprof() {
	mux := http.NewServeMux()

	mux.HandleFunc("/debug/pprof/", pprof.Index)
	mux.HandleFunc("/debug/pprof/cmdline", pprof.Cmdline)
	mux.HandleFunc("/debug/pprof/profile", pprof.Profile)
	mux.HandleFunc("/debug/pprof/symbol", pprof.Symbol)
	mux.HandleFunc("/debug/pprof/trace", pprof.Trace)

	if err := http.ListenAndServe("0.0.0.0:6060", mux); err != nil {
		slog.Error("PPROF_SERVER_START_FAILED", "error", err)
		os.Exit(1)
	}
}
func foobar() *string {
	foobar := "foobar"
	return &foobar
}

func main() {

	r := foobar()
	fmt.Println(*r)

	// Enable pprof hooks
	go enablePprof()

	// Create epoll
	var err error

	epoller, err = MkEpoll()
	if err != nil {
		slog.Error("EPOLL_CREATE_FAILED", "error", err)
		os.Exit(1)
	}

	// Start epoll listener loop in a separate goroutine
	go Start()

	http.HandleFunc("/websocket", wsHandler)

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Welcome to Game Server!"))
	})

	if err := http.ListenAndServe("0.0.0.0:8000", nil); err != nil {
		slog.Error("HTTP_SERVER_START_FAILED", "error", err)
		os.Exit(1)
	}
}

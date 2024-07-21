package api

import (
	"net"
	"sync"

	// "github.com/gobwas/ws"
	// "github.com/gobwas/ws/wsutil"
	"golang.org/x/sys/unix"
)

type Connection struct {
	conn   net.Conn
	userId uint64
	color  byte
}

type GameHandler struct {
	epollFd          int
	epollConnections sync.Map
}

// func websocketFD(conn net.Conn) int {
// 	tcpConn := reflect.Indirect(reflect.ValueOf(conn)).FieldByName("conn")
// 	fdVal := tcpConn.FieldByName("fd")
// 	pfdVal := reflect.Indirect(fdVal).FieldByName("pfd")

// 	return int(pfdVal.FieldByName("Sysfd").Int())
// }

// func wsHandler(w http.ResponseWriter, r *http.Request) {
// 	// Upgrade connection
// 	conn, _, _, err := ws.UpgradeHTTP(r, w)
// 	if err != nil {
// 		return
// 	}

// 	if err := epoller.Add(conn); err != nil {
// 		slog.Error("CONNECTION_ADD_FAILED", "error", err)
// 		conn.Close()
// 	}
// }

// func Start() {
// 	for {
// 		connections, err := epoller.Wait()
// 		if err != nil {
// 			slog.Error("EPOLL_WAIT_ERROR", "error", err)
// 			continue
// 		}
// 		for _, conn := range connections {
// 			if conn == nil {
// 				break
// 			}
// 			if msg, _, err := wsutil.ReadClientData(conn); err != nil {
// 				if err := epoller.Remove(conn); err != nil {
// 					slog.Error("EPOLL_REMOVE_CONN_FAILED", "error", err)
// 				}
// 				conn.Close()
// 			} else {
// 				slog.Debug("WEBSOCKET_RECEIVED_MESSAGE", "msg", string(msg))
// 			}
// 		}
// 	}
// }

// var err error
// epoller, err = MkEpoll() // Create epoll

// if err != nil {
// 	slog.Error("EPOLL_CREATE_FAILED", "error", err)
// 	os.Exit(1)
// }

// // Start epoll listener loop in a separate goroutine
// go Start()

// http.HandleFunc("/websocket", wsHandler)

// http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
// 	w.Write([]byte("Welcome to Game Server!"))
// })

// if err := http.ListenAndServe("0.0.0.0:8000", nil); err != nil {
// 	slog.Error("HTTP_SERVER_START_FAILED", "error", err)
// 	os.Exit(1)
// }

func NewGameHandler() (*GameHandler, error) {
	fd, err := unix.EpollCreate1(0)

	if err != nil {
		return nil, err
	}

	return &GameHandler{epollFd: fd}, nil
}

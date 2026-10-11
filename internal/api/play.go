package api

import (
	"log/slog"
	"net"
	"net/http"
	"reflect"
	"syscall"

	"github.com/gobwas/ws"
	"github.com/gobwas/ws/wsutil"
	"golang.org/x/sys/unix"
)

type Connection struct {
	conn   net.Conn
	roomId uint64
	userId uint64
}

func (s *ApiApp) StartSocketPolling() {
	for {
		connections, err := s.getConnectionsWithActivity()
		if err != nil {
			slog.Error("EPOLL_WAIT_ERROR", "error", err)
			continue
		}

		for _, connection := range connections {
			if connection.conn == nil {
				break
			}

			msg, _, err := wsutil.ReadClientData(connection.conn)
			if err != nil {
				if err := s.removeConnection(websocketFD(connection.conn)); err != nil {
					slog.Error("EPOLL_REMOVE_CONN_FAILED", "error", err)
					continue
				}
				connection.conn.Close()
			}

			slog.Debug("WEBSOCKET_RECEIVED_MESSAGE", "msg", string(msg))

			wsutil.WriteServerMessage(connection.conn, ws.OpBinary, []byte("Hello, client!"))
			// process game logic
		}
	}
}

func websocketFD(conn net.Conn) int {
	tcpConn := reflect.Indirect(reflect.ValueOf(conn)).FieldByName("conn")
	fdVal := tcpConn.FieldByName("fd")
	pfdVal := reflect.Indirect(fdVal).FieldByName("pfd")

	return int(pfdVal.FieldByName("Sysfd").Int())
}

func (s *ApiApp) addConnection(conn net.Conn, roomId, userId uint64) error {
	// Extract file descriptor associated with the connection
	fd := websocketFD(conn)
	err := unix.EpollCtl(s.epollFd, syscall.EPOLL_CTL_ADD, fd, &unix.EpollEvent{Events: unix.POLLIN | unix.POLLHUP, Fd: int32(fd)})
	if err != nil {
		return err
	}

	// Should do pool if we have high traffic, else overhead of sync.Pool is not worth it
	connection := &Connection{conn: conn, roomId: roomId, userId: userId}

	s.mu.Lock()
	defer s.mu.Unlock()

	s.epollConnections[fd] = connection

	return nil
}

func (s *ApiApp) removeConnection(fd int) error {
	if err := unix.EpollCtl(s.epollFd, syscall.EPOLL_CTL_DEL, fd, nil); err != nil {
		return err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	delete(s.epollConnections, fd)

	return nil
}

func (s *ApiApp) getConnectionsWithActivity() ([]*Connection, error) {
	var connections []*Connection

	events := make([]unix.EpollEvent, 100)
	n, err := unix.EpollWait(s.epollFd, events, 100)
	if err == syscall.EINTR {
		slog.Warn("EPOLL_WAIT_INTERRUPTED")
		return connections, nil
	}

	if err != nil {
		return nil, err
	}

	s.mu.RLock()
	defer s.mu.RUnlock()

	for i := 0; i < n; i++ {
		connections = append(connections, s.epollConnections[int(events[i].Fd)])
	}

	return connections, nil
}

func (s *ApiApp) WsHandler(w http.ResponseWriter, r *http.Request) {
	conn, _, _, err := ws.UpgradeHTTP(r, w)
	if err != nil || conn == nil {
		slog.Error("CONNECTION_UPGRADE_FAILED", "error", err)
		return
	}

	if err := s.addConnection(conn, 0, 0); err != nil {
		slog.Error("CONNECTION_ADD_FAILED", "error", err)
		conn.Close()
	}
}

func (s *ApiApp) CloseEpoll() {
	unix.Close(s.epollFd)
}

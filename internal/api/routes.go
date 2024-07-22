package api

import (
	"fmt"
	"log/slog"
	"net/http"
	"runtime/debug"
	"strings"

	"github.com/charlie1404/chain-reaction/internal/middlewares"
)

type Middleware func(next http.Handler) http.Handler

type Router struct {
	routes               map[string]map[string]http.Handler
	middlewares          []Middleware
	staticFilesServer    http.Handler
	staticFilesUrlPrefix string
}

func (r *Router) AddMiddleware(middleware Middleware) {
	// prepend the new middleware to the list of middlewares

	r.middlewares = append(r.middlewares, nil)
	copy(r.middlewares[1:], r.middlewares)
	r.middlewares[0] = middleware
}

func (r *Router) ServerStatic(urlPrefix string, dir string) {
	r.staticFilesServer = http.StripPrefix(urlPrefix, http.FileServer(http.Dir(dir)))
	r.staticFilesUrlPrefix = urlPrefix
}

func (r *Router) Handle(method, path string, handler http.HandlerFunc) {
	if _, ok := r.routes[path][method]; ok {
		panic(fmt.Sprintf("Duplicate path: %s", path))
	}

	if _, ok := r.routes[path]; !ok {
		r.routes[path] = make(map[string]http.Handler)
	}

	r.routes[path][method] = http.HandlerFunc(handler)
}

func (r *Router) ServeHTTP(w http.ResponseWriter, req *http.Request) {
	defer func() {
		if err := recover(); err != nil {
			slog.Error("ROUTER_PANIC_RECOVER", "error", err, "stack", debug.Stack())

			w.WriteHeader(http.StatusInternalServerError)
			w.Header().Set("Content-Type", "application/json; charset=utf-8")

			fmt.Fprint(w, `{"error": "Internal Server Error"}`)
		}
	}()

	upath := req.URL.Path
	method := req.Method

	if r.staticFilesUrlPrefix != "" && strings.HasPrefix(upath, r.staticFilesUrlPrefix) {
		// if the path is a static file, serve it, no need to check the routes
		r.staticFilesServer.ServeHTTP(w, req)
		return
	}

	if _, ok := r.routes[upath]; !ok {
		slog.Warn("ROUTER_ROUTE_NOT_FOUND", "path", upath)

		w.WriteHeader(http.StatusNotFound)
		w.Header().Set("Content-Type", "application/json; charset=utf-8")

		fmt.Fprint(w, `{"error": "Route Not Found"}`)
		return
	}

	if _, ok := r.routes[upath][method]; !ok {
		slog.Warn("ROUTER_METHOD_NOT_ALLOWED", "path", upath, "method", method)

		w.WriteHeader(http.StatusMethodNotAllowed)
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		fmt.Fprint(w, `{"error": "Method Not Allowed"}`)
		return
	}

	handler := r.routes[upath][method]
	for _, middleware := range r.middlewares {
		handler = middleware(handler)
	}

	handler.ServeHTTP(w, req)
}

func (s *ApiApp) setupRoutes() *Router {
	mux := &Router{
		routes: make(map[string]map[string]http.Handler),
	}

	mux.ServerStatic("/assets", "./dist/assets/")

	mux.AddMiddleware(middlewares.HttpMetricsHandler)
	mux.AddMiddleware(middlewares.InjectRequestContext)
	mux.AddMiddleware(middlewares.EnsureUserContext)

	mux.Handle(http.MethodGet, "/api/v1/name", s.GetName)
	mux.Handle(http.MethodPost, "/api/v1/name", s.SetName)
	mux.Handle(http.MethodPost, "/api/v1/game", s.CreateGame)

	mux.Handle(http.MethodPost, "/api/v1/game/lobby", s.WsHandler)

	mux.Handle(http.MethodGet, "/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "./dist/index.html")
	})

	return mux
}

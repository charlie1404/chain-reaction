package api

import (
	"fmt"
	"log/slog"
	"net/http"
	"path"
	"strings"
)

type Middleware func(next http.Handler) http.Handler

type Router struct {
	routes               map[string]map[string]http.Handler
	middlewares          []Middleware
	staticFilesServer    http.Handler
	staticFilesUrlPrefix string
}

func NewRouter() *Router {
	return &Router{
		routes: make(map[string]map[string]http.Handler),
	}
}

func (r *Router) ServerStatic(urlPrefix string, dir string) {
	r.staticFilesServer = http.StripPrefix(urlPrefix, http.FileServer(http.Dir(dir)))
	r.staticFilesUrlPrefix = urlPrefix
}

func (r *Router) AddMiddleware(middleware Middleware) {
	r.middlewares = append(r.middlewares, middleware)
}

func (r *Router) Handle(method, path string, handler http.Handler) {
	if _, ok := r.routes[path][method]; ok {
		panic(fmt.Sprintf("Duplicate path: %s", path))
	}

	if _, ok := r.routes[path]; !ok {
		r.routes[path] = make(map[string]http.Handler)
	}

	r.routes[path][method] = handler
}

func (r *Router) GET(path string, handler http.Handler) {
	r.Handle(http.MethodGet, path, handler)
}

func (r *Router) HEAD(path string, handler http.Handler) {
	r.Handle(http.MethodHead, path, handler)
}

func (r *Router) OPTIONS(path string, handler http.Handler) {
	r.Handle(http.MethodOptions, path, handler)
}

func (r *Router) POST(path string, handler http.Handler) {
	r.Handle(http.MethodPost, path, handler)
}

func (r *Router) PUT(path string, handler http.Handler) {
	r.Handle(http.MethodPut, path, handler)
}

func (r *Router) PATCH(path string, handler http.Handler) {
	r.Handle(http.MethodPatch, path, handler)
}

func (r *Router) DELETE(path string, handler http.Handler) {
	r.Handle(http.MethodDelete, path, handler)
}

func (r *Router) ServeHTTP(w http.ResponseWriter, req *http.Request) {
	defer func() {
		if err := recover(); err != nil {
			fmt.Printf("%#v\n", err)
			slog.Error("ROUTER_PANIC_RECOVER", "error", err)

			w.WriteHeader(http.StatusInternalServerError)
			w.Header().Set("Content-Type", "application/json; charset=utf-8")

			fmt.Fprint(w, `{"error": "Internal Server Error"}`)
		}
	}()

	upath := req.URL.Path
	method := req.Method

	if r.staticFilesUrlPrefix != "" && strings.HasPrefix(upath, r.staticFilesUrlPrefix) {
		fmt.Println(path.Clean(req.URL.Path))
		fmt.Println("Serving static file", upath, r.staticFilesUrlPrefix)
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

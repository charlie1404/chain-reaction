package app

import (
	"log/slog"
	"time"

	"github.com/charlie1404/chain-reaction/internal/config"
	"go.etcd.io/bbolt"
)

func initDB() *bbolt.DB {
	var err error

	DB, err := bbolt.Open(config.AppConfig.App.DBPath, 0600, &bbolt.Options{Timeout: 1 * time.Second})
	if err != nil {
		slog.Error("DB_OPEN_FAILED", "error", err)
		panic(err)
	}

	tx, err := DB.Begin(true)
	if err != nil {
		slog.Error("DB_TX_BEGIN_FAILED", "error", err)
		panic(err)
	}
	defer tx.Rollback()

	_, err = tx.CreateBucketIfNotExists([]byte("profiles"))
	if err != nil {
		slog.Error("DB_BUCKET_CREATE_FAILED", "error", err)
		panic(err)
	}

	err = tx.Commit()
	if err != nil {
		slog.Error("DB_TX_COMMIT_FAILED", "error", err)
		panic(err)
	}

	return DB
}

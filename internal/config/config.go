package config

import (
	"github.com/spf13/viper"
)

var AppConfig Config

type App struct {
	Host      string
	DBPath    string
	GamesPath string
}

type Metrics struct {
	Host string
}

type Config struct {
	App     App
	Metrics Metrics
}

func initDefaults() {
	viper.SetDefault("App.Host", "0.0.0.0:3344")
	viper.SetDefault("Metrics.Host", "0.0.0.0:1337")
	viper.SetDefault("App.GamesPath", "./.data/")
	viper.SetDefault("App.DBPath", "./.data/datastore.db")
}

func InitConfig() {
	viper.SetEnvPrefix("CR")
	viper.AutomaticEnv()

	initDefaults()

	viper.Unmarshal(&AppConfig)
}

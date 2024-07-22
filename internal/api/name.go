package api

import (
	"log/slog"
	"net/http"
	"unsafe"

	randv2 "math/rand/v2"

	"github.com/charlie1404/chain-reaction/internal/constants"
	"github.com/charlie1404/chain-reaction/internal/models"

	"go.etcd.io/bbolt"
)

var BucketName = []byte("profiles")

var ADJECTIVES = [][]byte{
	[]byte("dry"), []byte("icy"), []byte("old"), []byte("red"), []byte("shy"), []byte("dark"), []byte("cool"),
	[]byte("dawn"), []byte("blue"), []byte("cold"), []byte("damp"), []byte("long"), []byte("late"), []byte("bold"),
	[]byte("wild"), []byte("holy"), []byte("aged"), []byte("misty"), []byte("empty"), []byte("quiet"),
	[]byte("white"), []byte("wispy"), []byte("green"), []byte("muddy"), []byte("rough"), []byte("still"),
	[]byte("small"), []byte("black"), []byte("young"), []byte("snowy"), []byte("proud"), []byte("autumn"),
	[]byte("hidden"), []byte("bitter"), []byte("silent"), []byte("summer"), []byte("spring"), []byte("winter"),
	[]byte("broken"), []byte("frosty"), []byte("little"), []byte("floral"), []byte("divine"), []byte("purple"),
	[]byte("lively"), []byte("patient"), []byte("crimson"), []byte("falling"), []byte("morning"), []byte("ancient"),
	[]byte("delicate"), []byte("twilight"), []byte("withered"), []byte("solitary"), []byte("fragrant"),
	[]byte("restless"), []byte("polished"), []byte("nameless"), []byte("weathered"), []byte("billowing"),
	[]byte("lingering"), []byte("sparkling"), []byte("throbbing"), []byte("wandering"),
}

var ADJECTIVES_LEN = len(ADJECTIVES)

var NOUNS = [][]byte{
	[]byte("sea"), []byte("sun"), []byte("dew"), []byte("sky"), []byte("sun"), []byte("fog"), []byte("moon"),
	[]byte("rain"), []byte("wind"), []byte("snow"), []byte("lake"), []byte("pine"), []byte("leaf"), []byte("dawn"),
	[]byte("hill"), []byte("bird"), []byte("bush"), []byte("dust"), []byte("fire"), []byte("haze"), []byte("pond"),
	[]byte("surf"), []byte("wave"), []byte("wood"), []byte("tree"), []byte("frog"), []byte("star"), []byte("river"),
	[]byte("cloud"), []byte("glade"), []byte("brook"), []byte("field"), []byte("grass"), []byte("night"),
	[]byte("sound"), []byte("shape"), []byte("water"), []byte("water"), []byte("dream"), []byte("frost"),
	[]byte("voice"), []byte("paper"), []byte("smoke"), []byte("breeze"), []byte("sunset"), []byte("shadow"),
	[]byte("forest"), []byte("meadow"), []byte("flower"), []byte("violet"), []byte("cherry"), []byte("morning"),
	[]byte("glitter"), []byte("firefly"), []byte("feather"), []byte("silence"), []byte("thunder"),
	[]byte("mountain"), []byte("darkness"), []byte("waterfall"), []byte("butterfly"), []byte("snowflake"),
	[]byte("resonance"), []byte("wildflower"),
}

var NOUNS_LEN = len(NOUNS)

func (s *ApiApp) SetName(w http.ResponseWriter, r *http.Request) {
	r.ParseForm()
	name := r.FormValue("name")

	if name == "" {
		http.Error(w, "name is required", http.StatusBadRequest)
		return
	}

	if len(name) > 100 {
		http.Error(w, "name is too long", http.StatusBadRequest)
		return
	}

	userId := r.Context().Value(constants.ContextKeyRequestCtx).(*models.RequestCtx).UserID

	nameBytes := unsafe.Slice(unsafe.StringData(name), len(name))

	err := s.db.Update(func(tx *bbolt.Tx) error {
		b := tx.Bucket(BucketName)

		return b.Put(userId, nameBytes)
	})

	if err != nil {
		http.Error(w, "error setting name", http.StatusInternalServerError)
	}
}

func (s *ApiApp) GetName(w http.ResponseWriter, r *http.Request) {
	var name []byte

	userId := r.Context().Value(constants.ContextKeyRequestCtx).(*models.RequestCtx).UserID

	s.db.View(func(tx *bbolt.Tx) error {
		b := tx.Bucket(BucketName)

		name = b.Get(userId)

		return nil
	})

	if name == nil {
		randomAdjective := ADJECTIVES[randv2.IntN(ADJECTIVES_LEN)]
		randomNoun := NOUNS[randv2.IntN(NOUNS_LEN)]

		s.db.Update(func(tx *bbolt.Tx) error {
			b := tx.Bucket(BucketName)

			name = append(randomAdjective, byte(' '))
			name = append(name, randomNoun...)

			err := b.Put(userId, name) // even if error, we don't care as we can set name on next api call or new get request

			if err != nil {
				slog.Warn("error setting random name", "error", err)
			}

			return nil
		})
	}

	w.Write(name)
}

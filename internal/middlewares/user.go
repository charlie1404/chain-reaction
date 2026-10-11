package middlewares

import (
	"encoding/json"
	"errors"
	randv2 "math/rand/v2"
	"net/http"
	"unsafe"

	"github.com/charlie1404/chain-reaction/internal/constants"
	"github.com/charlie1404/chain-reaction/internal/models"
	"github.com/charlie1404/chain-reaction/internal/utils"
	"go.etcd.io/bbolt"
)

var IdSize = 8

var SAMPLE_AVATARS = []string{
	"cyber-bot", "cosmic-fox", "neon-dragon", "shadow-cat",
	"pixel-panda", "astro-knight", "plasma-wolf", "mystic-owl",
	"solar-falcon", "quantum-bear", "matrix-viper", "alien-voyager",
}

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

func EnsureProfileExists(db *bbolt.DB, userId []byte) {
	if db == nil {
		return
	}

	var exists bool
	db.View(func(tx *bbolt.Tx) error {
		b := tx.Bucket(models.BucketProfiles)
		if b != nil {
			raw := b.Get(userId)
			if len(raw) > 0 {
				exists = true
			}
		}
		return nil
	})

	if exists {
		return
	}

	randomAdjective := ADJECTIVES[randv2.IntN(len(ADJECTIVES))]
	randomNoun := NOUNS[randv2.IntN(len(NOUNS))]
	profile := models.StoredProfile{
		Name:   string(randomAdjective) + " " + string(randomNoun),
		Avatar: SAMPLE_AVATARS[randv2.IntN(len(SAMPLE_AVATARS))],
	}

	jsonBytes, _ := json.Marshal(profile)
	_ = db.Update(func(tx *bbolt.Tx) error {
		b := tx.Bucket(models.BucketProfiles)
		if b == nil {
			var err error
			b, err = tx.CreateBucketIfNotExists(models.BucketProfiles)
			if err != nil {
				return err
			}
		}
		return b.Put(userId, jsonBytes)
	})
}

func getNewSignedUserCookie() string {
	uidValue := utils.NewStr(IdSize)
	uisSign := utils.ComputeHmac(uidValue)

	return unsafe.String(unsafe.SliceData(uidValue), IdSize) + "." + uisSign
}

func EnsureUserContext(db *bbolt.DB) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		fn := func(w http.ResponseWriter, r *http.Request) {
			uid, err := r.Cookie("uid")
			var cookieValue string

			if err != nil {
				if !errors.Is(err, http.ErrNoCookie) {
					http.Error(w, "server error", http.StatusInternalServerError)
					return
				}

				cookieValue = getNewSignedUserCookie()
			} else {
				cookieValue = uid.Value

				if len(cookieValue) <= IdSize {
					cookieValue = getNewSignedUserCookie()
				} else {
					uidValue := cookieValue[:IdSize]
					uidSign := cookieValue[IdSize+1:]
					computedHmac := utils.ComputeHmac(unsafe.Slice(unsafe.StringData(uidValue), IdSize))

					// no concept of unauthenticated user, just create a new cookie
					// just a prevention for impersonation by editing cookie
					// let them play
					if computedHmac != uidSign {
						cookieValue = getNewSignedUserCookie()
					}
				}
			}

			http.SetCookie(w, &http.Cookie{
				Name:     "uid",
				Value:    cookieValue,
				Path:     "/",
				MaxAge:   31_536_000, // seconds in a year
				HttpOnly: true,
				Secure:   false,
				SameSite: http.SameSiteLaxMode,
			})

			userIdBytes := unsafe.Slice(unsafe.StringData(cookieValue[:IdSize]), len(cookieValue[:IdSize]))

			requestCtx := r.Context().Value(constants.ContextKeyRequestCtx).(*models.RequestCtx)
			requestCtx.UserID = userIdBytes

			// Ensure valid profile is created and stored in boltdb on every page load / request
			if db != nil {
				EnsureProfileExists(db, userIdBytes)
			}

			next.ServeHTTP(w, r)
		}

		return http.HandlerFunc(fn)
	}
}

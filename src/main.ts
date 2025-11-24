import m, { type Component } from "mithril";
import { collection, getDocs, getFirestore, Timestamp, type WithFieldValue } from "firebase/firestore";
import { initializeApp } from "firebase/app";

import "./style.css"

const app = initializeApp({
  apiKey: "AIzaSyAiATvIjGzb1rikJsCmJyoz_GxzVaDUkZY",
  authDomain: "soundscalz.firebaseapp.com",
  projectId: "soundscalz",
  storageBucket: "soundscalz.firebasestorage.app",
  messagingSenderId: "1062045686996",
  appId: "1:1062045686996:web:b47fa4e1db50ff343daf41"
});

const db = getFirestore(app);

type Album = {
  id?: string;
  title: string;
  artists: string[];
  releaseDate: Date;
  rating?: number;
  highlight?: boolean;
};

type compareFn = Parameters<typeof albums.sort>[0]

const sortByArtist: compareFn = (a, b) => {
  return a.artists[0].localeCompare(b.artists[0]);
}

const sortByTitle: compareFn = (a, b) => {
  return a.title.localeCompare(b.title);
}

const sortByDate: compareFn = (a, b) => {
  return b.releaseDate.getTime() - a.releaseDate.getTime();
}

const sortByRating: compareFn = (a, b) => {
  return (b.rating || 0) - (a.rating || 0);
}

function Stars(n: number | undefined) {
  if (!n || n < 0) {
    return null;
  }

  return "★".repeat(n);
}

function AlbumRow(): Component<Album> {
  return {
    view: function ({ attrs: { id, rating, artists, title, releaseDate, highlight } }) {
      const classes: string[] = [];
      if (rating) { classes.push("is-dark") };
      if (highlight) { classes.push("is-selected"); };

      return m("tr", { class: classes.join(" "), id, key: id },
        [
          m("td[align=right]", Stars(rating)),
          m("td", artists.join(", ")),
          m("td", m("i", title)),
          m("td[align=right][style=white-space:nowrap]", releaseDate?.toLocaleDateString(undefined, { month: "short", year: "numeric" })),
        ]);
    },
  };
}

function AlbumCard(): Component<Album> {
  return {
    view: function ({ attrs: { id, title, rating, releaseDate, artists, highlight } }) {
      const classes: string[] = [];
      if (rating) { classes.push("has-background-grey-darker") };
      if (highlight) { classes.push("has-background-primary"); };

      const textClasses: string[] = [];
      if (rating) { textClasses.push("has-text-white") }
      if (highlight) { textClasses.push("has-text-black") }

      return m(".card", {
        id: id,
        key: id,
        class: classes.join(" "),
        style: {
          boxShadow: "none",
          border: "1px solid",
        }
      }, [
        m(".card-content", [
          m(".columns.is-mobile.is-multiline.is-1.is-vcentered", [
            m(".column",
              m("p.title.is-6", { class: textClasses.join(" ") }, title)
            ),
            !!rating && m(".column.is-narrow",
              m("span.title.is-6", { class: textClasses.join(" ") }, Stars(rating))
            ),
            m(".column.is-12",
              m("p.subtitle.is-6", { class: textClasses.join(" ") }, artists.join(", ") + " • " + releaseDate.toLocaleDateString(undefined, { month: "short", year: "numeric" }))
            ),
          ]),
        ])
      ])
    }
  };
}

let isMobile = false;
let mediaQuery = window.matchMedia("(width <= 768px)")
if (mediaQuery.matches) {
  isMobile = mediaQuery.matches
}

mediaQuery = window.matchMedia("(min-width: 768px)")
mediaQuery.addEventListener('change', (ev) => { isMobile = !ev.matches; m.redraw() })

const Page: Component<{ sort?: string }> = {
  view: function ({ attrs: { sort } }) {
    if (!sort) sort = "Release"

    const _albums = [...albums].sort(
      sort === "Title" ? sortByTitle
        : sort === "Artist" ? (a, b) => (sortByArtist(a, b) || sortByDate(a, b))
          : sort === "Release" ? sortByDate
            : sort === "Rating" ? (a, b) => (sortByRating(a, b) || sortByDate(a, b))
              : () => 0)

    return m("section.section",
      m("main.container", [
        m("h1.title.is-1", "My Music Reviews"),
        m(".columns .is-mobile .is-vcentered",
          m(".column",
            m(".field", [
              m("label.label", "Sort by"),
              m(".select",
                m("select", {
                  onchange: (e: Event) => {
                    m.route.set('/music', { sort: (e.target as HTMLSelectElement).value });
                  }, value: sort
                }, [
                  m("option", "Title"),
                  m("option", "Artist"),
                  m("option", "Release"),
                  m("option", "Rating")
                ]))
            ]),
          ),
          m(".column .is-narrow",
            m(".buttons .has-addons",
              m("button.button.is-light", {
                onclick: function () {
                  let album = albums.find(album => album.highlight);
                  if (album) { album.highlight = !album.highlight; }

                  const id = albums.filter(album => !album.rating).map(album => album.id)[Math.floor(Math.random() * albums.length)];
                  album = albums.find(album => album.id === id);
                  if (!album) return;

                  album.highlight = true;

                  albums[albums.findIndex(album => album.id === id)] = album;

                  const element = document.querySelector(`#${id}`);
                  element?.scrollIntoView({ block: "center" });
                }
              }, [
                m("span.icon",
                  m("i.fa-duotone.fa-solid.fa-shuffle")
                ),
              ]
              )
            )
          )
        ),
        !isMobile ? m(".table-container",
          m("table.table.is-striped",
            m("tbody", [
              _albums.map((alb) => m(AlbumRow, alb)),
            ])
          )
        ) :
          _albums.map((alb) => m(AlbumCard, alb))
        ,
      ])
    );
  }

};

let albums: Album[];

const cacheKey = "album_cache"
type AlbumCache = {
  cachedAt: Date;
  albums: Album[];
}

// Source: https://cwestblog.com/2022/02/07/json-parse-reviver-for-dates/
function dateReviver(_key: string, value: unknown) {
  if ('string' === typeof value && /^\d{4}-[01]\d-[0-3]\dT[012]\d(?::[0-6]\d){2}\.\d{3}Z$/.test(value)) {
    const date = new Date(value);
    if (+date === +date) {
      return date;
    }
  }
  return value;
}

m.route(document.body, "/music", {
  "/music": {
    onmatch: async function () {
      // 'onmatch' runs everytime there is a change in the route, for example when we append the sorting key
      // to the URL. In Safari, for some reason, it runs a second time, even when the route does NOT change, as
      // with clicking the button to show a random album.
      if (albums) return

      const now = new Date()

      const albumCache = localStorage.getItem(cacheKey)
      if (albumCache) {
        let cache: AlbumCache;
        try {
          cache = JSON.parse(albumCache, dateReviver)
          if (
            cache.cachedAt.getFullYear() === now.getFullYear() &&
            cache.cachedAt.getMonth() === now.getMonth() &&
            cache.cachedAt.getDate() === now.getDate()
          ) {
            // cached date is sufficient
            albums = cache.albums
            return;
          }
        } catch (error) {
          console.log("Error while parsing cached values", error)
        }
      }

      type AlbumDbType = {
        title: string;
        artists: string[];
        rating?: number;
        releaseDate: Timestamp;
      };

      const querySnapshot = await getDocs(collection(db, "albums").withConverter<Album, AlbumDbType>({
        toFirestore: ({ title, artists, rating, releaseDate }: WithFieldValue<Album>) => {
          return { title, artists, rating, releaseDate: Timestamp.fromDate(releaseDate as Date) };
        },
        fromFirestore: (snapshot) => {
          const { title, artists, releaseDate, rating } = snapshot.data() as AlbumDbType;

          return {
            title, artists, releaseDate: releaseDate.toDate(), rating
          };
        }
      }))

      albums = querySnapshot.docs.map(doc => ({ ...doc.data(), id: `id-${doc.id}` }))

      const cache: AlbumCache = { albums, cachedAt: now }
      localStorage.setItem(cacheKey, JSON.stringify(cache))
    },
    render: (vnode) => m(Page, vnode.attrs)
  },
});

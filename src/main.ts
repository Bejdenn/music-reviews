import m, { type Component } from "mithril";
import { collection, connectFirestoreEmulator, getDocs, getFirestore, Timestamp, type WithFieldValue } from "firebase/firestore";
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
if (import.meta.env.DEV) connectFirestoreEmulator(db, '127.0.0.1', 8089);

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
      let classes: string[] = [];
      if (!rating) { classes.push("muted") };
      if (highlight) { classes.push("accent"); };

      return m("tr", { class: classes.join(" "), id, key: id },
        [
          m("td[align=right]", Stars(rating)),
          m("td", artists.join(", ")),
          m("td", m("i", title)),
          m("td[align=center]", releaseDate?.toLocaleDateString(undefined, { month: "short", year: "numeric" })),
        ]);
    },
  };
}

const Page: Component<{ sort?: string }> = {
  view: function ({ attrs: { sort } }) {
    if (!sort) sort = "Release"

    return m("main.smaller", [
      m("h1", "My Music Reviews"),
      m("form", [
        m("label", [
          "Sort by",
          m("select", {
            onchange: (e: any) => {
              m.route.set('/music', { sort: e.target.value });
            }, value: sort
          }, [
            m("option", "Title"),
            m("option", "Artist"),
            m("option", "Release"),
            m("option", "Rating")
          ]),
        ]),
        m("button", {
          onclick: function () {
            let album = albums.find(album => album.highlight);
            if (album) { album.highlight = !album.highlight; }

            const id = albums.filter(album => !!!album.rating).map(album => album.id)[Math.floor(Math.random() * albums.length)];
            album = albums.find(album => album.id === id);
            if (!album) return;

            album.highlight = true;

            albums[albums.findIndex(album => album.id === id)] = album;

            const element = document.querySelector(`#${id}`);
            element?.scrollIntoView();
          }
        }, "Go to random unrated album")
      ]),
      m(
        "table",
        m("tbody", [
          [...albums].sort(
            sort === "Title" ? sortByTitle
              : sort === "Artist" ? (a, b) => (sortByArtist(a, b) || sortByDate(a, b))
                : sort === "Release" ? sortByDate
                  : sort === "Rating" ? (a, b) => (sortByRating(a, b) || sortByDate(a, b))
                    : () => 0).map((alb) => m(AlbumRow, alb)),
        ])
      ),
    ]);
  }

};

let albums: Album[];

m.route(document.body, "/music", {
  "/music": {
    onmatch: async function () {
      // 'onmatch' runs everytime there is a change in the route, for example when we append the sorting key
      // to the URL. In Safari, for some reason, it runs a second time, even when the route does NOT change, as
      // with clicking the button to show a random album.
      if (albums) return

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
    },
    render: (vnode) => m(Page, vnode.attrs)
  },
});

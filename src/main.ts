import m, { type Component } from "mithril";
import { collection, connectFirestoreEmulator, getDocs, getFirestore, Timestamp, type WithFieldValue } from "firebase/firestore";
import { initializeApp } from "firebase/app";

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
  title: string;
  artists: string[];
  releaseDate: Date;
  rating?: number;
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
    view: function ({ attrs: { rating, artists, title, releaseDate } }) {
      return m("tr[style=word-break:keep-all]", { class: !rating ? "muted" : "" },
        [
          m("td[align=right]", Stars(rating)),
          m("td", artists.join(", ")),
          m("td", m("i", title)),
          m("td[align=center]", releaseDate?.toLocaleDateString(undefined, { month: "short", year: "numeric" })),
        ]);
    },
  };
}

const Page: Component<{ sort?: string, albums: Album[] }> = {
  view: function ({ attrs: { sort, albums } }) {
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

      albums = querySnapshot.docs.map(doc => doc.data())
    },
    render: (vnode) => m(Page, { ...vnode.attrs, albums })
  },
});

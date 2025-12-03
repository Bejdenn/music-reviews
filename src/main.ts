import m, { type Component } from "mithril";
import { collection, getDocs, getFirestore, Timestamp, type WithFieldValue } from "firebase/firestore";
import { initializeApp } from "firebase/app";

import { Cache, Observed } from "./utils";

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
  currentlyListening?: boolean;
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
  return (b.rating ?? 0) - (a.rating ?? 0);
}

const sortByCurrentlyListening: compareFn = (a, b) => {
  return a.currentlyListening === b.currentlyListening ? 0 : a.currentlyListening ? -1 : 1;
}

function Stars(n: number | undefined) {
  if (!n || n < 0) {
    return null;
  }

  return "★".repeat(n);
}

function MusicNote(): Component<{ id: string }> {
  return {
    view: function () {
      return m("span", "♫")
    }
  }
}

function AlbumRow(): Component<Album> {
  return {
    view: function ({ attrs: { id, rating, artists, title, releaseDate, currentlyListening } }) {
      const classes: string[] = [];
      if (rating) { classes.push("bg-neutral-700 text-white"); };
      if (highlighted.get()?.id === id) { classes.push("bg-indigo-300", "text-black"); };

      return m("tr", { class: classes.join(" "), id, key: id },

        ([
          { align: "right", value: rating ? m("span", Stars(rating)) : currentlyListening ? m(MusicNote, { id: id! }) : null },
          { value: artists.join(", ") },
          { value: title },
          { value: releaseDate?.toLocaleDateString(undefined, { month: "short", year: "numeric" }) }
        ]).map(cell => m("td", {
          align: cell.align ?? "left",
          class: "border-b border-gray-100 p-2 pl-8 dark:border-gray-700"
        }, cell.value))
      );
    },
  };
}

function AlbumCard(): Component<Album> {
  return {
    view: function ({ attrs: { id, title, rating, releaseDate, artists, currentlyListening } }) {
      const classes: string[] = [];
      if (rating) { classes.push("has-background-grey-darker") };
      if (highlighted.get()?.id === id) { classes.push("has-background-primary"); };

      const textClasses: string[] = [];
      if (rating) { textClasses.push("has-text-white") }
      if (highlighted.get()?.id === id) { textClasses.push("has-text-black") }

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
            m(".column.is-narrow",
              m("span.title.is-6", { class: textClasses.join(" ") }, rating ? Stars(rating) : currentlyListening ? m(MusicNote, { id: id! }) : null)
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

function scrollIntoView(id: string | undefined) {
  (document.querySelector(`#${id}`))?.scrollIntoView({ block: "center" });
}

type SortBy = "Title" | "Artist" | "Release" | "Rating" | "Listening"

function isSortBy(s: string): s is SortBy {
  return ["Title", "Artist", "Release", "Rating", "Listening"].includes(s)
}

const sortAlbums = (albums: Album[], sort: SortBy) => {
  return albums.sort(
    sort === "Title" ? sortByTitle
      : sort === "Artist" ? (a, b) => (sortByArtist(a, b) || sortByDate(a, b))
        : sort === "Release" ? sortByDate
          : sort === "Rating" ? (a, b) => (sortByRating(a, b) || sortByDate(a, b))
            : sort === "Listening" ? (a, b) => (sortByCurrentlyListening(a, b) || sortByDate(a, b))
              : () => 0)
}

const Page: Component<{ sort: SortBy }> = {
  view: function ({ attrs: { sort } }) {
    return m("section", { class: "lg:px-24 lg:py-14" },
      m("main", [
        m("h1", { class: "text-5xl dark:text-white font-extrabold" }, "My Music Reviews"),
        m("div", { class: "mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6" },
          m("div", { class: "sm:col-span-3" }, [
            m("label", { class: "block text-sm/6 font-medium text-black dark:text-white" }, "Sort by"),
            m("div", { class: "mt-2 grid grid-cols-1" }, [
              m("select", {
                class: "col-start-1 row-start-1 w-full appearance-none rounded-md bg-black/5 dark:bg-white/5 py-2 pr-8 pl-3 text-base text-black dark:text-white outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10 *:bg-gray:800 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6",
                id: "sort",
                name: "sort",
                onchange: (e: Event) => {
                  const sort = (e.target as HTMLSelectElement).value;
                  if (isSortBy(sort)) albums = sortAlbums(albums, sort);

                  m.route.set('/music', { sort });
                }, value: sort
              }, [
                (["Title", "Artist", "Release", "Rating", "Listening"] satisfies SortBy[])
                  .map(sb => m("option", sb))
              ]),
              m("svg", { class: "pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-400 sm:size-4", viewBox: "0 0 16 16", fill: "currentColor", "data-slot": "icon", "aria-hidden": "true" },
                m("path[d=M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z][clip-rule=evenodd][fill-rule=evenodd]")
              )
            ])
          ])
        ),
        !isMobile ? m("div", { class: "mt-10 not-prose overflow-auto rounded-lg bg-white outline outline-white/5 dark:bg-gray-950/50" },
          m("table", { class: "w-full table-auto border-collapse text-sm" },
            m("tbody", { class: "bg-inherit dark:text-white" }, [
              albums.map((alb) => m(AlbumRow, alb)),
            ])
          )
        ) :
          albums.map((alb) => m(AlbumCard, alb))
      ]),
      m("button", {
        class: "fixed bottom-4 right-4 z-10 shadow-md/30 py-2.25 px-2.5 rounded-md bg-white hover:bg-slate-100 active:bg-slate-200",
        onclick: function () {
          const id = albums.filter(album => !album.rating).map(album => album.id)[Math.floor(Math.random() * albums.length)];
          const album = albums.find(album => album.id === id);
          if (!album) return;

          highlighted.set(album)
        }
      }, [
        m("span.icon",
          m("i.fa-duotone.fa-solid.fa-shuffle")
        ),
      ])
    );
  }

};

let albums: Album[];
let highlighted: Observed<Album>;

m.route(document.querySelector<HTMLDivElement>('#app')!, "/music", {
  "/music": {
    onmatch: async function (args: { sort?: string }) {
      // 'onmatch' runs everytime there is a change in the route, for example when we append the sorting key
      // to the URL. In Safari, for some reason, it runs a second time, even when the route does NOT change, as
      // with clicking the button to show a random album.
      if (albums) return

      const now = new Date()

      const albumCache = new Cache<Album[]>("album_cache", ({ cachedAt }) =>
        cachedAt.getFullYear() === now.getFullYear()
        && cachedAt.getMonth() === now.getMonth()
        && cachedAt.getDate() === now.getDate()
      )

      if (albumCache.isValid()) {
        albums = albumCache.get().value
      } else {
        type AlbumDbType = {
          title: string;
          artists: string[];
          rating?: number;
          releaseDate: Timestamp;
          currentlyListening?: boolean;
        };

        const querySnapshot = await getDocs(collection(db, "albums").withConverter<Album, AlbumDbType>({
          toFirestore: ({ title, artists, rating, releaseDate }: WithFieldValue<Album>) => {
            return { title, artists, rating, releaseDate: Timestamp.fromDate(releaseDate as Date) };
          },
          fromFirestore: (snapshot) => {
            const { title, artists, releaseDate, rating, currentlyListening } = snapshot.data() as AlbumDbType;

            return {
              title, artists, releaseDate: releaseDate.toDate(), rating, currentlyListening
            };
          }
        }))

        albums = querySnapshot.docs.map(doc => ({ ...doc.data(), id: `id-${doc.id}` }))
        albumCache.set(albums)
      }

      const sort = args.sort ?? "Release"
      if (isSortBy(sort)) albums = sortAlbums(albums, sort)

      highlighted = new Observed();
      highlighted.addListener((element) => { scrollIntoView(element.id) });
    },
    render: (vnode) => m(Page, { ...vnode.attrs, sort: vnode.attrs.sort ?? "Release" })
  },
});

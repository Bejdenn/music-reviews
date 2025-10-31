import m, { type Vnode } from "mithril";
import type { Album } from "./albums.ts";
import { albums } from "./albums.ts";
import "./style.css";

type sortBy = "Title" | "Artist" | "Release" | "Rating";

type AlbumSortFn = Parameters<typeof albums.sort>[0]

const sortByArtist: AlbumSortFn = (a, b) => a.artists[0].localeCompare(b.artists[0])
const sortByTitle: AlbumSortFn = (a, b) => a.title.localeCompare(b.title)
const sortByDate: AlbumSortFn = (a, b) => b.releaseDate.getTime() - a.releaseDate.getTime()
const sortByRating: AlbumSortFn = (a, b) => (b.rating || 0) - (a.rating || 0)

function AlbumRow() {
  return {
    view: function ({ attrs }: Vnode<Album>) {
      return m("tr", { class: !attrs.rating ? "muted" : "" },
        [
          m("td", { align: "right" }, Stars(attrs.rating)),
          m("td", attrs.artists.join(", ")),
          m("td", m("i", attrs.title)),
          m("td", { align: "center" }, attrs.releaseDate?.toLocaleDateString(undefined, { month: "short", year: "numeric" })),
        ]);
    },
  };
}

function Stars(n: number | undefined) {
  if (!n || n < 0) {
    return null;
  }

  return "★".repeat(n);
}

m.route(document.body, "/music", {
  "/music": {
    view: function () {
      let sort: sortBy = m.route.param("sort") as sortBy || "Release";

      return m("main", { class: "smaller" }, [
        m("h1", "My Music Reviews"),
        m("form", { method: "get" }, [
          m("label", [
            "Sort by",
            m("select", {
              onchange: (e: any) => {
                window.location.href = `/#!/music?sort=${e.target.value}`
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
            albums.sort(
              sort === "Title" ? sortByTitle
                : sort === "Artist" ? (sortByArtist || sortByDate)
                  : sort === "Release" ? sortByDate
                    : sort === "Rating" ? (sortByRating || sortByDate)
                      : () => 0).map((alb) => m(AlbumRow, alb)),
          ]),
        ),
      ]);
    }
  },
});

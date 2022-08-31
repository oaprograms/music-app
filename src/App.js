import "./App.css";
import React from "react";
import { Virtuoso } from "react-virtuoso";
import { observer } from "mobx-react-lite";
import { makeAutoObservable } from "mobx";
import data from "./data";
import { configure } from "mobx";
import YouTube from "react-youtube";

configure({
  enforceActions: "never",
});

for (let i = 0; i < data.artists.length; i++) {
  data.artists[i].index = i;
}

let svdL = null;
let svdH = null;

function cosinesim(vec1, vec2) {
  if (!vec1 || !vec2) {
    return 0;
  }
  let dotproduct = 0;
  let mA = 0;
  let mB = 0;
  for (let i = 0; i < vec1.length; i++) {
    dotproduct += vec1[i] * vec2[i];
    mA += vec1[i] * vec1[i];
    mB += vec2[i] * vec2[i];
  }
  mA = Math.sqrt(mA);
  mB = Math.sqrt(mB);
  return (dotproduct / mA) * mB;
}

function putSimilarities(srcArtistNames, filteredArtists) {
  for (let artist of filteredArtists) {
    artist.sim = 0;
  }
  for (let srcArtistName of srcArtistNames) {
    const srcArtistIndex = data.artists.filter(
      (artist) => artist.a === srcArtistName
    )[0].index;
    for (let artist of filteredArtists) {
      if (srcArtistIndex > artist.index) {
        artist.sim +=
          Math.pow(
            Math.abs(
              cosinesim(
                (svdL || {})[srcArtistIndex],
                (svdL || {})[artist.index]
              )
              // (artist.index + 500)
            ),
            1
            // todo: check if this does sth
          ) /
          (artist.index + 1000);
      } else {
        artist.sim +=
          Math.pow(
            Math.abs(
              cosinesim(
                (svdH || {})[srcArtistIndex],
                (svdH || {})[artist.index]
              )
              // (artist.index + 500)
            ),
            1
          ) /
          (artist.index + 1000);
      }
    }
  }
}

function getArtistDecade(year) {
  if (!year) {
    return null;
  } else if (year < 1980) {
    return "≤ 70s";
  } else if (year < 1990) {
    return "80s";
  } else if (year < 2000) {
    return "90s";
  } else if (year < 2010) {
    return "00s";
  } else if (year < 2020) {
    return "10s";
  } else if (year < 2030) {
    return "20s";
  }
  return null;
}

class AppStore {
  constructor() {
    this.init();
    makeAutoObservable(this);

    fetch("./svdL.json")
      .then((response) => response.json())
      .then((data) => {
        svdL = data;
        this.refreshFilters();
      });
    fetch("./svdH.json")
      .then((response) => response.json())
      .then((data) => {
        svdH = data;
        this.refreshFilters();
      });
  }
  init() {
    try {
      this.savedArtists = JSON.parse(
        localStorage.getItem("savedArtists") || "{}"
      );
      this.listenedArtists = JSON.parse(
        localStorage.getItem("listenedArtists") || "{}"
      );
      this.hiddenTags = JSON.parse(localStorage.getItem("hiddenTags") || "{}");
      this.similarToArtists = JSON.parse(
        localStorage.getItem("similarToArtists") || "{}"
      );
      this.shownTags = JSON.parse(localStorage.getItem("shownTags") || "{}");
      this.shownDecades = JSON.parse(
        localStorage.getItem("shownDecades") ||
          JSON.stringify({
            "≤ 70s": true,
            "80s": true,
            "90s": true,
            "00s": true,
            "10s": true,
            "20s": true,
          })
      );
      this.showIntro = !localStorage.getItem("skipIntro");
      this.refreshFilters();
      if (!this.showIntro) {
        this.playIndex = parseInt(localStorage.getItem("lastPlayIndex") || "0");
      }
    } catch (e) {}
  }

  //data:
  // currentAudio = null;
  // lastSeekIdentifier = 0;

  playIndex = -1;
  savedArtists = {};
  listenedArtists = {};
  similarToArtistsSearchText = "";
  similarToArtists = {};
  hiddenTags = {};
  hiddenTagsSearchText = "";
  shownTags = {};
  shownTagsSearchText = "";
  shownDecades = {};
  tab = "discover";

  filteredArtists = [];
  showIntro = true;

  currentPlayer = null;
  isPlaying = false;

  playArtist(index) {
    this.playIndex = index;
    localStorage.setItem("lastPlayIndex", index);
    const artist = data.artists[index];
    if (!this.listenedArtists[artist.a]) {
      this.listenedArtists[artist.a] = true;
      localStorage.setItem(
        "listenedArtists",
        JSON.stringify(this.listenedArtists)
      );
    }
  }

  // playAudio(index) {
  //   const a = new Audio("./cuts/" + index + ".mp3");
  //   new Audio("./cuts/" + this.findNextIndex(index) + ".mp3");
  //   if (this.currentAudio && this.currentAudio.pause) {
  //     this.currentAudio.pause();
  //   }
  //   const lastS = Math.floor(Math.random());
  //   this.lastSeekIdentifier = lastS;
  //   this.currentAudio = a;
  //   this.playIndex = index;
  //   localStorage.setItem("lastPlayIndex", index);
  //
  //   const artist = data.artists[index];
  //   if (!this.listenedArtists[artist.a]) {
  //     this.listenedArtists[artist.a] = true;
  //     localStorage.setItem(
  //       "listenedArtists",
  //       JSON.stringify(this.listenedArtists)
  //     );
  //   }

  // this.refreshFilters();

  //   this.currentAudio.addEventListener("ended", (event) => {
  //     if (lastS === this.lastSeekIdentifier) {
  //       this.playAudio(this.findNextIndex(index));
  //     }
  //   });
  //   this.currentAudio.play();
  // }

  refreshFilters() {
    const filteredArtists = data.artists.filter((artist) => {
      if (
        Object.keys(this.shownTags).length &&
        !Object.keys(this.shownTags).some((ti) =>
          artist.t.includes(parseInt(ti))
        )
      ) {
        return false;
      }
      if (
        Object.keys(this.hiddenTags).some((ti) =>
          artist.t.includes(parseInt(ti))
        )
      ) {
        return false;
      }
      if (
        !["≤ 70s", "80s", "90s", "00s", "10s", "20s"].every(
          (d) => this.shownDecades[d]
        ) &&
        !this.shownDecades[getArtistDecade(artist.y)]
      ) {
        return false;
      }

      return true;
    });
    if (Object.keys(this.similarToArtists).length) {
      putSimilarities(Object.keys(this.similarToArtists), filteredArtists);
      // console.log(filteredArtists.length, data.svd.length);
      filteredArtists.sort((a, b) => b.sim - a.sim);
    } else {
      filteredArtists.sort((a, b) => a.index - b.index);
    }
    this.filteredArtists = filteredArtists;
  }

  toggleDecade(decade) {
    this.shownDecades[decade] = !this.shownDecades[decade];
    localStorage.setItem("shownDecades", JSON.stringify(this.shownDecades));
    this.refreshFilters();
  }

  toggleSimilarArtist(artistName) {
    if (!this.similarToArtists[artistName]) {
      this.similarToArtists[artistName] = true;
    } else {
      delete this.similarToArtists[artistName];
    }
    localStorage.setItem(
      "similarToArtists",
      JSON.stringify(this.similarToArtists)
    );
    this.refreshFilters();
  }

  toggleHiddenTag(tagIndex) {
    if (!this.hiddenTags[tagIndex]) {
      this.hiddenTags[tagIndex] = true;
    } else {
      delete this.hiddenTags[tagIndex];
    }
    localStorage.setItem("hiddenTags", JSON.stringify(this.hiddenTags));
    this.refreshFilters();
  }

  toggleShownTag(tagIndex) {
    if (!this.shownTags[tagIndex]) {
      this.shownTags[tagIndex] = true;
    } else {
      delete this.shownTags[tagIndex];
    }
    localStorage.setItem("shownTags", JSON.stringify(this.shownTags));
    this.refreshFilters();
  }

  findNextIndex(currentIndex) {
    for (let a of this.filteredArtists) {
      if (a.index > currentIndex) {
        return a.index;
      }
    }
    if (this.filteredArtists.length > 0) {
      return this.filteredArtists[0].index;
    }
    return 0;
  }
}

const store = new AppStore();

export const Artist = observer(({ artist }) => {
  return (
    <div
      className={
        "playlist-item" + (artist.index === store.playIndex ? " active" : "")
      }
      onClick={() => {
        if (artist.index !== store.playIndex) {
          store.playArtist(artist.index);
        } else {
          if (store.isPlaying) {
            store.currentPlayer?.pauseVideo();
          } else {
            store.currentPlayer?.playVideo();
          }
        }
        // store.refreshFilters();
      }}
    >
      <span
        style={{
          opacity: 0.25,
          display: "flex",
          flexGrow: 0,
          flexShrink: 0,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {artist.index === store.playIndex && store.isPlaying && (
          <svg
            style={{
              width: "26px",
              fill: "#fff",
              pointerEvents: "none",
            }}
            focusable="false"
            viewBox="0 0 512 512"
          >
            <path d="M224,435.8V76.1c0-6.7-5.4-12.1-12.2-12.1h-71.6c-6.8,0-12.2,5.4-12.2,12.1v359.7c0,6.7,5.4,12.2,12.2,12.2h71.6   C218.6,448,224,442.6,224,435.8z" />
            <path d="M371.8,64h-71.6c-6.7,0-12.2,5.4-12.2,12.1v359.7c0,6.7,5.4,12.2,12.2,12.2h71.6c6.7,0,12.2-5.4,12.2-12.2V76.1   C384,69.4,378.6,64,371.8,64z" />
          </svg>
          // <svg
          //   style={}
          //
          //   viewBox="0 0 122.88 122.88"
          // >
          //   <path d="M61.44,0c16.97,0,32.33,6.88,43.44,18c11.12,11.12,18,26.48,18,43.44c0,16.97-6.88,32.33-18,43.44 c-11.12,11.12-26.48,18-43.44,18c-16.97,0-32.33-6.88-43.44-18C6.88,93.77,0,78.41,0,61.44C0,44.47,6.88,29.11,18,18 C29.11,6.88,44.47,0,61.44,0L61.44,0z M42.3,39.47h13.59v43.95l-13.59,0V39.47L42.3,39.47L42.3,39.47z M66.99,39.47h13.59v43.95 l-13.59,0V39.47L66.99,39.47L66.99,39.47z M97.42,25.46c-9.21-9.21-21.93-14.9-35.98-14.9c-14.05,0-26.78,5.7-35.98,14.9 c-9.21,9.21-14.9,21.93-14.9,35.98s5.7,26.78,14.9,35.98c9.21,9.21,21.93,14.9,35.98,14.9c14.05,0,26.78-5.7,35.98-14.9 c9.21-9.21,14.9-21.93,14.9-35.98S106.63,34.66,97.42,25.46L97.42,25.46z" />
          // </svg>
        )}
        {(artist.index !== store.playIndex || !store.isPlaying) && (
          <svg
            style={{
              width: "26px",
              fill: "#fff",
              pointerEvents: "none",
            }}
            focusable="false"
            viewBox="0 0 24 24"
          >
            <path d="M8 5v14l11-7z"></path>
          </svg>
        )}
      </span>
      <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
        <div className="author">
          <span className="rank">#{artist.index + 1}</span>
          <span>{artist.a}</span>
          <div
            title={store.savedArtists[artist.a] ? "Unsave" : "Save"}
            style={{
              verticalAlign: "middle",
              padding: "0 6px",
              cursor: "pointer",
              position: "relative",
              top: "2px",
              marginLeft: "24px",
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (!store.savedArtists[artist.a]) {
                store.savedArtists[artist.a] = true;
              } else {
                delete store.savedArtists[artist.a];
              }
              localStorage.setItem(
                "savedArtists",
                JSON.stringify(store.savedArtists)
              );
              // store.refreshFilters();
            }}
          >
            {!store.savedArtists[artist.a] && (
              <svg viewBox="0 0 640 640" style={{ width: "20px" }}>
                <path
                  fill="#fff"
                  d="M550.080 132.992c-53.504-49.12-140.256-49.12-193.76 0l-36.32 33.312-36.352-33.312c-53.504-49.12-140.224-49.12-193.728 0-60.192 55.232-60.192 144.608 0 199.84l230.080 211.168 230.080-211.168c60.16-55.232 60.16-144.64 0-199.84zM515.968 300l-195.968 182.88-196-182.88c-19.744-18.144-27.392-41.824-27.392-67.008s4.416-45.856 24.192-63.968c17.44-16.032 40.896-24.864 66.016-24.864 25.088 0 48.544 15.232 65.984 31.296l67.2 58.4 67.168-58.432c17.472-16.064 40.896-31.296 66.016-31.296s48.576 8.832 66.016 24.864c19.776 18.112 24.16 38.784 24.16 63.968s-7.616 48.896-27.392 67.040z"
                ></path>
              </svg>
            )}
            {!!store.savedArtists[artist.a] && (
              <svg viewBox="0 0 640 640" style={{ width: "20px" }}>
                <path
                  fill="#fff"
                  d="M550.080 132.96c-53.504-49.088-140.256-49.088-193.76 0l-36.32 33.344-36.352-33.344c-53.504-49.088-140.224-49.088-193.728 0-60.192 55.264-60.192 144.64 0 199.872l230.080 211.168 230.080-211.168c60.16-55.232 60.16-144.64 0-199.872z"
                ></path>
              </svg>
            )}
          </div>
          <div
            title="YouTube"
            style={{
              cursor: "pointer",
              display: "inline-flex",
              verticalAlign: "middle",
              marginLeft: "8px",
              marginRight: "8px",
            }}
            className="yt-icon-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.open(
                "http://www.youtube.com/results?search_query=" +
                  encodeURIComponent(artist.a),
                "_blank"
              );
            }}
          >
            <svg style={{ width: "24px" }} viewBox="0 0 524 367">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M101 28C60.6832 28 28 60.6832 28 101V266C28 306.317 60.6832 339 101 339H423C463.317 339 496 306.317 496 266V101C496 60.6832 463.317 28 423 28H101ZM0 101C0 45.2192 45.2192 0 101 0H423C478.781 0 524 45.2192 524 101V266C524 321.781 478.781 367 423 367H101C45.2192 367 0 321.781 0 266V101ZM207 103.593L358.929 184L207 264.407V103.593ZM235 150.091V217.909L299.071 184L235 150.091Z"
                fill="#fff"
              />
            </svg>
          </div>
          {store.listenedArtists[artist.a] && (
            <span
              style={{
                fontSize: "13px",
                color: "#fff4",
                padding: "2px 7px",
              }}
            >
              PLAYED
            </span>
          )}
        </div>
        <div className="tags">
          {artist.t.map((ti) => (
            <span
              className="tag"
              key={ti}
              onClick={(e) => {
                e.stopPropagation();
                this.toggleShownTag(ti);
              }}
            >
              {data.tags[ti]}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
});

export const App = observer(() => {
  return (
    <>
      <header
        style={{
          padding: "6px 32px",
          background: "#2c2c2c",
          borderBottom: "2px solid #000",
        }}
      >
        <h1
          style={{
            display: "inline-block",
            fontSize: "20px",
            margin: "0 24px 0 0",
            color: "#8c9",
            fontWeight: 700,
            opacity: 0.7,
          }}
        >
          <span
            style={{
              marginRight: "20px",
              color: "#fff",
              fontWeight: 300,
              fontSize: "18px",
              fontStyle: "italic",
            }}
          >
            Discover new music, one track per artist
          </span>
        </h1>

        <span
          className={"tab" + (store.tab === "discover" ? " active" : "")}
          onClick={() => {
            store.tab = "discover";
          }}
        >
          Discover
        </span>
        <span
          className={"tab" + (store.tab === "saved" ? " active" : "")}
          onClick={() => {
            store.tab = "saved";
          }}
        >
          Saved ({Object.keys(store.savedArtists).length})
        </span>
      </header>
      {store.tab === "discover" && (
        <div className="section">
          <div className="filters">
            {/*<span>Filters</span>*/}
            <span className="filters-group">
              <span>Similar to artist(s):</span>
              {Object.keys(store.similarToArtists).length > 0 && (
                <span style={{ marginLeft: "8px" }}>
                  {Object.keys(store.similarToArtists).map((artistName) => {
                    return (
                      <span className="tag filter-tag" key={artistName}>
                        {artistName}
                        <span
                          className="hide-tag-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            store.toggleSimilarArtist(artistName);
                          }}
                        >
                          <svg
                            style={{
                              width: "11px",
                              height: "11px",
                              fill: "#fff6",
                            }}
                            viewBox="0 0 1000 1000"
                          >
                            <path d="M632.2,500l330.4-330.5c36.5-36.5,36.5-95.8,0-132.2c-36.4-36.5-95.7-36.5-132.2,0L500,367.8L169.6,37.4C133,0.9,73.9,0.9,37.4,37.4C0.9,73.8,0.9,133,37.4,169.6L367.9,500L37.4,830.4c-36.5,36.5-36.5,95.7,0,132.2c36.5,36.5,95.7,36.5,132.2,0L500,632.2l330.4,330.4c36.5,36.5,95.7,36.5,132.2,0c36.5-36.5,36.5-95.7,0-132.2L632.2,500z" />
                          </svg>
                        </span>
                      </span>
                    );
                  })}
                </span>
              )}
              <input
                className="search-input"
                type="search"
                placeholder="Search"
                value={store.similarToArtistsSearchText}
                onChange={(e) => {
                  store.similarToArtistsSearchText = e.target.value;
                }}
              />
              {!!store.similarToArtistsSearchText && (
                <div className="search-items">
                  {data.artists
                    .filter(
                      (artist) =>
                        artist.a
                          .toLowerCase()
                          .includes(
                            store.similarToArtistsSearchText.toLowerCase()
                          ) && !store.similarToArtists[artist.a]
                    )
                    .slice(0, 5)
                    .map((artist) => (
                      <span
                        className="search-item"
                        onClick={(e) => {
                          store.similarToArtistsSearchText = "";
                          store.toggleSimilarArtist(artist.a);
                        }}
                      >
                        {artist.a}
                      </span>
                    ))}
                </div>
              )}
            </span>
            <span className="filters-group">
              <span>Show decade(s):</span>
              <span>
                {["≤ 70s", "80s", "90s"].map((decade) => (
                  <span
                    key={decade}
                    className={
                      "decade" + (store.shownDecades[decade] ? " active" : "")
                    }
                    onClick={() => {
                      store.toggleDecade(decade);
                    }}
                  >
                    {decade}
                  </span>
                ))}
                <br />
                {["00s", "10s", "20s"].map((decade) => (
                  <span
                    key={decade}
                    className={
                      "decade" + (store.shownDecades[decade] ? " active" : "")
                    }
                    onClick={() => {
                      store.toggleDecade(decade);
                    }}
                  >
                    {decade}
                  </span>
                ))}
              </span>
            </span>
            <span className="filters-group">
              <span>Show tag(s):</span>
              {Object.keys(store.shownTags).length > 0 && (
                <span style={{ marginLeft: "8px" }}>
                  {Object.keys(store.shownTags).map((ti) => {
                    const tagIndex = parseInt(ti);
                    const tagName = data.tags[tagIndex];
                    return (
                      <span className="tag filter-tag" key={ti}>
                        {tagName}
                        <span
                          className="hide-tag-btn"
                          onClick={(e) => {
                            store.toggleShownTag(ti);
                          }}
                        >
                          <svg
                            style={{
                              width: "11px",
                              height: "11px",
                              fill: "#fff6",
                            }}
                            viewBox="0 0 1000 1000"
                          >
                            <path d="M632.2,500l330.4-330.5c36.5-36.5,36.5-95.8,0-132.2c-36.4-36.5-95.7-36.5-132.2,0L500,367.8L169.6,37.4C133,0.9,73.9,0.9,37.4,37.4C0.9,73.8,0.9,133,37.4,169.6L367.9,500L37.4,830.4c-36.5,36.5-36.5,95.7,0,132.2c36.5,36.5,95.7,36.5,132.2,0L500,632.2l330.4,330.4c36.5,36.5,95.7,36.5,132.2,0c36.5-36.5,36.5-95.7,0-132.2L632.2,500z" />
                          </svg>
                        </span>
                      </span>
                    );
                  })}
                </span>
              )}
              <input
                className="search-input"
                type="search"
                placeholder="Search"
                value={store.shownTagsSearchText}
                onChange={(e) => {
                  store.shownTagsSearchText = e.target.value;
                }}
              />
              {!!store.shownTagsSearchText && (
                <div className="search-items">
                  {data.tags
                    .filter(
                      (tagName, tagIndex) =>
                        tagName
                          .toLowerCase()
                          .includes(store.shownTagsSearchText.toLowerCase()) &&
                        !store.shownTags[tagIndex]
                    )
                    .slice(0, 5)
                    .map((tagName) => (
                      <span
                        className="search-item"
                        onClick={(e) => {
                          store.shownTagsSearchText = "";
                          store.toggleShownTag(data.tags.indexOf(tagName));
                        }}
                      >
                        {tagName}
                      </span>
                    ))}
                </div>
              )}
            </span>
            <span className="filters-group">
              <span>Hide tag(s):</span>
              {Object.keys(store.hiddenTags).length > 0 && (
                <span style={{ marginLeft: "8px" }}>
                  {Object.keys(store.hiddenTags).map((ti) => {
                    const tagIndex = parseInt(ti);
                    const tagName = data.tags[tagIndex];
                    return (
                      <span className="tag filter-tag" key={ti}>
                        {tagName}
                        <span
                          title="Unhide tag"
                          className="hide-tag-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            delete store.hiddenTags[ti];
                            localStorage.setItem(
                              "hiddenTags",
                              JSON.stringify(store.hiddenTags)
                            );
                            store.refreshFilters();
                          }}
                        >
                          <svg
                            style={{
                              width: "11px",
                              height: "11px",
                              fill: "#fff6",
                            }}
                            viewBox="0 0 1000 1000"
                          >
                            <path d="M632.2,500l330.4-330.5c36.5-36.5,36.5-95.8,0-132.2c-36.4-36.5-95.7-36.5-132.2,0L500,367.8L169.6,37.4C133,0.9,73.9,0.9,37.4,37.4C0.9,73.8,0.9,133,37.4,169.6L367.9,500L37.4,830.4c-36.5,36.5-36.5,95.7,0,132.2c36.5,36.5,95.7,36.5,132.2,0L500,632.2l330.4,330.4c36.5,36.5,95.7,36.5,132.2,0c36.5-36.5,36.5-95.7,0-132.2L632.2,500z" />
                          </svg>
                        </span>
                      </span>
                    );
                  })}
                </span>
              )}
              <input
                className="search-input"
                type="search"
                placeholder="Search"
                value={store.hiddenTagsSearchText}
                onChange={(e) => {
                  store.hiddenTagsSearchText = e.target.value;
                }}
              />
              {!!store.hiddenTagsSearchText && (
                <div className="search-items">
                  {data.tags
                    .filter(
                      (tagName, tagIndex) =>
                        tagName
                          .toLowerCase()
                          .includes(store.hiddenTagsSearchText.toLowerCase()) &&
                        !store.hiddenTags[tagIndex]
                    )
                    .slice(0, 5)
                    .map((tagName) => (
                      <span
                        className="search-item"
                        onClick={(e) => {
                          store.hiddenTagsSearchText = "";
                          store.toggleHiddenTag(data.tags.indexOf(tagName));
                        }}
                      >
                        {tagName}
                      </span>
                    ))}
                </div>
              )}

              {/*{Object.keys(store.hiddenTags).length === 0 && (*/}
              {/*  <span style={{ color: "#fff8" }}>(None)</span>*/}
              {/*)}*/}
            </span>
          </div>
          <div style={{ flexGrow: 1, display: "flex" }}>
            <Virtuoso
              style={{ flexBasis: "60%" }}
              totalCount={store.filteredArtists.length}
              itemContent={(index) => {
                return <Artist artist={store.filteredArtists[index]} />;
              }}
            >
              {" "}
            </Virtuoso>
            {!!(data.artists[store.playIndex] || {}).v && (
              <div className="player-wrap" style={{ flexBasis: "40%" }}>
                <YouTube
                  videoId={data.artists[store.playIndex].v}
                  className="player"
                  iframeClassName="player-iframe"
                  opts={{ playerVars: { autoplay: 1 } }}
                  onReady={(e) => {
                    store.currentPlayer = e.target;
                  }}
                  onPlay={() => {
                    store.isPlaying = true;
                  }}
                  onPause={() => {
                    store.isPlaying = false;
                  }}
                  onEnd={() => {
                    store.playArtist(store.findNextIndex(store.playIndex));
                  }}
                />
                <div style={{ paddingTop: "18px", textAlign: "center" }}>
                  <div
                    style={{
                      color: "#00c700",
                      display: "inline-flex",
                      width: "auto",
                      verticalAlign: "middle",
                      cursor: "pointer",
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      window.open(
                        "http://www.youtube.com/results?search_query=" +
                          encodeURIComponent(data.artists[store.playIndex].a),
                        "_blank"
                      );
                    }}
                  >
                    <svg
                      style={{ width: "28px", marginRight: "13px" }}
                      viewBox="0 0 524 367"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M101 28C60.6832 28 28 60.6832 28 101V266C28 306.317 60.6832 339 101 339H423C463.317 339 496 306.317 496 266V101C496 60.6832 463.317 28 423 28H101ZM0 101C0 45.2192 45.2192 0 101 0H423C478.781 0 524 45.2192 524 101V266C524 321.781 478.781 367 423 367H101C45.2192 367 0 321.781 0 266V101ZM207 103.593L358.929 184L207 264.407V103.593ZM235 150.091V217.909L299.071 184L235 150.091Z"
                        fill="#009300aa"
                      />
                    </svg>
                    <span style={{ borderBottom: "1px solid #00930077" }}>
                      Play more{" "}
                      <span style={{ fontStyle: "italic" }}>
                        {data.artists[store.playIndex].a}
                      </span>{" "}
                      on YouTube
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/*<ul style={{ marginTop: "38px" }}>*/}
          {/*  {data.artists.map((d, index) => {*/}
          {/*    const diff = Math.abs(index - playIndex);*/}
          {/*    return (*/}
          {/*      <li*/}
          {/*        key={d.a}*/}
          {/*        className={*/}
          {/*          (playIndex === index ? "playing" : "") +*/}
          {/*          " " +*/}
          {/*          (diff < 7 ? "distant-" + diff : "") +*/}
          {/*          " " +*/}
          {/*          (diff >= 7 ? "too-distant" : "")*/}
          {/*        }*/}
          {/*        onClick={() => {*/}
          {/*          if (index !== playIndex) {*/}
          {/*            playAudio(index);*/}
          {/*          } else {*/}
          {/*            if (currentAudio && currentAudio.paused) {*/}
          {/*              currentAudio.play();*/}
          {/*            } else {*/}
          {/*              currentAudio.pause();*/}
          {/*            }*/}
          {/*          }*/}
          {/*        }}*/}
          {/*      ></li>*/}
          {/*    );*/}
          {/*  })}*/}
          {/*</ul>*/}
        </div>
      )}
      {store.tab === "saved" && (
        <div className="section">
          <div className="filters">
            <div style={{ padding: "0 24px" }}>
              This list is saved in your browser storage (no login involved).
            </div>
          </div>
          <Virtuoso
            style={{ flexGrow: 1 }}
            totalCount={Object.keys(store.savedArtists).length}
            itemContent={(index) => {
              let artist =
                data.artists.filter(
                  (art) => Object.keys(store.savedArtists)[index] === art.a
                )[0] || {};
              return (
                <div className="playlist-item">
                  <div
                    className={"save-btn"}
                    style={{ background: "transparent" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      delete store.savedArtists[artist.a];
                      localStorage.setItem(
                        "savedArtists",
                        JSON.stringify(store.savedArtists)
                      );
                    }}
                  >
                    UNSAVE
                  </div>
                  <div
                    className={"save-btn"}
                    style={{ background: "#d50000", width: "130px" }}
                    onClick={(e) => {
                      e.preventDefault();
                      window.open(
                        "http://www.youtube.com/results?search_query=" +
                          encodeURIComponent(artist.a),
                        "_blank"
                      );
                    }}
                  >
                    <svg
                      style={{
                        width: "20px",
                        fill: "#fff",
                        pointerEvents: "none",
                        marginRight: "8px",
                      }}
                      focusable="false"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z"></path>
                    </svg>
                    YOUTUBE
                  </div>
                  <div className="author">
                    <span className="rank">#{index + 1}</span>
                    {artist.a}
                  </div>
                  <div className="tags">
                    {artist?.t &&
                      artist.t.map((t) => (
                        <span className="tag" key={t}>
                          {data.tags[t]}
                        </span>
                      ))}
                  </div>
                </div>
              );
            }}
          >
            {" "}
          </Virtuoso>
        </div>
      )}
      {store.showIntro && (
        <div
          className="modal-bg"
          onClick={() => {
            store.showIntro = false;
            localStorage.setItem("skipIntro", "true");
          }}
        >
          <div
            className="modal"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            This web page helps discover new music quickly. We list 40.000
            artists sorted by popularity and let you listen to one track per
            artist. You can filter by decade, exclude tags, save the artists
            that sound interesting and check their YouTube for more tracks.
            <div className="start-btn-wrap">
              <div
                className="start-btn"
                onClick={() => {
                  store.showIntro = false;
                  localStorage.setItem("skipIntro", "true");
                  store.playArtist(0);
                }}
              >
                START
                <svg
                  style={{
                    width: "20px",
                    fill: "#fff",
                    pointerEvents: "none",
                    verticalAlign: "middle",
                    marginLeft: "8px",
                    position: "relative",
                    top: "-1px",
                  }}
                  focusable="false"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

export default App;

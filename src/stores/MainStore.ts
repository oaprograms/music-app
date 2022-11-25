import { makeAutoObservable, configure } from "mobx";
import axios from "axios";

configure({
  enforceActions: "never",
});

export type artist_t = {
  a: string; // artist name
  s: string; // track name
  t: number[]; // tags
  y: number | null; // year
  v: string; // track youtube video id
};

export type artist_ext_t = artist_t & {
  rank: number;
  indexInPlaylist: number;
  decade: decade_t | null;
  decade_i: number | null;
  tags: string[];
};

type artist_filters_base_t = {
  similarTo: string[];
  tags: string[];
  excludeTags: string[];
  decades: [number, number];
  popularity: [number, number]; // 0-99 (high-low)
};

const DEFAULT_FILTERS: artist_filters_base_t = {
  similarTo: [],
  tags: [],
  excludeTags: [],
  decades: [0, 5],
  popularity: [0, 99],
};

type decade_t = "≤ 70s" | "80s" | "90s" | "00s" | "10s" | "20s";

type get_artists_res = { totalResults: number; results_page: artist_ext_t[] };

type MainStoreData_t = {
  tab: "LISTEN" | "SAVED";
  navActiveOnMobile: boolean;
  expandPlayerOnMobile: boolean;
  screenWidth: number;
  screenHeight: number;
  doneInitialLoading: boolean;
  decadeOptions: { value: number; label: string }[];
};

class MainStore {
  constructor() {
    makeAutoObservable(this);
  }

  data: MainStoreData_t = {
    tab: "LISTEN",
    navActiveOnMobile: window.innerWidth <= 1000,
    expandPlayerOnMobile: false,
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    doneInitialLoading: true, // fixme
    decadeOptions: [
      { value: 0, label: "≤ 70s" },
      { value: 1, label: "80s" },
      { value: 2, label: "90s" },
      { value: 3, label: "00s" },
      { value: 4, label: "10s" },
      { value: 5, label: "20s" },
    ],
  };

  savedArtists_v2: artist_ext_t[] = [];
  listenedArtists: { [artistName: string]: true } = {};

  filters_v1: artist_filters_base_t = DEFAULT_FILTERS;
  decades_filter_temp: [number, number] = [0, 5];
  popularity_filter_temp: [number, number] = [0, 99];
  similarTo_filter_options: string[] = [];
  tags_filter_options: string[] = [];
  excludeTags_filter_options: string[] = [];

  playlist:
    | {
        state: "LOADED";
        artists: (artist_ext_t | null)[];
        loadedPages: { [pageNum: number]: true };
        scrollPosition: { startIndex: number; endIndex: number };
        autoplay: boolean;
      }
    | { state: "LOADING" | "LOAD_ERROR" | "NOT_LOADED" } = {
    state: "NOT_LOADED",
  };

  currentArtist: artist_ext_t | null = null;
  currentPlayer: any = null;
  currentPlaylistVirtuoso: any = null;
  isPlaying: boolean = false;

  async searchFilters(
    type: "TAGS" | "ARTISTS",
    searchText: string
  ): Promise<string[]> {
    try {
      let res = await axios.post("https://lb.dioco.io/base_musicapp_search", {
        type,
        searchText,
      });
      return res.data;
    } catch (e) {
      return [];
    }
  }

  getPagesToLoad(): number[] {
    if (this.playlist.state !== "LOADED") {
      return this.playlist.state === "LOADING" ? [] : [0];
    }
    let pages: { [pageNum: number]: true } = {};
    const from1 = Math.floor(
      Math.max(0, (this.currentArtist?.indexInPlaylist || 0) - 100) / 200
    );
    const to1 = Math.floor(
      Math.min(
        (this.currentArtist?.indexInPlaylist || 0) + 100,
        this.playlist.artists.length - 1
      ) / 200
    );

    for (let i = from1; i <= to1; i++) {
      pages[i] = true;
    }

    const from2 = Math.floor(
      Math.max(0, this.playlist.scrollPosition.startIndex - 100) / 200
    );
    const to2 = Math.floor(
      Math.min(
        this.playlist.scrollPosition.endIndex + 100,
        this.playlist.artists.length - 1
      ) / 200
    );

    for (let i = from2; i <= to2; i++) {
      pages[i] = true;
    }
    const ret = Object.keys(pages)
      .map((k) => parseInt(k))
      .filter(
        (p) => this.playlist.state !== "LOADED" || !this.playlist.loadedPages[p]
      );

    if (ret.length) {
      console.log("debug: pagestoload", ret, this.playlist.state);
    }
    return ret;
  }

  filtersUpdated(): void {
    localStorage.setItem("filters_v1", JSON.stringify(this.filters_v1));
    this.playlist = { state: "NOT_LOADED" };
    this.reloadArtists();
  }

  reloadArtistsDebounceTimeout: any = null;
  reloadArtists(): void {
    clearTimeout(this.reloadArtistsDebounceTimeout);
    setTimeout(() => {
      this._loadArtistsIfNeeded();
    }, 300);
  }

  async _loadArtistsIfNeeded(): Promise<void> {
    const filters = JSON.stringify(this.filters_v1);
    for (let page of this.getPagesToLoad()) {
      if (
        filters === JSON.stringify(this.filters_v1) &&
        (this.playlist.state !== "LOADED" || !this.playlist.loadedPages[page])
      ) {
        if (this.playlist.state === "LOADED") {
          this.playlist.loadedPages[page] = true;
        }
        try {
          console.log("debug: loading page ", page);
          let res = await axios.post(
            "https://lb.dioco.io/base_musicapp_get_artists",
            {
              ...this.filters_v1,
              page,
            }
          );
          let data: get_artists_res = res.data;
          if (filters === JSON.stringify(this.filters_v1)) {
            this.addPage(data);
          }
        } catch (e) {
          // show notif.?
          if (this.playlist.state === "LOADED") {
            delete this.playlist.loadedPages[page];
          }
        }
      }
    }
  }

  addPage(data: get_artists_res): void {
    if (this.playlist.state !== "LOADED") {
      this.isPlaying = false;
      this.playlist = {
        state: "LOADED",
        artists: Array(data.totalResults).fill(null),
        loadedPages: {},
        scrollPosition: { startIndex: 0, endIndex: 100 },
        autoplay: false,
      };
      if (data.results_page[0]?.indexInPlaylist === 0) {
        this.currentArtist = data.results_page[0];
      }
    }
    for (let art of data.results_page) {
      this.playlist.artists[art.indexInPlaylist] = art;
    }
  }

  playArtist(
    artist: artist_ext_t | null,
    behavior: "SCROLL" | "NO_SCROLL"
  ): void {
    if (!artist) {
      this.currentPlayer?.pause();
      return;
    }
    if (this.playlist.state === "LOADED") {
      this.playlist.autoplay = true;
    }
    this.currentArtist = artist;
    if (behavior === "SCROLL") {
      this.currentPlaylistVirtuoso?.scrollToIndex({
        index: Math.max(0, (artist.indexInPlaylist || 0) - 3),
        align: "start",
        behavior: "smooth",
      });
    }
    if (!this.listenedArtists[artist.a]) {
      this.listenedArtists[artist.a] = true;
      localStorage.setItem(
        "listenedArtists",
        JSON.stringify(this.listenedArtists)
      );
    }
    // check if anything needs loading
    this.reloadArtists();
  }

  isSaved(artistName: string): boolean {
    return !!mainStore.savedArtists_v2.find((art) => art.a === artistName);
  }

  toggleSavedArtist(artist: artist_ext_t): void {
    if (!this.isSaved(artist.a)) {
      mainStore.savedArtists_v2.push({ ...artist });
    } else {
      mainStore.savedArtists_v2 = mainStore.savedArtists_v2.filter(
        (art) => art.a !== artist.a
      );
    }
    localStorage.setItem(
      "savedArtists_v2",
      JSON.stringify(mainStore.savedArtists_v2)
    );
  }

  getNextArtist(currentArtistName: string): artist_ext_t | null {
    let artists: (artist_ext_t | null)[] = [];
    if (this.data.tab === "LISTEN") {
      if (this.playlist.state === "LOADED") {
        artists = this.playlist.artists;
      }
    } else if (this.data.tab === "SAVED") {
      artists = this.savedArtists_v2;
    }
    const currentIndex =
      artists.findIndex((art) => art && art.a === currentArtistName) || 0;
    return artists[(currentIndex + 1) % artists.length] || null;
  }

  async init() {
    // update screen width for use in components
    window.addEventListener("resize", () => {
      this.data.screenWidth = window.innerWidth;
      this.data.screenHeight = window.innerHeight;
    });

    try {
      this.savedArtists_v2 = JSON.parse(
        localStorage.getItem("savedArtists_v2") || "[]"
      );
      this.listenedArtists = JSON.parse(
        localStorage.getItem("listenedArtists") || "{}"
      );
      this.filters_v1 = JSON.parse(
        localStorage.getItem("filters_v1") || JSON.stringify(DEFAULT_FILTERS)
      );
      this.decades_filter_temp = this.filters_v1.decades;
      this.popularity_filter_temp = this.filters_v1.popularity;
      this.reloadArtists();

      this.tags_filter_options = await this.searchFilters("TAGS", "");
      this.excludeTags_filter_options = this.tags_filter_options;
      this.similarTo_filter_options = await this.searchFilters("ARTISTS", "");
    } catch (e) {}
  }
}

const mainStore = new MainStore();
export default mainStore;

mainStore.init();

import * as React from "react";
import { observer } from "mobx-react-lite";
import { makeStyles } from "@mui/styles";
import { createTheme, Theme, ThemeProvider } from "@mui/material/styles";
import mainStore from "../stores/MainStore";
import { useEffect, useRef } from "react";
import clsx from "clsx";
import { Virtuoso } from "react-virtuoso";
import Artist from "./Artist";

const useStyles = makeStyles<Theme, {}>((theme) => ({}));

const Playlist = observer((props) => {
  const isMobile = mainStore.data.screenWidth <= 1000;
  const virtuoso = useRef<any>(null);

  useEffect(() => {
    mainStore.currentPlaylistVirtuoso = virtuoso?.current || null;
  }, [mainStore.data.tab, mainStore.playlist.state]);

  const classes = useStyles({});
  return (
    <>
      {mainStore.data.tab === "LISTEN" && (
        <>
          {mainStore.playlist.state === "NOT_LOADED" && <></>}
          {mainStore.playlist.state === "LOADING" && <>Loading...</>}
          {mainStore.playlist.state === "LOAD_ERROR" && (
            <>Error loading data.</>
          )}
          {mainStore.playlist.state === "LOADED" && (
            <Virtuoso
              id="virtuoso"
              ref={virtuoso}
              style={{ flexGrow: 1 }}
              totalCount={mainStore.playlist.artists.length}
              itemContent={(index) => {
                if (mainStore.playlist.state === "LOADED") {
                  return <Artist artist={mainStore.playlist.artists[index]} />;
                } else {
                  return <></>;
                }
              }}
              rangeChanged={(scrollPos) => {
                if (mainStore.playlist.state === "LOADED") {
                  mainStore.playlist.scrollPosition = scrollPos;
                  mainStore.reloadArtists();
                }
              }}
            >
              {" "}
            </Virtuoso>
          )}
        </>
      )}
      {mainStore.data.tab === "SAVED" && (
        <Virtuoso
          id="virtuoso"
          ref={virtuoso}
          style={{ flexGrow: 1 }}
          totalCount={mainStore.savedArtists_v2.length}
          itemContent={(index) => {
            return <Artist artist={mainStore.savedArtists_v2[index]} />;
          }}
        >
          {" "}
        </Virtuoso>
      )}
    </>
  );
});

export default Playlist;

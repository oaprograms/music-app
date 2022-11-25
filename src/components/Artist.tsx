import * as React from "react";
import { observer } from "mobx-react-lite";
import { makeStyles } from "@mui/styles";
import { createTheme, Theme, ThemeProvider } from "@mui/material/styles";
import mainStore, { artist_ext_t } from "../stores/MainStore";
import { useEffect } from "react";
import clsx from "clsx";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { IconButton } from "@mui/material";

const useStyles = makeStyles<Theme, {}>((theme) => ({
  playIcon: {
    visibility: "hidden",
  },
  artist: {
    display: "flex",
    width: "100%",
    padding: "0 12px",
    height: "50px",
    cursor: "pointer",
    borderBottom: "1px solid #0002",
    alignItems: "center",
    "&:hover": {
      backgroundColor: "#0000000a",
    },
    "&.active": {
      backgroundColor: "#adf4",
    },
    "&.active $playIcon": {
      visibility: "visible",
    },
  },
}));

type ArtistProps = {
  artist: artist_ext_t | null;
};

const Artist = observer((props: ArtistProps) => {
  const isMobile = mainStore.data.screenWidth <= 1000;
  const classes = useStyles({});

  if (mainStore.playlist.state !== "LOADED") {
    return <></>;
  }

  const artist = props.artist;

  const isSaved = artist ? mainStore.isSaved(artist.a) : false;

  return (
    <div
      className={clsx(
        classes.artist,
        artist !== null && artist.a === mainStore.currentArtist?.a && "active"
      )}
      onClick={() => {
        if (artist !== null) {
          if (artist.a !== mainStore.currentArtist?.a) {
            mainStore.playArtist(artist, "NO_SCROLL");
          } else {
            if (mainStore.isPlaying) {
              mainStore.currentPlayer?.pauseVideo();
            } else {
              mainStore.currentPlayer?.playVideo();
            }
          }
        }
      }}
    >
      {artist !== null && (
        <>
          <span
            className={classes.playIcon}
            style={{
              // opacity: 0.25,
              display: "flex",
              flexGrow: 0,
              flexShrink: 0,
              justifyContent: "center",
              alignItems: "center",
              marginRight: isMobile ? "8px" : "12px",
            }}
          >
            {artist.a === mainStore.currentArtist?.a && mainStore.isPlaying && (
              <PauseIcon color="primary" />
            )}
            {(artist.a !== mainStore.currentArtist?.a ||
              !mainStore.isPlaying) && <PlayArrowIcon color="primary" />}
          </span>
          <b style={{ fontWeight: 600 }}>{artist.a}</b>
          <div style={{ flexGrow: 1 }}> </div>
          {mainStore.listenedArtists[artist.a] && (
            <span
              style={{
                fontSize: "13px",
                color: "#0004",
                padding: "2px 7px",
              }}
            >
              PLAYED
            </span>
          )}
          {!isMobile && (
            <span
              style={{
                fontSize: "15px",
                color: "#0004",
                marginRight: "12px",
                display: "inline-block",
                minWidth: "60px",
                textAlign: "right",
              }}
            >
              #{artist.rank + 1}
            </span>
          )}
          {isMobile && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                mainStore.toggleSavedArtist(artist);
              }}
            >
              {!isSaved && <FavoriteBorderIcon fontSize="small" />}
              {isSaved && <FavoriteIcon fontSize="small" />}
            </IconButton>
          )}
        </>
      )}
    </div>
  );
});

export default Artist;

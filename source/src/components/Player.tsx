import * as React from "react";
import { observer } from "mobx-react-lite";
import { makeStyles } from "@mui/styles";
import { createTheme, Theme, ThemeProvider } from "@mui/material/styles";
import mainStore from "../stores/MainStore";
import YouTube from "react-youtube";
import YouTubeIcon from "@mui/icons-material/YouTube";
import { Button, createFilterOptions } from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import { useEffect } from "react";
import clsx from "clsx";

const useStyles = makeStyles<
  Theme,
  {
    isMobile: boolean;
    expandPlayerOnMobile: boolean;
    screenWidth: number;
    screenHeight: number;
  }
>((theme) => ({
  player: (props) => ({
    width: "100%",
    height: props.isMobile
      ? props.expandPlayerOnMobile
        ? props.screenHeight - 48 + "px"
        : Math.min(props.screenWidth, props.screenHeight) * 0.4 + "px"
      : "340px",
  }),
}));

const Player = observer((props) => {
  const isMobile = mainStore.data.screenWidth <= 1000;
  const expandPlayerOnMobile = mainStore.data.expandPlayerOnMobile;
  const classes = useStyles({
    isMobile,
    expandPlayerOnMobile,
    screenWidth: mainStore.data.screenWidth,
    screenHeight: mainStore.data.screenHeight,
  });
  const artist = mainStore.currentArtist;
  if (!artist) {
    return <></>;
  }
  return (
    <div style={{ width: "100%" }}>
      <YouTube
        videoId={artist.v}
        iframeClassName={classes.player}
        opts={{
          playerVars: {
            autoplay:
              mainStore.playlist.state === "LOADED" &&
              mainStore.playlist.autoplay
                ? 1
                : 0,
          },
        }}
        onReady={(e) => {
          mainStore.currentPlayer = e.target;
        }}
        onPlay={() => {
          mainStore.isPlaying = true;
        }}
        onPause={() => {
          mainStore.isPlaying = false;
        }}
        onEnd={() => {
          if (artist) {
            mainStore.playArtist(mainStore.getNextArtist(artist.a), "SCROLL");
          }
        }}
      />
      {!isMobile && (
        <div>
          <div
            style={{
              padding: "14px 8px  4px",
              textAlign: "center",
              opacity: 0.9,
            }}
          >
            {artist?.t && (
              <>
                <span style={{ marginRight: "8px" }}>Tags:</span>
                {artist.tags.join(", ")}
              </>
            )}
          </div>
          <div style={{ padding: "18px 8px 8px", textAlign: "center" }}>
            <Button
              variant="outlined"
              size="medium"
              style={{
                display: "inline-flex",
                width: "auto",
                verticalAlign: "middle",
                marginRight: "8px",
                marginBottom: "8px",
                minWidth: "128px",
              }}
              onClick={(e) => {
                e.preventDefault();
                if (artist) {
                  window.open(
                    "http://www.youtube.com/results?search_query=" +
                      encodeURIComponent(artist.a),
                    "_blank"
                  );
                }
              }}
            >
              <YouTubeIcon fontSize="small" style={{ marginRight: "10px" }} />
              <span>YouTube</span>
            </Button>
            <Button
              variant="outlined"
              size="medium"
              style={{
                // background: "#adf4",
                // color: "#000",
                marginRight: "8px",
                marginBottom: "8px",
              }}
              onClick={(e) => {
                mainStore.toggleSavedArtist(artist);
              }}
            >
              {!mainStore.isSaved(artist.a) && (
                <FavoriteBorderIcon
                  fontSize="small"
                  style={{ marginRight: "10px" }}
                />
              )}
              {mainStore.isSaved(artist.a) && (
                <FavoriteIcon
                  fontSize="small"
                  style={{ marginRight: "10px" }}
                />
              )}
              Save
            </Button>
            <Button
              variant="outlined"
              size="medium"
              style={{
                marginBottom: "8px",
              }}
              onClick={() => {
                if (artist) {
                  mainStore.playArtist(
                    mainStore.getNextArtist(artist.a),
                    "SCROLL"
                  );
                }
              }}
            >
              <SkipNextIcon />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});

export default Player;

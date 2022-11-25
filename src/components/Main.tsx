import * as React from "react";
import { observer } from "mobx-react-lite";
import { makeStyles } from "@mui/styles";
import { createTheme, Theme, ThemeProvider } from "@mui/material/styles";
import Drawer from "@mui/material/Drawer";
import mainStore from "../stores/MainStore";
import "./Main.scss";
import { useEffect } from "react";
import clsx from "clsx";
import { AppBar, Button, IconButton, Tab, Tabs, Toolbar } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import Filters from "./Filters";
import Playlist from "./Playlist";
import Player from "./Player";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import SkipNextIcon from "@mui/icons-material/SkipNext";

const useStyles = makeStyles<Theme, {}>((theme) => ({
  // appBar: {
  //   zIndex: theme.zIndex.drawer + 1,
  // },
  leftNavigation: (props) => ({
    flexShrink: 0,
    whiteSpace: "nowrap",
  }),
  leftNavigationOpen: (props) => ({
    width: "380px",
    maxWidth: "100%",
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
  rightNavigation: (props) => ({
    flexShrink: 0,
    whiteSpace: "nowrap",
  }),
  rightNavigationOpen: (props) => ({
    width: "calc(50vw - 175px)",
    maxWidth: "100%",
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: theme.spacing(0, 1),
    height: "48px",
    fontSize: "18px",
  },
}));
const Main = observer((props) => {
  useEffect(() => {}, []);
  const isMobile = mainStore.data.screenWidth <= 1000;

  const classes = useStyles({});
  return (
    <div>
      <AppBar position="fixed" color="inherit">
        <Toolbar
          variant="dense"
          className={classes.toolbar}
          style={{ paddingLeft: isMobile ? 0 : "380px" }}
        >
          {/*MENU ICON*/}
          {isMobile && (
            <IconButton
              onClick={() => {
                mainStore.data.navActiveOnMobile =
                  !mainStore.data.navActiveOnMobile;
              }}
              style={{ margin: "0 4px 0 8px" }}
            >
              <SearchIcon />
            </IconButton>
          )}
          {/*TABS (LISTEN, SAVED)*/}
          <Tabs
            value={mainStore.data.tab}
            onChange={(event: any, newTab: "LISTEN" | "SAVED") => {
              mainStore.data.tab = newTab;
              mainStore.data.expandPlayerOnMobile = false;
            }}
            aria-label="basic tabs example"
          >
            <Tab
              label={isMobile ? "Playlist" : "Current playlist"}
              value="LISTEN"
            />
            <Tab
              label={"Saved (" + mainStore.savedArtists_v2.length + ")"}
              value="SAVED"
            />
          </Tabs>
          <div style={{ flexGrow: 1 }}> </div>
          {isMobile && (
            <IconButton
              style={{ margin: "0 2px" }}
              onClick={() => {
                mainStore.data.expandPlayerOnMobile =
                  !mainStore.data.expandPlayerOnMobile;
              }}
            >
              {!mainStore.data.expandPlayerOnMobile && <FullscreenIcon />}
              {!!mainStore.data.expandPlayerOnMobile && <FullscreenExitIcon />}
            </IconButton>
          )}
          {isMobile && mainStore.currentArtist !== null && (
            <IconButton
              style={{ margin: "0 2px" }}
              onClick={() => {
                mainStore.playArtist(
                  mainStore.getNextArtist(mainStore.currentArtist?.a || ""),
                  "SCROLL"
                );
              }}
            >
              <SkipNextIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>
      <Drawer
        variant={!isMobile ? "permanent" : "temporary"}
        open={!isMobile || mainStore.data.navActiveOnMobile}
        onClose={() => {
          mainStore.data.navActiveOnMobile = false;
        }}
        className={clsx(classes.leftNavigation)}
        classes={{
          paper: clsx(classes.leftNavigationOpen),
        }}
      >
        <div
          style={{
            whiteSpace: "normal",
            width: "100%",
            textAlign: "center",
            padding: "0 20px",
          }}
        >
          <div
            style={{
              color: "#1976d2",
              padding: "14px 0 8px",
              fontSize: "20px",
            }}
          >
            <div style={{ fontWeight: 500 }}>
              Music Historian
              {isMobile && (
                <IconButton
                  size="medium"
                  color="primary"
                  style={{ position: "absolute", top: "8px", right: "6px" }}
                  onClick={() => (mainStore.data.navActiveOnMobile = false)}
                >
                  <ArrowForwardIosIcon />
                </IconButton>
              )}
            </div>
          </div>{" "}
          <div style={{ fontSize: "15px", fontWeight: 400 }}>
            Discover interesting music, new or old. <br />
            This tool lets you search and filter through last.fm's top 30.000
            artists of all time and play the top track for every artist.
          </div>
        </div>
        <div
          style={{
            color: "#1976d2",
            textAlign: "center",
            padding: "26px 0 12px",
            fontSize: "17px",
          }}
        >
          <SearchIcon
            color="primary"
            fontSize="small"
            style={{
              verticalAlign: "middle",
              marginRight: "8px",
              position: "relative",
              top: "-2px",
            }}
          />
          Search / Filter
        </div>
        <Filters />
        <div style={{ textAlign: "center", paddingBottom: "45px" }}>
          {isMobile && mainStore.data.screenWidth < 600 && (
            <Button
              variant="outlined"
              size="large"
              onClick={() => (mainStore.data.navActiveOnMobile = false)}
            >
              Search
              <ArrowForwardIosIcon
                style={{ marginLeft: "12px", marginRight: "-8px" }}
              />
            </Button>
          )}
        </div>
      </Drawer>
      <div
        style={{
          paddingLeft: isMobile ? 0 : "380px",
          paddingTop: "50px",
          display: "flex",
          height: "100vh",
          flexDirection: isMobile ? "column" : "row",
        }}
      >
        <div
          style={{
            height: "100%",
            width: isMobile ? "100%" : "50%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Playlist />
        </div>
        <div
          style={
            isMobile
              ? {
                  position: "absolute",
                  width: mainStore.data.expandPlayerOnMobile
                    ? mainStore.data.screenWidth
                    : Math.min(
                        mainStore.data.screenWidth,
                        mainStore.data.screenHeight
                      ) *
                        0.65 +
                      "px",
                  height: mainStore.data.expandPlayerOnMobile
                    ? mainStore.data.screenHeight - 48
                    : Math.min(
                        mainStore.data.screenWidth,
                        mainStore.data.screenHeight
                      ) *
                        0.4 +
                      "px",
                  bottom: mainStore.data.expandPlayerOnMobile ? 0 : "10px",
                  right: mainStore.data.expandPlayerOnMobile ? 0 : "10px",
                  display: "flex",
                  flexDirection: "column",
                }
              : {
                  width: "50%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  borderLeft: "1px solid #0002",
                  background: "#fff",
                }
          }
        >
          <Player />
        </div>
      </div>
    </div>
  );
});

export default Main;

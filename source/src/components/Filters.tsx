import * as React from "react";
import { observer } from "mobx-react-lite";
import { makeStyles } from "@mui/styles";
import { createTheme, Theme, ThemeProvider } from "@mui/material/styles";
import mainStore from "../stores/MainStore";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { Autocomplete, Slider, TextField } from "@mui/material";
import playlist from "./Playlist";

const useStyles = makeStyles<Theme, {}>((theme) => ({}));

const Filters = observer((props) => {
  const isMobile = mainStore.data.screenWidth <= 1000;
  const [searchTimeout, setSearchTimeout] = useState<any>(null);

  const classes = useStyles({});
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        padding: "0 24px 24px",
      }}
    >
      <div style={{ padding: "4px 0 8px" }}>
        <Autocomplete
          multiple
          onInputChange={(e: any, val: any) => {
            // debounce
            clearTimeout(searchTimeout);
            setSearchTimeout(
              setTimeout(() => {
                mainStore.searchFilters("ARTISTS", val).then((res) => {
                  mainStore.similarTo_filter_options = res;
                });
              }, 300)
            );
          }}
          filterOptions={(options) => options}
          options={mainStore.similarTo_filter_options}
          value={mainStore.filters_v1.similarTo}
          onChange={(e, valsArr: string[]) => {
            mainStore.filters_v1.similarTo = valsArr;
            mainStore.filtersUpdated();
          }}
          filterSelectedOptions
          renderInput={(params) => (
            <TextField
              {...params}
              label="Similar to Artist(s)"
              placeholder="Add artists"
            />
          )}
        />
      </div>
      <div style={{ padding: "8px 0 8px" }}>
        <Autocomplete
          multiple
          onInputChange={(e: any, val: any) => {
            // debounce
            clearTimeout(searchTimeout);
            setSearchTimeout(
              setTimeout(() => {
                mainStore.searchFilters("TAGS", val).then((res) => {
                  mainStore.tags_filter_options = res;
                });
              }, 300)
            );
          }}
          filterOptions={(options) => options}
          options={mainStore.tags_filter_options}
          value={mainStore.filters_v1.tags}
          onChange={(e, valsArr: string[]) => {
            mainStore.filters_v1.tags = valsArr;
            mainStore.filtersUpdated();
          }}
          filterSelectedOptions
          renderInput={(params) => (
            <TextField
              {...params}
              label="Genres / Tags"
              placeholder="Add tags"
            />
          )}
        />
      </div>
      <div style={{ padding: "8px 0 0" }}>
        <Autocomplete
          multiple
          onInputChange={(e: any, val: any) => {
            // debounce
            clearTimeout(searchTimeout);
            setSearchTimeout(
              setTimeout(() => {
                mainStore.searchFilters("TAGS", val).then((res) => {
                  mainStore.excludeTags_filter_options = res;
                });
              }, 300)
            );
          }}
          filterOptions={(options) => options}
          options={mainStore.excludeTags_filter_options}
          value={mainStore.filters_v1.excludeTags}
          onChange={(e, valsArr: string[]) => {
            mainStore.filters_v1.excludeTags = valsArr;
            mainStore.filtersUpdated();
          }}
          filterSelectedOptions
          renderInput={(params) => (
            <TextField
              {...params}
              label="Exclude Genres / Tags"
              placeholder="Add tags"
            />
          )}
        />
      </div>
      <div style={{ padding: "16px 16px 8px" }}>
        <div style={{ color: "#000a", marginBottom: "2px", fontSize: "15px" }}>
          Decade:
        </div>
        <Slider
          value={mainStore.decades_filter_temp}
          onChange={(e: any, val: any) => {
            mainStore.decades_filter_temp =
              val[0] > val[1] ? [val[1], val[0]] : [val[0], val[1]];
          }}
          onChangeCommitted={(e: any, val: any) => {
            mainStore.filters_v1.decades = mainStore.decades_filter_temp;
            mainStore.filtersUpdated();
          }}
          step={1}
          min={0}
          max={5}
          valueLabelDisplay="off"
          marks={mainStore.data.decadeOptions}
        />
      </div>
      <div style={{ padding: "0 16px 12px" }}>
        <div style={{ color: "#000a", marginBottom: "2px", fontSize: "15px" }}>
          Popularity:
        </div>
        <Slider
          value={mainStore.popularity_filter_temp}
          onChange={(e: any, val: any) => {
            mainStore.popularity_filter_temp =
              val[0] > val[1] ? [val[1], val[0]] : [val[0], val[1]];
          }}
          onChangeCommitted={(e: any, val: any) => {
            mainStore.filters_v1.popularity = mainStore.popularity_filter_temp;
            mainStore.filtersUpdated();
          }}
          step={1}
          min={0}
          max={99}
          valueLabelDisplay="auto"
          valueLabelFormat={(v) => 100 - v + "%"}
          marks={[
            { value: 0, label: "High" },
            { value: 9 },
            { value: 19 },
            { value: 29 },
            { value: 39 },
            { value: 49 },
            { value: 59 },
            { value: 69 },
            { value: 79 },
            { value: 89 },
            { value: 99, label: "Low" },
          ]}
        />
      </div>
    </div>
  );
});

export default Filters;

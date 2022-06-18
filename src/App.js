import "./App.css";
import data from "./data";
import React, { useEffect, useState } from "react";

let currentAudio;
let lastSeekIdentifier = 0;

function playAudio(index, setPlayIndex) {
  const a = new Audio("./cuts/" + data[index].f + ".mp3");
  const b = new Audio("./cuts/" + data[index + 1].f + ".mp3");
  if (currentAudio) {
    currentAudio.pause();
  }
  const lastS = Math.floor(Math.random());
  lastSeekIdentifier = lastS;
  currentAudio = a;
  setPlayIndex(index);
  localStorage.setItem("lastPlayIndex", index);
  currentAudio.addEventListener("ended", (event) => {
    if (lastS === lastSeekIdentifier) {
      playAudio(index + 1, setPlayIndex);
    }
  });
  currentAudio.play();
}

function App() {
  const [playIndex, setPlayIndex] = useState(-1);
  const [savedArtists, setSavedArtists] = useState({});
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    try {
      setSavedArtists(JSON.parse(localStorage.getItem("savedArtists") || "{}"));
      playAudio(
        parseInt(localStorage.getItem("lastPlayIndex") || "0"),
        setPlayIndex
      );
    } catch (e) {}

    setInterval(() => {
      setIsPlaying(currentAudio && !currentAudio.paused);
    }, 100);
  }, []);

  return (
    <div className="center">
      <header>
        <h1>Discover new music ten times faster.</h1>
        <p className="opaque" style={{ fontSize: "1.3em" }}>
          Listen to these 10-second clips and save the ones you find
          interesting.
        </p>
      </header>
      <div>
        <div className="section">
          <h2 className="opaque">Listen:</h2>
          <ul style={{ marginTop: "38px" }}>
            {data.map((d, index) => {
              const diff = Math.abs(index - playIndex);
              return (
                <li
                  className={
                    (playIndex === index ? "playing" : "") +
                    " " +
                    (diff < 7 ? "distant-" + diff : "") +
                    " " +
                    (diff >= 7 ? "too-distant" : "")
                  }
                  onClick={() => {
                    if (index !== playIndex) {
                      playAudio(index, setPlayIndex);
                    } else {
                      if (currentAudio && currentAudio.paused) {
                        currentAudio.play();
                      } else {
                        currentAudio.pause();
                      }
                    }
                  }}
                >
                  {playIndex === index && (
                    <span
                      style={{
                        position: "absolute",
                        top: "9px",
                        left: "6px",
                        opacity: 0.25,
                      }}
                    >
                      {isPlaying && (
                        <svg
                          style={{
                            width: "20px",
                            fill: "#fff",
                            pointerEvents: "none",
                          }}
                          focusable="false"
                          viewBox="0 0 122.88 122.88"
                        >
                          <path d="M61.44,0c16.97,0,32.33,6.88,43.44,18c11.12,11.12,18,26.48,18,43.44c0,16.97-6.88,32.33-18,43.44 c-11.12,11.12-26.48,18-43.44,18c-16.97,0-32.33-6.88-43.44-18C6.88,93.77,0,78.41,0,61.44C0,44.47,6.88,29.11,18,18 C29.11,6.88,44.47,0,61.44,0L61.44,0z M42.3,39.47h13.59v43.95l-13.59,0V39.47L42.3,39.47L42.3,39.47z M66.99,39.47h13.59v43.95 l-13.59,0V39.47L66.99,39.47L66.99,39.47z M97.42,25.46c-9.21-9.21-21.93-14.9-35.98-14.9c-14.05,0-26.78,5.7-35.98,14.9 c-9.21,9.21-14.9,21.93-14.9,35.98s5.7,26.78,14.9,35.98c9.21,9.21,21.93,14.9,35.98,14.9c14.05,0,26.78-5.7,35.98-14.9 c9.21-9.21,14.9-21.93,14.9-35.98S106.63,34.66,97.42,25.46L97.42,25.46z" />
                        </svg>
                      )}
                      {!isPlaying && (
                        <svg
                          style={{
                            width: "20px",
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
                  )}
                  <span className="author" title={d.a}>
                    {d.a}
                  </span>
                  <div
                    className={
                      "save-btn " + (savedArtists[d.a] ? "active" : "")
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!savedArtists[d.a]) {
                        savedArtists[d.a] = true;
                      } else {
                        delete savedArtists[d.a];
                      }
                      setSavedArtists({ ...savedArtists });
                      localStorage.setItem(
                        "savedArtists",
                        JSON.stringify(savedArtists)
                      );
                    }}
                  >
                    SAVE
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="section">
          <h2 className="opaque">Saved:</h2>
          <ul>
            {Object.keys(savedArtists).length > 0 &&
              Object.keys(savedArtists).map((a) => (
                <li
                  onClick={() => {
                    window.open(
                      "http://www.youtube.com/results?search_query=" +
                        encodeURIComponent(a),
                      "_blank"
                    );
                  }}
                >
                  <span
                    title={a}
                    style={{
                      textOverflow: "ellipsis",
                      width: "200px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      display: "inline-block",
                      verticalAlign: "middle",
                    }}
                  >
                    {a}
                  </span>
                  <div
                    className={"save-btn"}
                    onClick={(e) => {
                      e.stopPropagation();
                      delete savedArtists[a];
                      setSavedArtists({ ...savedArtists });
                      localStorage.setItem(
                        "savedArtists",
                        JSON.stringify(savedArtists)
                      );
                    }}
                  >
                    UNSAVE
                  </div>
                </li>
              ))}
            {!Object.keys(savedArtists).length && (
              <li style={{ color: "#fff6", textAlign: "center" }}>None</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;

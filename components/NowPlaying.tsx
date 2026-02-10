import React from "react";
import ReadmeImg from "./ReadmeImg";
import Text from "./Text";

export interface Props {
  cover?: string;
  track: string;
  artist: string;
  // for spotify
  // progress: number;
  // duration: number;
  isPlaying: boolean;
}

export const Player: React.FC<Props> = ({
  cover,
  track,
  artist,
  // progress,
  // duration,
  isPlaying,
}) => {
  return (
    <ReadmeImg width="540" height="64">
      <style>
        {`
            .paused { 
              animation-play-state: paused !important;
              background: #e1e4e8 !important;
            }

            img:not([src]) {
              content: url("data:image/gif;base64,R0lGODlhAQABAPAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==");
              background: #FFF;
              border: 1px solid #e1e4e8;
            }

            img {
              border-radius: 3px;
            }

            p {
              display: block;
              opacity: 0;
            }

            .visualizer {
              display: flex;
              align-items: center;
              gap: 3px;
              height: 20px;
              margin-left: 8px;
            }

            .visualizer-bar {
              width: 3px;
              height: 100%;
              background: linear-gradient(180deg, #4F9CF9 0%, #2563EB 100%);
              border-radius: 2px;
              transform-origin: center;
              animation: sound-wave 1.2s ease-in-out infinite;
            }

            .visualizer-bar:nth-child(1) { animation-delay: 0s; height: 40%; }
            .visualizer-bar:nth-child(2) { animation-delay: 0.1s; height: 60%; }
            .visualizer-bar:nth-child(3) { animation-delay: 0.2s; height: 80%; }
            .visualizer-bar:nth-child(4) { animation-delay: 0.3s; height: 100%; }
            .visualizer-bar:nth-child(5) { animation-delay: 0.4s; height: 70%; }
            .visualizer-bar:nth-child(6) { animation-delay: 0.5s; height: 50%; }
            .visualizer-bar:nth-child(7) { animation-delay: 0.6s; height: 90%; }
            .visualizer-bar:nth-child(8) { animation-delay: 0.7s; height: 75%; }
            .visualizer-bar:nth-child(9) { animation-delay: 0.8s; height: 60%; }
            .visualizer-bar:nth-child(10) { animation-delay: 0.9s; height: 85%; }
            
            .visualizer,
            #track,
            #artist,
            #cover {
              opacity: 0;
              animation: appear 300ms ease-out forwards;
            }

            #track {
              animation-delay: 400ms;
            }
            #artist {
              animation-delay: 500ms;
            }
            .visualizer {
              animation-delay: 550ms;
            }

            #cover {
              animation-name: cover-appear;
              animation-delay: 300ms;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 3px 10px rgba(0,0,0,0.05);
            }

            #cover:not([src]) {
              box-shadow: none;
            }

            @keyframes cover-appear {
              from {
                opacity: 0;
                transform: scale(0.8);
              }
              to {
                opacity: 1;
                transform: scale(1);
              }
            }

            @keyframes appear {
              from {
                opacity: 0;
                transform: translateX(-8px);
              }
              to {
                opacity: 1;
                transform: translateX(0);
              }
            }

            @keyframes sound-wave {
              0%, 100% {
                transform: scaleY(0.5);
                opacity: 0.7;
              }
              50% {
                transform: scaleY(1);
                opacity: 1;
              }
            }
        `}
      </style>
      <div
        className={isPlaying ? "disabled" : ""}
        style={{
          display: "flex",
          alignItems: "center",
          paddingTop: 8,
          paddingLeft: 4,
        }}
      >
        <Text style={{ width: '16px', marginRight: '16px' }} size="large" weight="bold">{ isPlaying ? '▶' : '' }</Text>
        <img id="cover" src={cover ?? null} width="48" height="48" />
        <div
          style={{
            display: "flex",
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            marginTop: -4,
            marginLeft: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              marginRight: 8,
            }}
          >
            <Text id="track" weight="bold">
              {`${track ?? ""} `.trim()}
            </Text>
            <Text id="artist" color={!track ? "gray" : undefined}>
              {artist || "Nothing playing..."}
            </Text>
          </div>
          {track && isPlaying && (
            <div className="visualizer">
              <div className="visualizer-bar"></div>
              <div className="visualizer-bar"></div>
              <div className="visualizer-bar"></div>
              <div className="visualizer-bar"></div>
              <div className="visualizer-bar"></div>
              <div className="visualizer-bar"></div>
              <div className="visualizer-bar"></div>
              <div className="visualizer-bar"></div>
              <div className="visualizer-bar"></div>
              <div className="visualizer-bar"></div>
            </div>
          )}
        </div>
      </div>
    </ReadmeImg>
  );
};

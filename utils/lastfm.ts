import fetch from "isomorphic-unfetch";
import { URLSearchParams } from 'url';

const {
  LASTFM_API_KEY: api_key,
  LASTFM_USERNAME: user,
} = process.env;

const BASE_URL = `http://ws.audioscrobbler.com/2.0/`;

interface Artist {
  name: string;
}

interface Image {
  url: string;
  height: number;
  width: number;
}

interface Album {
  images: Image[];
}

interface ExternalUrls {
  spotify: string;
}

export interface TrackItem {
  name: string;
  artists: Artist[];
  album: Album;
  external_urls: ExternalUrls;
  duration_ms?: number;
}

export interface NowPlayingResponse {
  is_playing?: boolean;
  progress_ms?: number;
  item?: TrackItem;
}

async function fetchLastFm(method: string, params: Record<string, string>) {
  const urlParams = new URLSearchParams({
    method,
    user: user || '',
    api_key: api_key || '',
    format: 'json',
    ...params
  });

  const response = await fetch(`${BASE_URL}?${urlParams.toString()}`);
  return response.json();
}

export async function nowPlaying(): Promise<NowPlayingResponse> {
  if (!user || !api_key) {
    console.error("Missing LASTFM_USERNAME or LASTFM_API_KEY");
    return {};
  }

  const data = await fetchLastFm('user.getrecenttracks', { limit: '1' });
  
  if (!data.recenttracks || !data.recenttracks.track || data.recenttracks.track.length === 0) {
    return {};
  }

  const track = data.recenttracks.track[0];
  const isPlaying = track['@attr']?.nowplaying === 'true';

  // Only return track data if currently playing
  // If not playing, return empty state to show placeholder
  if (!isPlaying) {
    return {
      is_playing: false
    };
  }

  // Get track duration from track.getinfo API
  let duration_ms = 0;
  try {
    const trackInfo = await fetchLastFm('track.getinfo', {
      track: track.name,
      artist: track.artist['#text']
    });
    if (trackInfo.track && trackInfo.track.duration) {
      // Last.fm returns duration in milliseconds
      duration_ms = parseInt(trackInfo.track.duration);
    }
  } catch (error) {
    console.error("Error fetching track info:", error);
  }

  // Map Last.fm data to match Spotify structure expected by the component
  return {
    is_playing: true,
    progress_ms: 0, // Last.fm doesn't provide real-time progress, animation will loop
    item: {
      name: track.name,
      artists: [{ name: track.artist['#text'] }],
      album: {
        images: track.image.map((img: any) => ({
          url: img['#text'],
          height: img.size === 'small' ? 64 : img.size === 'medium' ? 300 : 640, // Approximation
          width: img.size === 'small' ? 64 : img.size === 'medium' ? 300 : 640
        }))
      },
      external_urls: {
        spotify: track.url // Use Last.fm URL instead of Spotify URL
      },
      duration_ms
    }
  };
}

export async function topTrack({ index, timeRange = 'short_term' }: { index: number, timeRange?: 'long_term'|'medium_term'|'short_term' }): Promise<TrackItem | null> {
  if (!user || !api_key) {
      console.error("Missing LASTFM_USERNAME or LASTFM_API_KEY");
      return null;
  }
    
  // Map Spotify time_range to Last.fm period
  const periodMap: Record<string, string> = {
    'short_term': '3month', // Updated to 3month as per user data availability
    'medium_term': '6month',
    'long_term': 'overall'
  };
  
  const period = periodMap[timeRange] || 'overall';
  
  // Last.fm pages are 1-based, index is 0-based. 
  // But we want the specific rank.
  // user.gettoptracks returns a list. limit=1 and page=index+1 works to get the Nth track.
  const data = await fetchLastFm('user.gettoptracks', { 
    limit: '1', 
    page: `${index + 1}`,
    period
  });

  if (!data.toptracks || !data.toptracks.track || data.toptracks.track.length === 0) {
    return null;
  }

  const track = data.toptracks.track[0];

  // Get album cover from album.getinfo API for better quality cover art
  let albumImages = track.image.map((img: any) => ({
    url: img['#text'],
    height: img.size === 'small' ? 64 : img.size === 'medium' ? 300 : 640,
    width: img.size === 'small' ? 64 : img.size === 'medium' ? 300 : 640
  }));

  // Try to get album info for better cover art
  try {
    const albumInfo = await fetchLastFm('album.getinfo', {
      artist: track.artist.name,
      album: track.name // Try using track name first
    });

    // If album info is found, use its images
    if (albumInfo.album && albumInfo.album.image) {
      albumImages = albumInfo.album.image.map((img: any) => ({
        url: img['#text'],
        height: img.size === 'small' ? 64 : img.size === 'medium' ? 300 : 640,
        width: img.size === 'small' ? 64 : img.size === 'medium' ? 300 : 640
      }));
    }
  } catch (error) {
    // If album.getinfo fails, try with track.getinfo to get album name
    try {
      const trackInfo = await fetchLastFm('track.getinfo', {
        track: track.name,
        artist: track.artist.name
      });

      if (trackInfo.track && trackInfo.track.album) {
        const albumName = trackInfo.track.album.title;
        const albumInfoRetry = await fetchLastFm('album.getinfo', {
          artist: track.artist.name,
          album: albumName
        });

        if (albumInfoRetry.album && albumInfoRetry.album.image) {
          albumImages = albumInfoRetry.album.image.map((img: any) => ({
            url: img['#text'],
            height: img.size === 'small' ? 64 : img.size === 'medium' ? 300 : 640,
            width: img.size === 'small' ? 64 : img.size === 'medium' ? 300 : 640
          }));
        }
      }
    } catch (innerError) {
      console.error("Error fetching album info:", innerError);
      // Fall back to track images
    }
  }

  // Map Last.fm data to match Spotify structure expected by the component
  return {
    name: track.name,
    artists: [{ name: track.artist.name }],
    album: {
      images: albumImages
    },
    external_urls: {
      spotify: track.url
    }
  };
}

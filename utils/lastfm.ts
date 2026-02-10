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
  let albumImages: any[] = [];

  try {
    const trackInfo = await fetchLastFm('track.getinfo', {
      track: track.name,
      artist: track.artist['#text']
    });

    if (trackInfo.track) {
      // Get duration
      if (trackInfo.track.duration) {
        duration_ms = parseInt(trackInfo.track.duration);
      }

      // Get album images from track.getInfo (better quality)
      if (trackInfo.track.album && trackInfo.track.album.image) {
        albumImages = trackInfo.track.album.image.map((img: any) => ({
          url: img['#text'],
          height: img.size === 'small' ? 64 : img.size === 'medium' ? 300 : img.size === 'large' ? 500 : 640,
          width: img.size === 'small' ? 64 : img.size === 'medium' ? 300 : img.size === 'large' ? 500 : 640
        }));
      }
    }
  } catch (error) {
    console.error("Error fetching track info:", error);
  }

  // Fallback to track images if album images not available
  if (albumImages.length === 0) {
    albumImages = track.image.map((img: any) => ({
      url: img['#text'],
      height: img.size === 'small' ? 64 : img.size === 'medium' ? 300 : 640,
      width: img.size === 'small' ? 64 : img.size === 'medium' ? 300 : 640
    }));
  }

  // Map Last.fm data to match Spotify structure expected by the component
  return {
    is_playing: true,
    item: {
      name: track.name,
      artists: [{ name: track.artist['#text'] }],
      album: {
        images: albumImages
      },
      external_urls: {
        spotify: track.url // Use Last.fm URL instead of Spotify URL
      },
      duration_ms
    }
  };
}

export async function topTrack({ index, timeRange = '3month' }: { index: number, timeRange?: '3month'|'6month'|'12month' }): Promise<TrackItem | null> {
  if (!user || !api_key) {
      console.error("Missing LASTFM_USERNAME or LASTFM_API_KEY");
      return null;
  }
    
  // Use the provided timeRange directly as Last.fm period
  const period = timeRange;
  
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

  // Get album cover using track.getinfo API for better quality cover art
  let albumImages = track.image.map((img: any) => ({
    url: img['#text'],
    height: img.size === 'small' ? 64 : img.size === 'medium' ? 300 : 640,
    width: img.size === 'small' ? 64 : img.size === 'medium' ? 300 : 640
  }));

  // Try to get track info for better album cover art
  try {
    const trackInfo = await fetchLastFm('track.getinfo', {
      track: track.name,
      artist: track.artist.name
    });

    // If track info is found and has album images, use them
    if (trackInfo.track && trackInfo.track.album && trackInfo.track.album.image) {
      albumImages = trackInfo.track.album.image.map((img: any) => ({
        url: img['#text'],
        height: img.size === 'small' ? 64 : img.size === 'medium' ? 300 : img.size === 'large' ? 500 : 640,
        width: img.size === 'small' ? 64 : img.size === 'medium' ? 300 : img.size === 'large' ? 500 : 640
      }));
    }
  } catch (error) {
    // If track.getinfo fails, try album.getinfo as fallback
    try {
      const albumInfo = await fetchLastFm('album.getinfo', {
        artist: track.artist.name,
        album: track.name
      });

      if (albumInfo.album && albumInfo.album.image) {
        albumImages = albumInfo.album.image.map((img: any) => ({
          url: img['#text'],
          height: img.size === 'small' ? 64 : img.size === 'medium' ? 300 : img.size === 'large' ? 500 : 640,
          width: img.size === 'small' ? 64 : img.size === 'medium' ? 300 : img.size === 'large' ? 500 : 640
        }));
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

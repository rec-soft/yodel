"use strict";

import { Request } from "@hapi/hapi";
import { SpotifyWebApi } from "spotify-web-api-ts";
import {
    Artist,
    Playlist,
    Track,
} from "spotify-web-api-ts/types/types/SpotifyObjects";

interface ArtistInfo {
    id: String;
    name: String;
    // Null if genres aren't fetched yet.
    genres?: String[];
}

interface TrackInfo {
    id: String;
    name: String;
    artists: ArtistInfo[];
    year: Number;
}

// interface Round {
//     previewUrl: String;
//     answerId: String;
//     TrackInfos: TrackInfo[];
// }

// Wrap route handler with spotify client in a closure.
export function playFactory(
    spotify: SpotifyWebApi
): (request: Request) => Promise<TrackInfo[]> {
    return async function (request: Request): Promise<TrackInfo[]> {
        const userId: string = request.params.userId;
        console.log("Getting playlists for userId:", userId);

        const { items } = await spotify.playlists.getUserPlaylists(userId);
        const playlists: Array<Playlist> = await Promise.all(
            items.map(async function (p): Promise<Playlist> {
                console.log("Getting playlist with id:", p.id);
                return await spotify.playlists.getPlaylist(p.id);
            })
        );
        // Only gets the first 100 tracks of a playlist.
        // TODO: get all of them instead.
        const tracks: Array<Track> = [];
        playlists.forEach(function (p) {
            p.tracks.items.forEach((i) => {
                if ((i.track as Track).preview_url) {
                    tracks.push(i.track as Track);
                }
            });
        });

        return await Promise.all(
            tracks.map(async function (track: Track): Promise<TrackInfo> {
                const TrackInfo: TrackInfo = {
                    id: track.id,
                    name: track.name,
                    year: new Date(track.album.release_date).getFullYear(),
                    artists: track.artists.map(function (artist): ArtistInfo {
                        return {
                            id: artist.id,
                            name: artist.name,
                        };
                    }),
                };
                return TrackInfo;
            })
        );
    };
}

export function getGenresFactory(
    spotify: SpotifyWebApi
): (request: Request) => Promise<String[]> {
    return async function (request: Request): Promise<String[]> {
        // Treat this as one string since that's what the Spotify API needs.
        const artistIds: string = request.params.artistIds;
        console.log("Getting genres for artistIds:", artistIds);

        // Aggregate all genres across each artist for the track.
        const genres: String[] = [];
        // TODO: fix this with respect to rate limiting.
        // await Promise.all(track.artists.map(async function (artist): Promise<Artist> {
        //     try {
        //         const details: Artist = await spotify.artists.getArtists(artist.id);
        //         genres.push(...details.genres);
        //         return details;
        //     }
        //     catch(e) {
        //         console.log(e);
        //         return await spotify.artists.getArtist(artist.id);
        //     }
        // }));
        return genres;
    };
}

// function pickTrack(tracks: Track[]): Track {
//     const track: Track = tracks[Math.floor(Math.random() * tracks.length)];
//     return track;
// }

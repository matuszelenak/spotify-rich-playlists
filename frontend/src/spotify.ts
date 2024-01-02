import _ from "lodash"
import {sdk} from "./api";
import {AudioFeatures, PlaylistedTrack, Track, UserProfile} from "@spotify/web-api-ts-sdk";
import {TrackRow} from "./types";

const getPlaylistTracks = async (playlist_id: string | undefined, user: UserProfile | undefined): Promise<[Array<TrackRow>, boolean]> => {
    if (!(playlist_id && user)) return [[], false]

    const playlist = await sdk.playlists.getPlaylist(playlist_id)

    const tracks = []
    let offset = 0
    let page = null
    do {
        page = await sdk.playlists.getPlaylistItems(playlist_id, undefined, undefined, 50, offset)
        tracks.push(...page.items)
        offset += page.total
    } while (page.next)

    const track_ids = tracks.map(track_data => track_data.track.id)

    const featuresData: AudioFeatures[] = []
    for (const idChunk of _.chunk(track_ids, 100)) {
        featuresData.push(...await sdk.tracks.audioFeatures(track_ids))
    }

    return [
        _.zip(tracks, featuresData).map(
            (value, index) => {
                // @ts-ignore
                const [pTrack, features]: [PlaylistedTrack, AudioFeatures] = value
                // @ts-ignore
                const track: Track = pTrack.track
                return {
                    index: index + 1,
                    name: track.name,
                    artists: track.artists.map(artist => artist.name).join(', '),
                    album: track.album.name,
                    duration: track.duration_ms,
                    previewUrl: track.preview_url,
                    tempoData: {
                        extracted: null,
                        spotify: features.tempo,
                        manual: null
                    },
                    trackUri: track.uri,
                    ...features
                }
            }
        ),
        playlist.owner.id == user.id
    ]
}

export {getPlaylistTracks}
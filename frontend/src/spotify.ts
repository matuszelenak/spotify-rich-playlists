import _ from "lodash"
import { AudioFeatures, PlaylistedTrack, SpotifyApi, Track, UserProfile } from "@spotify/web-api-ts-sdk";
import { TrackRow } from "./types";


export const enrichTrackData = async (api: SpotifyApi, tracks: Track[]): Promise<Array<TrackRow>> => {
    const track_ids = tracks.map(track_data => track_data.id)

    const featuresData: AudioFeatures[] = []
    for (const idChunk of _.chunk(track_ids, 100)) {
        featuresData.push(...await api.tracks.audioFeatures(idChunk))
    }

    return _.zip(tracks, featuresData).map(
        (value, index) => {
            // @ts-ignore
            const [track, features]: [Track, AudioFeatures] = value
            return {
                index: index + 1,
                name: track.name,
                artists: track.artists.map(artist => artist.name).join(', '),
                album: track.album.name,
                duration: track.duration_ms,
                previewUrl: track.preview_url,
                ourBpm: null,
                trackUri: track.uri,
                albumUrl: track.album.images[0].url,
                ...features
            }
        }
    )
}

const getPlaylistTracks = async (api: SpotifyApi, playlist_id: string | undefined, user: UserProfile | undefined): Promise<[Array<TrackRow>, boolean]> => {
    if (!(playlist_id && user)) return [[], false]

    const playlist = await api.playlists.getPlaylist(playlist_id)

    const tracks: Track[] = []
    let offset = 0
    let page = null
    do {
        page = await api.playlists.getPlaylistItems(playlist_id, undefined, undefined, 50, offset)
        // @ts-ignore
        tracks.push(...page.items.map(t => t.track))
        offset += 50
    } while (page.next)

    return [
        await enrichTrackData(api, tracks),
        playlist.owner.id == user.id
    ]
}

export { getPlaylistTracks }

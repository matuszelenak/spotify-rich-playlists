import _ from "lodash"
import {sdk} from "./api";
import {AudioFeatures, Track} from "@spotify/web-api-ts-sdk";

const getPlaylistTracks = async (playlist_id: string) => {
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

    return _.map(
        _.zip(tracks, featuresData),
        ([{track}, features]: [{track: Track}, AudioFeatures], index) => {
            return {
                index: index + 1,
                name: track.name,
                artists: track.artists.map(artist => artist.name).join(', '),
                album: track.album.name,
                duration: track.duration_ms,
                previewUrl: track.preview_url,
                ourBpm: null,
                ...features
            }
        }
    )
}

export {getPlaylistTracks}
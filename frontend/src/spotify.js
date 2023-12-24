import _ from "lodash"
import {axiosSpotify} from "./api";


const getPlaylistTracks = async (playlist_id) => {
    const {data: tracks_data} = await axiosSpotify({
        method: 'GET',
        url: `playlists/${playlist_id}`
    })

    const tracks = tracks_data.tracks.items
    const track_ids = tracks.map(track_data => track_data.track.id).join(',')

    const {data: features_data} = await axiosSpotify({
        method: 'GET',
        url: `audio-features/?ids=${track_ids}`
    })

    const res = _.map(
        _.zip(tracks, features_data.audio_features),
        ([{track}, features], index) => {
            //console.log(track)
            return {
                index: index + 1,
                id: track.id,
                name: track.name,
                artists: track.artists.map(a => a.name).join(', '),
                album: track.album.name,
                duration: track.duration_ms,
                previewUrl: track.preview_url,
                ourBpm: 'N/A',
                ...features
            }
        }
    )
    return res
}

export {getPlaylistTracks}
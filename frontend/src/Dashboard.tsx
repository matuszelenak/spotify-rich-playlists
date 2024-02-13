import { useMutation, useQuery } from "react-query";
import React, { useState } from "react";
import {
    DataGridPro,
    GridCellParams,
    GridRowOrderChangeParams,
    GridToolbarColumnsButton,
    GridToolbarContainer,
    GridToolbarDensitySelector,
    GridToolbarFilterButton
} from "@mui/x-data-grid-pro";
import { getPlaylistTracks } from "./spotify";
import { useNavigate, useParams } from "react-router-dom";
import { axiosBackend, queryClient, useSpotifyApi } from "./api";
import useWebSocket from "react-use-websocket";
import BpmGraph from "./components/bpmGraph";
import { Delete, Refresh } from "@mui/icons-material";
import { TrackRow } from "./types";
import move from "./utils";
import { MenuItemDef, SongContextMenu } from "./components/SongContextMenu";
import { defaultColumns } from "./components/DefaultColumns";


const Dashboard = () => {
    let {playlistId} = useParams<string>()
    const navigate = useNavigate()

    const [sdk, token] = useSpotifyApi()

    const [isLoading, setIsLoading] = useState(false)
    const [tracks, setTracks] = useState<TrackRow[]>([])
    const [selected, setSelected] = useState<TrackRow[]>([])
    const [isEditable, setIsEditable] = useState(false)

    const {isSuccess: userFetched, data: user} = useQuery(
        ['user', token],
        async () => await sdk.currentUser.profile()
    )

    const {isSuccess: playlistsFetched, data: playlists} = useQuery(
        ['playlists', token],
        async () => (await sdk.currentUser.playlists.playlists(50)).items,
        {
            onSuccess: (items) => {
                if (playlistId == null) {
                    navigate(`/${items[0].id}`)
                }
            }
        }
    )

    const columns = [...defaultColumns]
    const songMenuActions: MenuItemDef[] = [
        {
            label: 'Add to playlist',
            action: () => {
            },
            items: playlists?.filter(p => p.owner.id == user?.id).map(p => ({
                label: p.name,
                action: async () => {
                    await sdk.playlists.addItemsToPlaylist(p.id, selected.map(track => track.trackUri))
                },
                items: []
            })) || []
        },
        {
            'label': 'Add to queue',
            action: async () => {
                for (const track of selected) {
                    await sdk.player.addItemToPlaybackQueue(track.trackUri);
                    await queryClient.invalidateQueries(['queue', token])
                }
            },
            items: []
        }
    ]

    if (isEditable) {
        columns.push({
            field: 'trackUri',
            headerName: '',
            renderCell: (params: GridCellParams<TrackRow, string>) => !!params.value && (
                // @ts-ignore
                <Delete sx={{cursor: 'pointer'}} onClick={async () => {
                    setIsLoading(true)
                    await sdk.playlists.removeItemsFromPlaylist(
                        playlistId || "",
                        {tracks: [{uri: params.value || ""}]}
                    )
                    setTracks(tracks.filter((track) => track.trackUri != params.value))
                    setIsLoading(false)
                }}/>
            ) || <></>,
        })
        songMenuActions.push({
            label: 'Delete', items: [], action: async () => {
                setIsLoading(true)
                const selectedUris = selected.map(track => track.trackUri)
                await sdk.playlists.removeItemsFromPlaylist(playlistId || "", {tracks: selectedUris.map(uri => ({uri: uri}))})
                setTracks(tracks.filter((track) => !selectedUris.includes(track.trackUri)))
                setIsLoading(false)
            }
        })
    }

    const {sendJsonMessage} = useWebSocket(import.meta.env.VITE_WS_LINK, {
        share: true,
        shouldReconnect: (closeEvent) => true,
        onMessage: (event) => {
            const messageJson = JSON.parse(event.data)
            if (messageJson.event == 'tempoExtracted') {
                setTracks(tracks => tracks.map(item => !!messageJson.data[item.id] ? {
                    ...item,
                    ourBpm: messageJson.data[item.id]
                } : item));
            }
        }
    });

    useQuery(
        ['playlistTracks', playlistId, token],
        () => getPlaylistTracks(sdk, playlistId, user),
        {
            enabled: !!playlistId && userFetched,
            onSuccess: ([tracksData, isEditable]) => {
                setIsEditable(isEditable)
                setTracks(tracksData)
                setIsLoading(false)
                sendJsonMessage(
                    {
                        event: 'extractTempo',
                        data: Object.fromEntries(
                            tracksData.map((track: any) => [track.id, track.previewUrl])
                        )
                    }
                )

            }
        }
    )
    const {mutate: spotifyReorder} = useMutation(
        async (data: any) => {
            await sdk.playlists.movePlaylistItems(playlistId || "", data.range_start, data.range_length, data.insert_before)
        }
    )

    const {mutate: overrideBpm} = useMutation(
        (data: any) =>
            axiosBackend({
                method: 'post',
                url: `/songs/${data.id}/bpm`,
                data: data
            }),
        {onSuccess: () => setIsLoading(false)}
    )

    const handleRowOrderChange = async (params: GridRowOrderChangeParams) => {
        if (params.oldIndex === params.targetIndex) return;
        setIsLoading(true)
        await spotifyReorder({
            range_start: params.oldIndex,
            insert_before: params.oldIndex < params.targetIndex ? params.targetIndex + 1 : params.targetIndex,
            range_length: 1
        })
        setTracks(
            move(tracks, params.oldIndex, params.targetIndex).map((track: TrackRow, index: number) => ({
                ...track,
                index: index + 1
            }))
        )
        setIsLoading(false)
    };

    const GridToolbar = () => {
        return (
            <GridToolbarContainer>
                <GridToolbarColumnsButton/>
                <GridToolbarFilterButton/>
                <GridToolbarDensitySelector/>
                <Refresh onClick={async () => {
                    setIsLoading(true);
                    await queryClient.invalidateQueries(['playlistTracks', playlistId])
                }} sx={{cursor: "pointer"}}/>
            </GridToolbarContainer>
        );
    }

    return (
        <div style={{height: 400, width: '100%'}}>
            <BpmGraph tracks={tracks}/>
            <SongContextMenu items={songMenuActions}>
                <DataGridPro
                    loading={isLoading}
                    autoHeight
                    rows={tracks}
                    columns={columns}
                    rowReordering={isEditable}
                    onRowOrderChange={handleRowOrderChange}
                    processRowUpdate={(updatedRow, originalRow) => {
                        setIsLoading(true)
                        overrideBpm(updatedRow)
                        return updatedRow
                    }
                    }
                    disableColumnFilter
                    slots={{
                        toolbar: GridToolbar
                    }}
                    onRowSelectionModelChange={(selectedIds) => {
                        const s = tracks.filter(t => selectedIds.includes(t.id))
                        setSelected(s)
                    }}
                />
            </SongContextMenu>
        </div>
    )
}

export default Dashboard

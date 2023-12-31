import {AppBar, Container, Drawer, IconButton, Menu, MenuItem, Tab, Tabs, Toolbar, Typography} from "@mui/material";
import {useMutation, useQuery} from "react-query";
import React, {useState} from "react";
import {GridColDef} from '@mui/x-data-grid';
import {
    DataGridPro,
    GridCellParams,
    GridRowOrderChangeParams,
    GridToolbarColumnsButton,
    GridToolbarContainer,
    GridToolbarDensitySelector,
    GridToolbarFilterButton
} from "@mui/x-data-grid-pro";
import {getPlaylistTracks} from "./spotify";
import {NavLink, useNavigate, useParams} from "react-router-dom";
import {axiosBackend, useSpotifyApi, queryClient} from "./api";
import useWebSocket from "react-use-websocket";
import MenuIcon from '@mui/icons-material/Menu';
import BpmGraph from "./components/bpmGraph";
import {Delete, Refresh} from "@mui/icons-material";
import {TrackRow} from "./types";
import NestedMenuItem from "./components/NestedMenuItem";
import move from "./utils";

function LinkTab(props: any) {
    return (
        <Tab
            component="a"
            aria-current={props.selected && 'page'}
            {...props}
        />
    );
}

const defaultColumns: GridColDef[] = [
    {field: 'index', headerName: '#', width: 50},
    {field: 'tempo', headerName: 'BPM', editable: false, width: 50, valueGetter: (p) => p.value.toFixed(0)},
    {field: 'ourBpm', headerName: 'BPM', editable: false, width: 50},
    {
        field: 'duration',
        headerName: 'Duration',
        width: 75,
        valueGetter: (params) => {
            let minutes = Math.floor(params.value / 60000);
            let seconds = ((params.value % 60000) / 1000).toFixed(0);
            return `${minutes}:${seconds.padStart(2, '0')}`;
        }
    },
    {field: 'energy', headerName: 'Energy', width: 75},
    {
        field: 'previewUrl',
        headerName: 'Preview',
        renderCell: (params: GridCellParams) => !!params.value && (
            // @ts-ignore
            <audio controls src={params.value} preload="none"></audio>
        ) || <></>,
        width: 135
    },
    {field: 'name', headerName: 'Name', flex: 0.15},
    {field: 'artists', headerName: 'Artist', flex: 0.1},
    {field: 'album', headerName: 'Album', flex: 0.1}
];

const Dashboard = () => {
    let {playlistId} = useParams<string>()
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
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

    const [contextMenu, setContextMenu] = useState<{mouseX: number; mouseY: number;} | null>(null);

    const handleContextMenu = (event: React.MouseEvent) => {
        event.preventDefault();
        setContextMenu(
            contextMenu === null
                ? {
                    mouseX: event.clientX + 2,
                    mouseY: event.clientY - 6,
                } : null,
        );
    };

    const handleClose = () => {
        setContextMenu(null);
    };

    const columns = [...defaultColumns]

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
    }

    const {sendJsonMessage} = useWebSocket(import.meta.env.VITE_WS_LINK, {
        share: true,
        shouldReconnect: (closeEvent) => true,
        onMessage: (event) => {
            const messageJson = JSON.parse(event.data)
            if (messageJson.event == 'tempoExtracted') {
                setTracks(tracks => tracks.map(item => !!messageJson.data[item.id] ? {...item, ourBpm: messageJson.data[item.id]} : item));
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
            move(tracks, params.oldIndex, params.targetIndex).map((track: TrackRow, index: number) => ({...track, index: index + 1}))
        )
        setIsLoading(false)
    };

    const GridToolbar = () => {
        return (
            <GridToolbarContainer>
                <GridToolbarColumnsButton />
                <GridToolbarFilterButton />
                <GridToolbarDensitySelector />
                <Refresh onClick={() => { setIsLoading(true); queryClient.invalidateQueries(['playlistTracks', playlistId]) }}  sx={{cursor: "pointer"}}/>
            </GridToolbarContainer>
        );
    }

    return (
        <div>
            <AppBar position="static">
                <Toolbar>
                    <IconButton
                        edge="start"
                        color="inherit"
                        aria-label="menu"
                        onClick={() => setIsDrawerOpen(true)}
                    >
                        <MenuIcon/>
                    </IconButton>
                    <Typography variant="h6">{playlistsFetched && playlists.filter((i: any) => i.id == playlistId)[0].name}</Typography>

                    <Drawer open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} style={{width: "240px"}}>
                        <Tabs
                            orientation="vertical"
                            value={playlistId}
                            aria-label="nav tabs example"
                            role="navigation"
                        >
                            {playlistsFetched && playlists.map((playlist: any) => (
                                <LinkTab
                                    onClick={() => setIsDrawerOpen(false)}
                                    value={playlist.id} label={playlist.name.substring(0, 30)}
                                    to={`/${playlist.id}`}
                                    component={NavLink}
                                    key={playlist.id}
                                />
                            ))}
                        </Tabs>
                    </Drawer>
                </Toolbar>
            </AppBar>
            <Container maxWidth={false}>
                <Menu
                    open={contextMenu !== null}
                    onClose={handleClose}
                    anchorReference="anchorPosition"
                    anchorPosition={
                        contextMenu !== null
                            ? {top: contextMenu.mouseY, left: contextMenu.mouseX}
                            : undefined
                    }
                >
                    <MenuItem onClick={async () => {
                        handleClose()
                        setIsLoading(true)
                        const selectedUris = selected.map(track => track.trackUri)
                        await sdk.playlists.removeItemsFromPlaylist(playlistId || "", {tracks: selectedUris.map(uri => ({uri: uri}))})
                        setTracks(tracks.filter((track) => !selectedUris.includes(track.trackUri)))
                        setIsLoading(false)
                    }}>Delete</MenuItem>
                    <NestedMenuItem parentMenuOpen={!!contextMenu} label={"Add to playlist"}>
                        {playlists?.filter(p => p.owner.id == user?.id).map(p => (
                            <MenuItem key={p.id} onClick={async () => {
                                await sdk.playlists.addItemsToPlaylist(p.id, selected.map(track => track.trackUri))
                            }}>
                                {p.name}
                            </MenuItem>
                        ))}
                    </NestedMenuItem>
                </Menu>
                <div style={{height: 400, width: '100%'}}>
                    <BpmGraph tracks={tracks}/>
                    <div onContextMenu={handleContextMenu}>
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
                    </div>
                </div>
            </Container>
        </div>
    );
}

export default Dashboard
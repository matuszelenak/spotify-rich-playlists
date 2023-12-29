import {AppBar, Container, Drawer, IconButton, Tab, Tabs, Toolbar, Typography} from "@mui/material";
import {useMutation, useQuery, useQueryClient} from "react-query";
import {useState} from "react";
import {GridColDef} from '@mui/x-data-grid';
import {DataGridPro, GridCellParams, GridRowOrderChangeParams, GridToolbar} from "@mui/x-data-grid-pro";
import {getPlaylistTracks} from "./spotify";
import {NavLink, useNavigate, useParams} from "react-router-dom";
import {axiosBackend, sdk} from "./api";
import useWebSocket from "react-use-websocket";
import MenuIcon from '@mui/icons-material/Menu';
import BpmGraph from "./components/bpmGraph";


const columns: GridColDef[] = [
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
            return `${minutes}:${seconds}`;
        }
    },
    {field: 'energy', headerName: 'Energy', width: 75},
    {field: 'name', headerName: 'Name', flex: 0.15},
    {field: 'artists', headerName: 'Artist', flex: 0.1},
    {field: 'album', headerName: 'Album', flex: 0.1},
    {
        field: 'previewUrl',
        headerName: 'Preview',
        renderCell: (params: GridCellParams) => !!params.value && (
            // @ts-ignore
            <audio controls src={params.value} preload="none"></audio>
        ) || <></>,
        width: 350
    }
];

function LinkTab(props: any) {
    return (
        <Tab
            component="a"
            aria-current={props.selected && 'page'}
            {...props}
        />
    );
}

const Dashboard = () => {
    const {playlistId} = useParams<string>()
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const navigate = useNavigate()

    const [isLoading, setIsLoading] = useState(true)
    const queryClient = useQueryClient()
    const [tracks, setTracks] = useState([])
    const {isSuccess: playlistsFetched, data: playlistsResponse} = useQuery(
        ['playlists'],
        async () => {
            return await sdk.currentUser.playlists.playlists(50)
        },
        {
            onSuccess: ({items}) => {
                if (playlistId == null) {
                    navigate(`/${items[0].id}`)
                }
            }
        }
    )

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
        ['playlistTracks', playlistId],
        () => getPlaylistTracks(playlistId),
        {
            enabled: !!playlistId,
            onSuccess: (data) => {
                setTracks(data)
                setIsLoading(false)
                sendJsonMessage(
                    {
                        event: 'extractTempo',
                        data: Object.fromEntries(
                            data.map((track: any) => [track.id, track.previewUrl])
                        )
                    }
                )

            }
        }
    )
    const {mutate: spotifyReorder} = useMutation(
        async (data: any) => {
            console.log(data)
            await sdk.playlists.movePlaylistItems(playlistId, data.range_start, data.range_length, data.insert_before)
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['playlistTracks', playlistId])
            }
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
    };

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
                    <Typography variant="h6">{playlistsFetched && playlistsResponse.items.filter((i: any) => i.id == playlistId)[0].name}</Typography>

                    <Drawer open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} style={{width: "240px"}}>
                        <Tabs
                            orientation="vertical"
                            value={playlistId}
                            aria-label="nav tabs example"
                            role="navigation"
                        >
                            {playlistsFetched && playlistsResponse.items.map((playlist: any) => (
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

                <div style={{height: 400, width: '100%'}}>
                    <BpmGraph tracks={tracks}/>
                    <DataGridPro
                        loading={isLoading}
                        autoHeight
                        rows={tracks}
                        columns={columns}
                        rowReordering
                        onRowOrderChange={handleRowOrderChange}
                        processRowUpdate={(updatedRow, originalRow) => {
                            setIsLoading(true)
                            overrideBpm(updatedRow)
                        }
                        }
                        onProcessRowUpdateError={(error) => console.log(error)}
                        disableColumnFilter
                        slots={{
                            toolbar: GridToolbar,
                        }}
                    />
                </div>
            </Container>
        </div>
    );
}

export default Dashboard
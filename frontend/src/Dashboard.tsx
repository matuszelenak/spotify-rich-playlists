import {Container, Drawer, List, ListItem, ListItemText} from "@mui/material";
import {useMutation, useQuery, useQueryClient} from "react-query";
import {useState} from "react";
import {GridColDef} from '@mui/x-data-grid';
import {DataGridPro, GridCellParams, GridRowOrderChangeParams} from "@mui/x-data-grid-pro";
import {Line} from "react-chartjs-2";
import {CategoryScale, Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, Title, Tooltip,} from 'chart.js';
import {getPlaylistTracks} from "./spotify";
import {NavLink, useNavigate, useParams} from "react-router-dom";
import {axiosBackend, axiosSpotify} from "./api";


const columns: GridColDef[] = [
    {field: 'index', headerName: '#', width: 50},
    {field: 'tempo', headerName: 'BPM', editable: true, width: 50, valueGetter: (p) => p.value.toFixed(0)},
    {field: 'ourBpm', headerName: 'BPM 2', editable: false, width: 50},
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
    {field: 'name', headerName: 'Name', flex: 0.15},
    {field: 'artists', headerName: 'Artist', flex: 0.1},
    {field: 'album', headerName: 'Album', flex: 0.1},
    {field: 'energy', headerName: 'Energy', width: 75},
    //{field: 'instrumentalness', headerName: 'Instrumentalness', width: 75},
    //{field: 'valence', headerName: 'Valence', width: 75},
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

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const options = {
    responsive: true,
    plugins: {
        legend: {
            position: 'top' as const,
        }
    },
};


const Dashboard = () => {
    const {playlistId} = useParams<string>()
    const navigate = useNavigate()

    const [isLoading, setIsLoading] = useState(true)
    const queryClient = useQueryClient()
    const [tracks, setTracks] = useState([])
    const {isSuccess: playlistsFetched, data: playlistsResponse} = useQuery(
        ['playlists'],
        () => axiosSpotify({
            method: 'get',
            url: `/me/playlists`
        }),
        {
            onSuccess: ({data}) => {
                if (playlistId == null) {
                    navigate(`/${data.items[0].id}`)
                }
            }
        }
    )

    useQuery(
        ['playlistTracks', playlistId],
        () => getPlaylistTracks(playlistId),
        {
            enabled: !!playlistId,
            onSuccess: (data) => {
                setTracks(data)
                setIsLoading(false)
                data.forEach((track: any) => {
                    axiosBackend({
                        url: `/songs/${track.id}/bpm`,
                        data: {preview_url: track.previewUrl},
                        method: 'post'
                    }).then(({data}) => {
                        //@ts-ignore
                        setTracks(tracks => tracks.map(item => item.id === track.id ? {...item, ourBpm: data.bpm || item.tempo} : item));
                    })
                })
            }
        }
    )

    const {mutate: spotifyReorder} = useMutation(
        (data: any) =>
            axiosSpotify({
                method: 'put',
                url: `/playlists/${playlistId}/tracks`,
                data: data
            }),
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
            insert_before: params.targetIndex,
            range_length: 1
        })
    };


    const bpmData = {
        labels: tracks.map((track: any) => track.index),
        datasets: [
            {
                label: 'BPM',
                // @ts-ignore
                data: tracks.map((track) => track.ourBpm || 0),
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
            },
            {
                label: 'Energy',
                // @ts-ignore
                data: tracks.map((track) => track.energy * 100),
                borderColor: 'rgb(53, 162, 235)',
                backgroundColor: 'rgba(53, 162, 235, 0.5)',
            }
        ]
    }

    return (
        <div style={{display: "flex"}}>
            <Drawer variant="permanent" style={{width: "240px"}}>
                <List>
                    {playlistsFetched && playlistsResponse.data.items.map((playlist: any) => (
                        <ListItem button key={playlist.id}>
                            <NavLink
                                to={`/${playlist.id}`}
                            >
                                <ListItemText primary={playlist.name.substring(0, 30)}/>
                            </NavLink>
                        </ListItem>
                    ))}
                </List>
            </Drawer>
            <Container maxWidth={false}>
                <Line options={options} data={bpmData} height={45}/>
                <div style={{height: 400, width: '100%'}}>
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
                    />
                </div>
            </Container>
        </div>
    );
}

export default Dashboard
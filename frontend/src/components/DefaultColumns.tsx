import { GridColDef } from "@mui/x-data-grid";
import { TrackRow } from "../types";
import { GridCellParams } from "@mui/x-data-grid-pro";
import { Box, Tooltip } from "@mui/material";
import React from "react";


export const defaultColumns: GridColDef<TrackRow>[] = [
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
    {
        field: 'name',
        headerName: 'Name',
        flex: 0.15,
        renderCell: (params) => <a href={`https://open.spotify.com/track/${params.row.id}`}>{params.value}</a>
    },
    {field: 'artists', headerName: 'Artist', flex: 0.1},
    {
        field: 'album', headerName: 'Album', flex: 0.1,
        renderCell: (params) => <Tooltip title={
            <Box
                component="img"
                sx={{
                    height: 500,
                    width: 500,
                    maxHeight: {xs: 200, md: 250},
                    maxWidth: {xs: 200, md: 250},
                }}
                alt="Album cover image"
                src={params.row.albumUrl}
            />
        }>{params.value}</Tooltip>
    }
];

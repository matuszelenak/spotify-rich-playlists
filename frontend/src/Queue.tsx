import BpmGraph from "./components/bpmGraph";
import { SongContextMenu } from "./components/SongContextMenu";
import { DataGridPro, GridToolbar } from "@mui/x-data-grid-pro";
import React, { useState } from "react";
import { axiosBackend, useSpotifyApi } from "./api";
import { useMutation, useQuery } from "react-query";
import { TrackRow } from "./types";
import { enrichTrackData } from "./spotify";
import useWebSocket from "react-use-websocket";
import { defaultColumns } from "./components/DefaultColumns";


export const Queue = () => {
    const [sdk, token] = useSpotifyApi()

    const [isLoading, setIsLoading] = useState(false)
    const [tracks, setTracks] = useState<TrackRow[]>([])
    const [selected, setSelected] = useState<TrackRow[]>([])

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
        ['queue', token],
        // @ts-ignore
        async () => enrichTrackData(sdk, (await sdk.player.getUsersQueue()).queue),
        {
            onSuccess: (tracksData) => {
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

    const {mutate: overrideBpm} = useMutation(
        (data: any) =>
            axiosBackend({
                method: 'post',
                url: `/songs/${data.id}/bpm`,
                data: data
            }),
        {onSuccess: () => setIsLoading(false)}
    )

    return (
        <div>
            <BpmGraph tracks={tracks}/>
            <SongContextMenu items={[]}>
                <DataGridPro
                    loading={isLoading}
                    autoHeight
                    rows={tracks || []}
                    columns={defaultColumns}
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
    );
}

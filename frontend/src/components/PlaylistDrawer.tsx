import { Divider, Drawer, Tab, Tabs } from "@mui/material";
import { NavLink, useParams } from "react-router-dom";
import React, { Dispatch, SetStateAction } from "react";
import { useQuery } from "react-query";
import { useSpotifyApi } from "../api";
import { SimplifiedPlaylist } from "@spotify/web-api-ts-sdk";

type DrawerProps = {
    isOpen: boolean
    setOpen: Dispatch<SetStateAction<boolean>>
    playlists: Array<SimplifiedPlaylist>
}

function LinkTab(props: any) {
    return (
        <Tab
            component="a"
            aria-current={props.selected && 'page'}
            {...props}
        />
    );
}

export const PlaylistDrawer = ({isOpen, setOpen, playlists}: DrawerProps) => {
    let {playlistId} = useParams<string>()

    return (
        <Drawer open={isOpen} onClose={() => setOpen(false)} style={{width: "240px"}}>
            <Tabs
                orientation="vertical"
                value={playlistId}
                aria-label="nav tabs example"
                role="navigation"
            >
                <LinkTab
                    onClick={() => setOpen(false)}
                    value='queue'
                    label={'Queue'}
                    to={`/queue`}
                    component={NavLink}
                    key='queue'
                />
                <Divider/>
                {playlists.map((playlist: any) => (
                    <LinkTab
                        onClick={() => setOpen(false)}
                        value={playlist.id} label={playlist.name.substring(0, 30)}
                        to={`/${playlist.id}`}
                        component={NavLink}
                        key={playlist.id}
                    />
                ))}
            </Tabs>
        </Drawer>
    )
}

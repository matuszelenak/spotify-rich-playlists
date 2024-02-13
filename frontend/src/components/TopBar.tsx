import { AppBar, Button, IconButton, Toolbar, Typography } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import React, { useState } from "react";
import { PlaylistDrawer } from "./PlaylistDrawer";
import { SimplifiedPlaylist } from "@spotify/web-api-ts-sdk";
import { useSpotifyApi } from "../api";
import { useQuery } from "react-query";
import { SkipNext } from "@mui/icons-material";


export const TopBar = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [sdk, token] = useSpotifyApi()
  const {data: playlists} = useQuery(
      ['playlists', token],
      async () => (await sdk.currentUser.playlists.playlists(50)).items
  )

  return (
    <>
      <PlaylistDrawer isOpen={isDrawerOpen} setOpen={setIsDrawerOpen} playlists={playlists || []}/>
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
          <Typography variant="h6">
            {/*{!!props.playlists && props.playlists.filter((i: any) => i.id == props.playlistId)[0].name}*/}
          </Typography>
          <img src="./public/spotify.svg" style={{maxHeight: 40}}/>
          <Button
            size="large"
            sx={{marginLeft: "25px", color: 'white', background: '#2ebd59', borderRadius: 8, maxHeight: 40}}
          >
            <h3>Get Spotify</h3>
          </Button>
        </Toolbar>
      </AppBar>
    </>
  )
}

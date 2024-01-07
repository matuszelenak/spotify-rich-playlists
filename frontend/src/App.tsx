import React from 'react';
import {Route, Routes} from 'react-router-dom'
import {QueryClientProvider} from 'react-query'
import SpotifyAuthCallback from "./AuthRedirect";
import Dashboard from "./Dashboard";
import {queryClient} from "./api";

function App() {

    return (
        <QueryClientProvider client={queryClient}>
            <Routes>
                <Route path="spotify-auth-callback" element={<SpotifyAuthCallback/>}/>
                <Route path=":playlistId?" element={
                    <Dashboard/>
                }/>
            </Routes>
        </QueryClientProvider>
    )
}

export default App;

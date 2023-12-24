import React, {useEffect} from 'react';
import {Route, Routes} from 'react-router-dom'
import {QueryClientProvider} from 'react-query'
import SpotifyAuthCallback, {RequireAuth} from "./AuthRedirect";
import Dashboard from "./Dashboard";
import {queryClient, setAuthHeader} from "./api";

// @ts-ignore


function App() {
    useEffect(() => {
        const token = localStorage.getItem('spotify_access_token');
        if (token) {
            setAuthHeader(token)
        } else {
        }
    }, []);

    return (
        <QueryClientProvider client={queryClient}>
            <Routes>
                <Route path="spotify-auth-callback" element={<SpotifyAuthCallback/>}/>
                <Route path=":playlistId?" element={
                    <RequireAuth>
                        <Dashboard/>
                    </RequireAuth>
                }/>
            </Routes>
        </QueryClientProvider>
    )
}

export default App;

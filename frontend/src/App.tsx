import React, {useEffect} from 'react';
import {Route, Routes, useNavigate} from 'react-router-dom'
import {QueryClientProvider} from 'react-query'
import SpotifyAuthCallback from "./AuthRedirect";
import Dashboard from "./Dashboard";
import {queryClient, sdk} from "./api";

// @ts-ignore
function App() {
    const navigate = useNavigate()

    useEffect(() => {
        async function fetchMyAPI() {
            await sdk.authenticate()
            navigate('/')
        }

        fetchMyAPI()
    }, [])

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

import React from 'react';
import { Route, Routes } from 'react-router-dom'
import { QueryClientProvider } from 'react-query'
import SpotifyAuthCallback from "./AuthRedirect";
import Dashboard from "./Dashboard";
import { queryClient } from "./api";
import { TopBar } from "./components/TopBar";
import { Footer } from "./components/Footer";
import { Queue } from "./Queue";

function App() {

    return (
        <QueryClientProvider client={queryClient}>
            <div>
                <TopBar/>
                <Routes>
                    <Route path="spotify-auth-callback" element={<SpotifyAuthCallback/>}/>
                    <Route path="queue" element={<Queue/>}/>
                    <Route path=":playlistId?" element={<Dashboard/>}/>
                </Routes>
                <Footer/>
            </div>
        </QueryClientProvider>
    )
}

export default App;

import {QueryClient} from "react-query";
import axios from "axios";
import {SpotifyApi} from '@spotify/web-api-ts-sdk';


export const sdk = SpotifyApi.withUserAuthorization(
    import.meta.env.VITE_SPOTIFY_CLIENT_ID,
    'http://localhost:3000/spotify-auth-callback',
    [
        "playlist-read-private",
        "playlist-read-collaborative",
        "playlist-modify-private",
        "playlist-modify-public",
        "user-read-email",
        'user-library-modify',
        'user-library-read'
    ]
);

export const axiosBackend = axios.create({
    // @ts-ignore
    baseURL: import.meta.env.VITE_API_LINK,
    headers: {
        'Content-Type': 'application/json'
    }
})

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: false
        },
    }
})

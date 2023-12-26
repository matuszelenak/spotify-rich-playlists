import {QueryCache, QueryClient} from "react-query";
import axios from "axios";

const scopes = [
    "playlist-read-private",
    "playlist-read-collaborative",
    "playlist-modify-private",
    "playlist-modify-public",
    "user-read-email",
    'user-library-modify',
    'user-library-read'
].join(',')

export const axiosBackend = axios.create({
    // @ts-ignore
    baseURL: import.meta.env.VITE_API_LINK,
    headers: {
        'Content-Type': 'application/json'
    }
})
export const axiosSpotify = axios.create({
    baseURL: 'https://api.spotify.com/v1/',
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
    },
    queryCache: new QueryCache({
        onError: async (error, query) => {
            // @ts-ignore
            if (error.request.status === 401) {
                const refreshToken = localStorage.getItem('spotify_refresh_token')
                if (!!refreshToken) {
                    const q = new URLSearchParams({
                        refresh_token: refreshToken
                    })
                    axiosBackend({
                        method: 'get',
                        url: `/refresh-token?${q.toString()}`
                    }).then(({data}) => {
                        localStorage.setItem('spotify_access_token', data.access_token)
                        setAuthHeader(data.access_token)
                        queryClient.refetchQueries(query.queryKey);
                    }).catch((error) => {
                        unsetToken()
                        triggerAuthorization()
                    })
                } else {
                    unsetToken()
                    triggerAuthorization()
                }
            }
        }
    })
})
export const setAuthHeader = (token: string) => {
    axiosBackend.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    axiosSpotify.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}
export const unsetToken = () => {
    delete axiosBackend.defaults.headers.common['Authorization'];
    delete axiosSpotify.defaults.headers.common['Authorization'];
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_refresh_token');
}
export const triggerAuthorization = () => {
    let url = new URL("https://accounts.spotify.com/authorize");
    let params = new URLSearchParams();
    params.append("client_id", "427d011a2a8047c3b1277d7bf14edd91");
    params.append("redirect_uri", `${window.location.protocol}//${window.location.host}/spotify-auth-callback`);
    params.append("scope", scopes)
    params.append("state", "4247")
    params.append("response_type", "code")

    url.search = params.toString();
    window.location.href = url.toString();
}
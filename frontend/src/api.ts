import {QueryClient} from "react-query";
import axios from "axios";
import {AccessToken, SpotifyApi} from '@spotify/web-api-ts-sdk';
import {Dispatch, SetStateAction, useMemo} from "react";
import type {SdkOptions} from "@spotify/web-api-ts-sdk/src/types";
import { useLocalStorage } from "@uidotdev/usehooks";


const scopes = [
    "playlist-read-private",
    "playlist-read-collaborative",
    "playlist-modify-private",
    "playlist-modify-public",
    "user-read-email",
    'user-library-modify',
    'user-library-read'
]


const useAccessToken = (): [AccessToken, Dispatch<SetStateAction<AccessToken | null>>] => {
    const [accessToken, setToken] = useLocalStorage<AccessToken | null>('spotify_access_token')
    //const [launchAuth, setLaunchAuth] = useState(false)

    return useMemo(() => {
        console.log('token')
        if (!accessToken) {
            return [triggerAuthorization(), setToken]
        }

        return [accessToken, setToken]
    }, [accessToken])
}

export const useSpotifyApi = (): [SpotifyApi, string] => {
   const [accessToken, setAccessToken   ] = useAccessToken()

    const options: SdkOptions = {
        errorHandler: {
            handleErrors: async (error: Error) => {
                if (error.message.includes('expired')) {
                    const q = new URLSearchParams({
                        refresh_token: accessToken.refresh_token
                    })
                    axiosBackend({
                        method: 'get',
                        url: `/refresh-token?${q.toString()}`
                    }).then(({data}) => {
                        const newToken = {...accessToken, ...data}
                        setAccessToken(newToken)
                        //localStorage.setItem('spotify_access_token', JSON.stringify(newToken))
                    }).catch((error) => {
                        setAccessToken(null)
                        //localStorage.removeItem('spotify_access_token')
                        triggerAuthorization()
                    })
                }
                return true
            }
        }
    }

    return useMemo(() => {
        const a = SpotifyApi.withAccessToken(
            import.meta.env.VITE_SPOTIFY_CLIENT_ID,
            accessToken,
            options
        )
        return [a, accessToken.access_token]
    }, [accessToken])
}

export const axiosBackend = axios.create({
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

export const triggerAuthorization = (): AccessToken => {
    let url = new URL("https://accounts.spotify.com/authorize");
    let params = new URLSearchParams();
    params.append("client_id", import.meta.env.VITE_SPOTIFY_CLIENT_ID);
    params.append("redirect_uri", `${window.location.protocol}//${window.location.host}/spotify-auth-callback`);
    params.append("scope", scopes.join(','))
    params.append("state", "4247")
    params.append("response_type", "code")

    url.search = params.toString();
    window.location.href = url.toString();

    return {access_token: "", refresh_token: "", expires: 0, token_type: "", expires_in: 0}
}
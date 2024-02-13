import {QueryClient} from "react-query";
import axios from "axios";
import {AccessToken, SpotifyApi} from '@spotify/web-api-ts-sdk';
import {Dispatch, SetStateAction, useMemo} from "react";
import { SdkConfiguration } from "@spotify/web-api-ts-sdk/src/types";
import { useLocalStorage } from "@uidotdev/usehooks";
import IAuthStrategy from "@spotify/web-api-ts-sdk/src/auth/IAuthStrategy";


const scopes = [
    "playlist-read-private",
    "playlist-read-collaborative",
    "playlist-modify-private",
    "playlist-modify-public",
    "user-read-email",
    'user-library-modify',
    'user-library-read',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing'
]


class ProvidedAccessTokenStrategy implements IAuthStrategy {
    constructor(
      protected accessToken: AccessToken,
      protected setAccessToken: Dispatch<SetStateAction<AccessToken | null>>
    ) {
    }

    public setConfiguration(configuration: SdkConfiguration): void {
    }

    public async getOrCreateAccessToken(): Promise<AccessToken> {
        if (this.accessToken.expires && this.accessToken.expires <= Date.now()) {
            const q = new URLSearchParams({
                refresh_token: this.accessToken.refresh_token
            })
            this.accessToken = await axiosBackend({
                method: 'get',
                url: `/refresh-token?${q.toString()}`
            }).then(({data}) => {
                const newToken = {
                    ...data,
                    expires: Date.now() + (data.expires_in * 1000)
                }
                this.setAccessToken(newToken)
                return newToken
            }).catch((error) => {
                this.setAccessToken(null)
                triggerAuthorization()
            })
            return this.accessToken
        }

        return this.accessToken;
    }

    public async getAccessToken(): Promise<AccessToken | null> {
        return this.accessToken;
    }

    public removeAccessToken(): void {
        this.setAccessToken(null)
    }
}



const useAccessToken = (): [AccessToken, Dispatch<SetStateAction<AccessToken | null>>] => {
    const [accessToken, setToken] = useLocalStorage<AccessToken | null>('spotify_access_token')
    //const [launchAuth, setLaunchAuth] = useState(false)

    return useMemo(() => {
        if (!accessToken) {
            return [triggerAuthorization(), setToken]
        }

        return [accessToken, setToken]
    }, [accessToken])
}

export const useSpotifyApi = (): [SpotifyApi, string] => {
   const [accessToken, setAccessToken   ] = useAccessToken()

    return useMemo(() => {
        const a = SpotifyApi.withAccessToken(
            import.meta.env.VITE_SPOTIFY_CLIENT_ID,
            accessToken
        )
        console.log('Constructing api')
        a.switchAuthenticationStrategy(new ProvidedAccessTokenStrategy(accessToken, setAccessToken))
        return [a, accessToken.access_token]
    }, [accessToken.access_token])
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

    localStorage.setItem('auth_attempt', '1')
    return {access_token: "", refresh_token: "", expires: 0, token_type: "", expires_in: 0}
}

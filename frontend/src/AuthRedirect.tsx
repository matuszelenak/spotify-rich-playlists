import {useLocation, useNavigate} from "react-router-dom";
import React from "react";
import {axiosBackend} from "./api";
import {useQuery} from "react-query";
import { AccessToken } from "@spotify/web-api-ts-sdk";


function useURLQuery() {
    const { search } = useLocation()
    return React.useMemo(() => new URLSearchParams(search), [search])
}


const SpotifyAuthCallback = () => {
    const navigate = useNavigate()
    const query = useURLQuery()
    const code = query.get('code')

    useQuery(
        ['auth_token'],
        () => axiosBackend({
            method: 'get',
            url: `/callback?code=${code}`
        }),
        {
            onSuccess: ({data}: {data: AccessToken}) => {
                localStorage.setItem('spotify_access_token', JSON.stringify({
                    ...data,
                    expires: Date.now() + (data.expires_in * 1000)
                }));
                navigate('/')
            }
        }
    )

    return (
        <></>
    )
}

export default SpotifyAuthCallback

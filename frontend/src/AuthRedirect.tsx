import {useLocation, useNavigate} from "react-router-dom";
import React from "react";
import {useQuery} from "react-query";
import {axiosBackend, setAuthHeader, triggerAuthorization} from "./api";

function useURLQuery() {
    const { search } = useLocation()
    return React.useMemo(() => new URLSearchParams(search), [search])
}

// @ts-ignore
export function RequireAuth({ children }) {
    const token = localStorage.getItem('spotify_access_token');

    if (token != null) {
        setAuthHeader(token)
        return children
    }

    triggerAuthorization()
}

const SpotifyAuthCallback = () => {
    const query = useURLQuery()
    const code = query.get('code')
    const navigate = useNavigate()

    useQuery(
        ['auth_token'],
        () => axiosBackend({
            method: 'get',
            url: `/callback?code=${code}`
        }),
        {
            onSuccess: ({data}) => {
                localStorage.setItem('spotify_access_token', data.spotify_access_token);
                setAuthHeader(data.spotify_access_token)
                navigate('/')
            }
        }
    )

    return (
        <></>
    )
}

export default SpotifyAuthCallback
import {useLocation, useNavigate} from "react-router-dom";
import React from "react";
import {axiosBackend} from "./api";
import {useQuery} from "react-query";


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
            onSuccess: ({data}) => {
                localStorage.setItem('spotify_access_token', JSON.stringify(data));
                navigate('/')
            }
        }
    )

    return (
        <></>
    )
}

export default SpotifyAuthCallback
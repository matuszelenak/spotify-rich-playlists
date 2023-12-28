import {useNavigate} from "react-router-dom";
import React, {useEffect} from "react";
import {sdk} from "./api";


const SpotifyAuthCallback = () => {
    const navigate = useNavigate()

    useEffect(() => {
        async function fetchMyAPI() {
            await sdk.authenticate()
            navigate('/')
        }

        fetchMyAPI()
    }, [])

    return (
        <></>
    )
}

export default SpotifyAuthCallback
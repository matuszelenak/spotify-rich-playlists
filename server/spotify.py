import base64

import requests

import constants
import models

basic_auth_token = base64.b64encode(
    f'{constants.client_id}:{constants.client_secret}'.encode("ascii")
).decode("ascii")


def get_access_token(code):
    resp = requests.post(
        'https://accounts.spotify.com/api/token',
        headers={
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': f'Basic {basic_auth_token}'
        },
        data={
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': f'{constants.frontend_url}/spotify-auth-callback'
        }
    )
    return resp


def get_access_token_refresh(token: models.SpotifyToken):
    resp = requests.post(
        'https://accounts.spotify.com/api/token',
        headers={
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': f'Basic {basic_auth_token}'
        },
        data={
            'grant_type': 'refresh_token',
            'refresh_token': token.refresh_token,
        }
    )
    return resp.json()

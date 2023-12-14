import base64

import requests

from server.constants import client_id, client_secret, frontend_url
from server.models import SpotifyToken

basic_auth_token = base64.b64encode(f'{client_id}:{client_secret}'.encode("ascii")).decode("ascii")


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
            'redirect_uri': f'{frontend_url}/spotify-auth-callback'
        }
    )
    return resp


def get_access_token_refresh(token: SpotifyToken):
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

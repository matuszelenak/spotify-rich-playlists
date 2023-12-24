from typing import Any
from urllib.parse import urlencode

import requests
from fastapi import FastAPI, Depends, Body, Request, HTTPException
from sqlalchemy.orm import Session
from starlette.middleware.cors import CORSMiddleware

import database
import spotify
import models
import constants

app = FastAPI()
origins = [
    "*",
    "http://localhost",
    "http://localhost:8080",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/callback")
async def spotify_callback(code: str, db: Session = Depends(database.get_db)):
    resp = spotify.get_access_token(code)
    token = models.SpotifyToken(
        **resp.json(),
    )
    db.add(token)
    db.commit()
    db.refresh(token)

    return {"spotify_access_token": token.access_token}


@app.get('/token-refresh')
async def spotify_refresh_token(request: Request, db: Session = Depends(database.get_db)):
    old_access_token = request.headers['Authorization'][7:]
    spotify_token = db.query(models.SpotifyToken).filter(models.SpotifyToken.access_token == old_access_token).first()
    if spotify_token is None:
        raise HTTPException(status_code=404, detail="Access token not found")

    updated_token = spotify.get_access_token_refresh(spotify_token)
    spotify_token.expires_in = updated_token['expires_in']
    spotify_token.access_token = updated_token['access_token']
    db.commit()
    db.refresh(spotify_token)

    return {"spotify_access_token": spotify_token.access_token}


# @app.post('/songs/{song_id}/bpm')
# async def override_song_bpm(song_id, payload: Any = Body(None), db: Session = Depends(database.get_db)):
#     existing = db.query(models.Song).filter(models.Song.id == song_id).first()
#     if existing:
#         existing.bpm = payload['tempo']
#         db.commit()
#     else:
#         override = models.Song(
#             id=song_id,
#             bpm=payload['tempo']
#         )
#         db.add(override)
#         db.commit()
#     return {}


@app.post('/songs/{song_id}/bpm')
async def get_song_bpm(song_id, payload: Any = Body(None), db: Session = Depends(database.get_db)):
    existing = db.query(models.SpotifySongBpm).filter(models.SpotifySongBpm.id == song_id).first()
    if existing:
        return {'bpm': existing.bpm}
    else:
        if not payload['preview_url']:
            return {'bpm': None}

        q = urlencode({'preview_url': payload['preview_url']})
        try:
            resp = requests.get(f'{constants.bpm_api_url}?{q}')
        except:
            return {'bpm': None}

        instance = models.SpotifySongBpm(
            id=song_id,
            bpm=resp.json()['bpm']
        )
        db.add(instance)
        db.commit()

        return {'bpm': instance.bpm}

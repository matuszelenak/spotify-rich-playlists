from sqlalchemy import Column, Integer, String, Float

import database


class Song(database.Base):
    __tablename__ = "songs"

    id = Column(String, primary_key=True, index=True)
    bpm = Column(Float)


class SpotifyToken(database.Base):
    __tablename__ = 'spotify_token'

    id = Column(Integer, primary_key=True, index=True)

    access_token = Column(String)
    token_type = Column(String)
    scope = Column(String)
    expires_in = Column(Integer)
    refresh_token = Column(String)

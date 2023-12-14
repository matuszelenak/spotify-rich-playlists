import os

client_id = os.environ.get('SPOTIFY_CLIENT_ID')
client_secret = os.environ.get('SPOTIFY_CLIENT_SECRET')
frontend_url = os.environ.get('FRONTEND_URL')

print(client_id)
print(client_secret)
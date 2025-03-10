from flask import Flask, redirect, request, session, render_template, url_for
import os
import spotipy
from spotipy.oauth2 import SpotifyOAuth
import time

app = Flask(__name__)
app.secret_key = os.urandom(24)

SPOTIFY_CLIENT_ID = '3baa3b2f48c14eb0b1ec3fb7b6c5b0db'
SPOTIFY_CLIENT_SECRET = '62f4ad9723464096864224831ed841b3'
SPOTIFY_REDIRECT_URI = 'https://test.ltpd.xyz/callback'

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login')
def login():
    sp_oauth = SpotifyOAuth(
        client_id=SPOTIFY_CLIENT_ID,
        client_secret=SPOTIFY_CLIENT_SECRET,
        redirect_uri=SPOTIFY_REDIRECT_URI,
        scope='user-library-read user-read-recently-played user-top-read'
    )
    auth_url = sp_oauth.get_authorize_url()
    return redirect(auth_url)

@app.route('/callback')
def callback():
    sp_oauth = SpotifyOAuth(
        client_id=SPOTIFY_CLIENT_ID,
        client_secret=SPOTIFY_CLIENT_SECRET,
        redirect_uri=SPOTIFY_REDIRECT_URI,
        scope='user-library-read user-read-recently-played user-top-read'
    )
    code = request.args.get('code')
    token_info = sp_oauth.get_access_token(code)
    session['token_info'] = token_info
    return redirect(url_for('total_listening_time'))

def get_spotify_client():
    token_info = session.get('token_info')
    if not token_info:
        return None

    now = int(time.time())
    if token_info['expires_at'] - now < 60:
        sp_oauth = SpotifyOAuth(
            client_id=SPOTIFY_CLIENT_ID,
            client_secret=SPOTIFY_CLIENT_SECRET,
            redirect_uri=SPOTIFY_REDIRECT_URI,
            scope='user-library-read user-read-recently-played user-top-read'
        )
        token_info = sp_oauth.refresh_access_token(token_info['refresh_token'])
        session['token_info'] = token_info

    return spotipy.Spotify(auth=token_info['access_token'])

@app.route('/total_listening_time')
def total_listening_time():
    sp = get_spotify_client()
    if not sp:
        return redirect(url_for('login'))

    total_ms = 0
    # Get recently played tracks
    results = sp.current_user_recently_played(limit=50)
    for item in results['items']:
        total_ms += item['track']['duration_ms']

    #Get top tracks
    top_tracks = sp.current_user_top_tracks(limit=50, time_range='long_term')
    for item in top_tracks['items']:
        total_ms += item['duration_ms']

    total_minutes = total_ms / (1000 * 60)
    return render_template('total_time.html', total_minutes=total_minutes)

@app.route('/logout')
def logout():
    session.pop('token_info', None)
    return redirect(url_for('index'))

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))

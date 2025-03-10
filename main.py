from flask import Flask, redirect, url_for, session, request, render_template
from flask_pymongo import PyMongo
from spotipy import Spotify
from spotipy.oauth2 import SpotifyOAuth
import os
import time
import threading

app = Flask(__name__)
app.secret_key = os.urandom(24)

# MongoDB configuration
app.config["MONGO_URI"] = "mongodb+srv://EFmTCpVa57UnGnG1:EFmTCpVa57UnGnG1@cluster0.iuxk8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
mongo = PyMongo(app)

# Spotify API credentials
SPOTIPY_CLIENT_ID = '3baa3b2f48c14eb0b1ec3fb7b6c5b0db'
SPOTIPY_CLIENT_SECRET = '62f4ad9723464096864224831ed841b3'
SPOTIPY_REDIRECT_URI = 'http://localhost:5000/callback'  # Change this to your actual redirect URI

sp_oauth = SpotifyOAuth(
    SPOTIPY_CLIENT_ID,
    SPOTIPY_CLIENT_SECRET,
    SPOTIPY_REDIRECT_URI,
    scope="user-read-private user-read-playback-state user-read-currently-playing"
)

def update_listening_time():
    while True:
        with app.app_context():
            token_info = session.get("token_info", None)
            if token_info:
                sp = Spotify(auth=token_info['access_token'])
                playback = sp.current_playback()
                if playback and playback['is_playing']:
                    track_id = playback['item']['id']
                    user_id = sp.current_user()['id']
                    user_data = mongo.db.users.find_one({"user_id": user_id})
                    if not user_data:
                        mongo.db.users.insert_one({"user_id": user_id, "total_minutes": 0})
                    else:
                        if 'last_track_id' in user_data and user_data['last_track_id'] != track_id:
                            track_duration_ms = playback['item']['duration_ms']
                            minutes_played = track_duration_ms // 60000
                            mongo.db.users.update_one(
                                {"user_id": user_id},
                                {"$inc": {"total_minutes": minutes_played}, "$set": {"last_track_id": track_id}}
                            )
            time.sleep(60)

threading.Thread(target=update_listening_time).start()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login')
def login():
    auth_url = sp_oauth.get_authorize_url()
    return redirect(auth_url)

@app.route('/callback')
def callback():
    session.clear()
    code = request.args.get('code')
    token_info = sp_oauth.get_access_token(code)
    session["token_info"] = token_info
    return redirect(url_for('stats'))

@app.route('/stats')
def stats():
    token_info = session.get("token_info", None)
    if not token_info:
        return redirect(url_for('login'))
    sp = Spotify(auth=token_info['access_token'])
    user_profile = sp.current_user()
    user_data = mongo.db.users.find_one({"user_id": user_profile['id']})
    total_minutes = user_data['total_minutes'] if user_data else 0
    return render_template('stats.html', user=user_profile, total_minutes=total_minutes)

if __name__ == '__main__':
    app.run(debug=True)
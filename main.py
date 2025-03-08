from flask import Flask, request, redirect, session, render_template, jsonify
import requests
import base64
from pymongo import MongoClient
from apscheduler.schedulers.background import BackgroundScheduler
import time

# Flask application initialization
app = Flask(__name__)
app.secret_key = "your_secret_key"

# MongoDB connection
client = MongoClient("mongodb+srv://EFmTCpVa57UnGnG1:EFmTCpVa57UnGnG1@cluster0.iuxk8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
db = client['spotify_data']
users_collection = db['users']

# Spotify API credentials
SPOTIFY_CLIENT_ID = "3baa3b2f48c14eb0b1ec3fb7b6c5b0db"
SPOTIFY_CLIENT_SECRET = "62f4ad9723464096864224831ed841b3"
REDIRECT_URI = "https://ltpd.xyz/callback"
AUTH_URL = "https://accounts.spotify.com/authorize"
TOKEN_URL = "https://accounts.spotify.com/api/token"
CURRENTLY_PLAYING_URL = "https://api.spotify.com/v1/me/player/currently-playing"

# Initialize the scheduler
scheduler = BackgroundScheduler()

def update_user_playback_time():
    """Fetch user’s currently playing track and update MongoDB"""
    for user in users_collection.find({}):  # Iterate over all users in the database
        spotify_id = user['spotify_id']
        access_token = user['access_token']
        
        headers = {"Authorization": f"Bearer {access_token}"}
        res = requests.get(CURRENTLY_PLAYING_URL, headers=headers)
        
        if res.status_code == 200:
            data = res.json()
            if data.get("is_playing"):  # Check if a track is currently playing
                track_duration = data["item"]["duration_ms"] / 60000  # Convert to minutes
                progress = data["progress_ms"] / 60000  # Convert progress to minutes
                total_minutes = user.get('total_minutes', 0) + (track_duration - progress)
                
                # Update the total minutes in MongoDB
                users_collection.update_one(
                    {"spotify_id": spotify_id},
                    {"$set": {"total_minutes": total_minutes}},
                    upsert=True
                )
                print(f"Updated total minutes for {spotify_id}: {total_minutes}")

# Add a job to run every minute to fetch and update user's listening data
scheduler.add_job(update_user_playback_time, 'interval', minutes=1)
scheduler.start()

@app.route("/")
def index():
    return redirect(f"{AUTH_URL}?client_id={SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri={REDIRECT_URI}&scope=user-read-recently-played user-read-email user-read-private user-read-playback-state")

@app.route("/callback")
def callback():
    code = request.args.get("code")
    auth_str = f"{SPOTIFY_CLIENT_ID}:{SPOTIFY_CLIENT_SECRET}"
    b64_auth_str = base64.b64encode(auth_str.encode()).decode()

    token_data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": REDIRECT_URI
    }
    headers = {
        "Authorization": f"Basic " + b64_auth_str,
        "Content-Type": "application/x-www-form-urlencoded"
    }

    res = requests.post(TOKEN_URL, data=token_data, headers=headers)
    token_json = res.json()
    
    session["access_token"] = token_json.get("access_token")
    spotify_id = token_json.get("id")
    session["spotify_id"] = spotify_id

    # Store the user info in MongoDB
    users_collection.insert_one({
        "spotify_id": spotify_id,
        "access_token": token_json.get("access_token"),
        "total_minutes": 0
    })

    return redirect("/stats")

@app.route("/stats")
def stats():
    token = session.get("access_token")
    if not token:
        return redirect("/")  

    headers = {"Authorization": f"Bearer {token}"}
    res = requests.get("https://api.spotify.com/v1/me", headers=headers)
    user_data = res.json()

    total_minutes = 0
    user_in_db = users_collection.find_one({"spotify_id": session.get("spotify_id")})

    if user_in_db:
        total_minutes = user_in_db.get('total_minutes', 0)

    return render_template("stats.html", username=user_data.get("display_name", "Unknown"), total_minutes=round(total_minutes, 2))

if __name__ == "__main__":
    app.run(debug=True)
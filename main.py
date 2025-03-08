from flask import Flask, request, redirect, session, render_template, jsonify
import requests
import base64
from pymongo import MongoClient
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime

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
RECENTLY_PLAYED_URL = "https://api.spotify.com/v1/me/player/recently-played"

# Initialize the scheduler
scheduler = BackgroundScheduler()

def update_user_playback_time():
    """Fetch user’s recently played tracks and update MongoDB"""
    print("Running scheduled task...")
    for user in users_collection.find({}):  # Iterate over all users in the database
        spotify_id = user['spotify_id']
        access_token = user['access_token']
        
        headers = {"Authorization": f"Bearer {access_token}"}
        try:
            # Fetch recently played tracks
            res = requests.get(RECENTLY_PLAYED_URL, headers=headers, params={"limit": 50})
            if res.status_code == 200:
                data = res.json()
                total_minutes = user.get('total_minutes', 0)
                debug_info = user.get('debug_info', [])  # Load existing debug info

                # Add the duration of all recently played tracks
                for item in data.get("items", []):
                    track_name = item["track"]["name"]
                    artist_name = item["track"]["artists"][0]["name"]
                    track_duration = item["track"]["duration_ms"] / 60000  # Convert to minutes
                    total_minutes += track_duration

                    # Log the addition of this track
                    debug_info.append({
                        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        "message": f"✅ {track_name} by {artist_name} hozzáadva: {track_duration:.2f} perc"
                    })

                # Update the total minutes and debug info in MongoDB
                users_collection.update_one(
                    {"spotify_id": spotify_id},
                    {"$set": {
                        "total_minutes": total_minutes,
                        "debug_info": debug_info[-10:]  # Keep only the last 10 entries
                    }},
                    upsert=True
                )
                print(f"Updated total minutes for {spotify_id}: {total_minutes}")
            else:
                print(f"Error fetching recently played tracks for {spotify_id}: {res.status_code}")
        except Exception as e:
            print(f"Exception occurred for {spotify_id}: {e}")

# Add a job to run every minute to fetch and update user's listening data
scheduler.add_job(update_user_playback_time, 'interval', minutes=1)
scheduler.start()

@app.route("/")
def index():
    return redirect(f"{AUTH_URL}?client_id={SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri={REDIRECT_URI}&scope=user-read-recently-played user-read-email user-read-private")

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

    try:
        res = requests.post(TOKEN_URL, data=token_data, headers=headers)
        res.raise_for_status()  # Raise an error for bad status codes
        token_json = res.json()
        
        if "access_token" not in token_json:
            return "Failed to retrieve access token", 400

        session["access_token"] = token_json.get("access_token")
        spotify_id = token_json.get("id")
        session["spotify_id"] = spotify_id

        # Store the user info in MongoDB
        users_collection.update_one(
            {"spotify_id": spotify_id},
            {"$set": {
                "access_token": token_json.get("access_token"),
                "total_minutes": 0,
                "debug_info": []  # Initialize debug info
            }},
            upsert=True
        )

        return redirect("/stats")
    except Exception as e:
        return f"Error during callback: {e}", 500

@app.route("/stats")
def stats():
    token = session.get("access_token")
    if not token:
        return redirect("/")  

    headers = {"Authorization": f"Bearer {token}"}
    try:
        res = requests.get("https://api.spotify.com/v1/me", headers=headers)
        res.raise_for_status()
        user_data = res.json()

        total_minutes = 0
        debug_info = []
        user_in_db = users_collection.find_one({"spotify_id": session.get("spotify_id")})
        if user_in_db:
            total_minutes = user_in_db.get('total_minutes', 0)
            debug_info = user_in_db.get('debug_info', [])

        return render_template("stats.html", username=user_data.get("display_name", "Unknown"), total_minutes=round(total_minutes, 2), debug_info=debug_info)
    except Exception as e:
        return f"Error fetching user data: {e}", 500

if __name__ == "__main__":
    app.run(debug=True)
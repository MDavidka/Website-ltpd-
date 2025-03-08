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

                # Add the duration of all recently played tracks
                for item in data.get("items", []):
                    track_duration = item["track"]["duration_ms"] / 60000  # Convert to minutes
                    total_minutes += track_duration

                # Update the total minutes in MongoDB
                users_collection.update_one(
                    {"spotify_id": spotify_id},
                    {"$set": {"total_minutes": total_minutes}},
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
                "total_minutes": 0
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
        user_in_db = users_collection.find_one({"spotify_id": session.get("spotify_id")})
        if user_in_db:
            total_minutes = user_in_db.get('total_minutes', 0)

        return render_template("stats.html", username=user_data.get("display_name", "Unknown"), total_minutes=round(total_minutes, 2))
    except Exception as e:
        return f"Error fetching user data: {e}", 500

from datetime import datetime  # Importáljuk a datetime modult

@app.route("/api/stats")
def api_stats():
    token = session.get("access_token")
    if not token:
        return jsonify({"error": "Unauthorized"}), 401

    debug_info = []  # Hibakeresési információk gyűjtése
    user_in_db = users_collection.find_one({"spotify_id": session.get("spotify_id")})
    if not user_in_db:
        return jsonify({"error": "User not found"}), 404

    debug_info.append({
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "message": "✅ Felhasználó adatainak lekérése a MongoDB-ből sikeres."
    })

    # Fetch recently played tracks for debugging
    headers = {"Authorization": f"Bearer {token}"}
    try:
        res = requests.get(RECENTLY_PLAYED_URL, headers=headers, params={"limit": 10})
        res.raise_for_status()
        recently_played = res.json().get("items", [])
        debug_info.append({
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "message": "✅ Spotify API hívása sikeres. Zenék lekérdezve."
        })
    except Exception as e:
        recently_played = []
        debug_info.append({
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "message": f"❌ Spotify API hívása sikertelen: {e}"
        })

    # Calculate total minutes and prepare debug info for each track
    total_minutes = user_in_db.get('total_minutes', 0)
    track_debug_info = []
    for item in recently_played:
        track_name = item["track"]["name"]
        artist_name = item["track"]["artists"][0]["name"]
        duration_minutes = round(item["track"]["duration_ms"] / 60000, 2)
        total_minutes += duration_minutes
        track_debug_info.append({
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "track_name": track_name,
            "artist_name": artist_name,
            "duration_minutes": duration_minutes,
            "status": "✅ Hozzáadva a hallgatási időhöz."
        })

    debug_info.append({
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "message": "✅ Zenék hozzáadva a hallgatási időhöz."
    })

    # Update the total minutes in MongoDB
    try:
        users_collection.update_one(
            {"spotify_id": session.get("spotify_id")},
            {"$set": {"total_minutes": total_minutes}},
            upsert=True
        )
        debug_info.append({
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "message": "✅ Adatbázis frissítése sikeres."
        })
    except Exception as e:
        debug_info.append({
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "message": f"❌ Adatbázis frissítése sikertelen: {e}"
        })

    return jsonify({
        "total_minutes": total_minutes,
        "recently_played": track_debug_info,
        "debug_info": debug_info
    })
if __name__ == "__main__":
    app.run(debug=True)
    
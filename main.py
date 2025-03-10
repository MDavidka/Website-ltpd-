from flask import Flask, redirect, request, session, url_for, render_template, jsonify
import requests
from pymongo import MongoClient
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler

app = Flask(__name__)
app.secret_key = "your_secret_key_here"  # Replace with a secure secret key

# Spotify API credentials
SPOTIFY_CLIENT_ID = "3baa3b2f48c14eb0b1ec3fb7b6c5b0db"
SPOTIFY_CLIENT_SECRET = "62f4ad9723464096864224831ed841b3"
SPOTIFY_REDIRECT_URI = "https://test.ltpd.xyz/callback"
SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize"
SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"
SPOTIFY_API_BASE_URL = "https://api.spotify.com/v1"

# MongoDB connection
MONGO_URI = "mongodb+srv://EFmTCpVa57UnGnG1:EFmTCpVa57UnGnG1@cluster0.iuxk8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(MONGO_URI)
db = client["spotify_stats"]
users_collection = db["users"]

# Helper function to refresh Spotify access token
def refresh_spotify_token(refresh_token):
    payload = {
        "grant_type": "refresh_token",
        "refresh_token": refresh_token,
        "client_id": SPOTIFY_CLIENT_ID,
        "client_secret": SPOTIFY_CLIENT_SECRET,
    }
    response = requests.post(SPOTIFY_TOKEN_URL, data=payload)
    if response.status_code == 200:
        return response.json()["access_token"]
    return None

# Background task to track streaming minutes
def track_streaming_minutes():
    print("Running background task...")
    for user in users_collection.find():
        user_id = user["user_id"]
        access_token = user["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}

        # Fetch currently playing track
        response = requests.get(
            f"{SPOTIFY_API_BASE_URL}/me/player/currently-playing", headers=headers
        )
        if response.status_code == 200:
            track_data = response.json()
            if track_data["is_playing"]:
                # Update streaming minutes in MongoDB
                users_collection.update_one(
                    {"user_id": user_id},
                    {"$inc": {"streaming_minutes": 1}},
                    upsert=True,
                )

# Initialize APScheduler
scheduler = BackgroundScheduler()
scheduler.add_job(track_streaming_minutes, 'interval', minutes=1)  # Run every minute
scheduler.start()

# Spotify OAuth login
@app.route("/login")
def login():
    auth_url = f"{SPOTIFY_AUTH_URL}?client_id={SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri={SPOTIFY_REDIRECT_URI}&scope=user-read-currently-playing user-read-recently-played"
    return redirect(auth_url)

# Spotify OAuth callback
@app.route("/callback")
def callback():
    code = request.args.get("code")
    payload = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": SPOTIFY_REDIRECT_URI,
        "client_id": SPOTIFY_CLIENT_ID,
        "client_secret": SPOTIFY_CLIENT_SECRET,
    }
    response = requests.post(SPOTIFY_TOKEN_URL, data=payload)
    if response.status_code == 200:
        token_data = response.json()
        session["access_token"] = token_data["access_token"]
        session["refresh_token"] = token_data["refresh_token"]
        session["expires_at"] = datetime.now().timestamp() + token_data["expires_in"]

        # Fetch user profile
        headers = {"Authorization": f"Bearer {session['access_token']}"}
        user_response = requests.get(f"{SPOTIFY_API_BASE_URL}/me", headers=headers)
        if user_response.status_code == 200:
            user_data = user_response.json()
            user_id = user_data["id"]
            session["user_id"] = user_id

            # Save or update user in MongoDB
            users_collection.update_one(
                {"user_id": user_id},
                {
                    "$set": {
                        "user_id": user_id,
                        "access_token": session["access_token"],
                        "refresh_token": session["refresh_token"],
                        "expires_at": session["expires_at"],
                        "streaming_minutes": 0,  # Initialize streaming minutes
                    }
                },
                upsert=True,
            )
            return redirect(url_for("stats"))
    return "Authentication failed."

# Dashboard showing user stats
@app.route("/stats")
def stats():
    if "user_id" not in session:
        return redirect(url_for("login"))

    return render_template("stats.html")

# Endpoint to fetch streaming minutes
@app.route("/stats-data")
def stats_data():
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    user_id = session["user_id"]
    user_data = users_collection.find_one({"user_id": user_id})
    if not user_data:
        return jsonify({"error": "User not found"}), 404

    return jsonify({"streaming_minutes": user_data.get("streaming_minutes", 0)})

# Logout
@app.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"success": True})

# Homepage
@app.route("/")
def index():
    return render_template("index.html")

if __name__ == "__main__":
    app.run(debug=True)
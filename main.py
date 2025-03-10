# main.py

from flask import Flask, render_template, request, redirect, url_for
from flask_pymongo import PyMongo
import spotipy
from spotipy.oauth2 import SpotifyOAuth
import os
import time
import threading

app = Flask(__name__)

# MongoDB Connection
app.config["MONGO_URI"] = "mongodb+srv://EFmTCpVa57UnGnG1:EFmTCpVa57UnGnG1@cluster0.iuxk8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
mongo = PyMongo(app)

# Spotify API Credentials
SPOTIFY_CLIENT_ID = "3baa3b2f48c14eb0b1ec3fb7b6c5b0db"
SPOTIFY_CLIENT_SECRET = "62f4ad9723464096864224831ed841b3"
SPOTIFY_REDIRECT_URI = "https://ltpd.xyz/callback"

# Spotify OAuth
scope = "user-read-playback-state,user-read-currently-playing"
sp = spotipy.Spotify(auth_manager=SpotifyOAuth(client_id=SPOTIFY_CLIENT_ID,
                                               client_secret=SPOTIFY_CLIENT_SECRET,
                                               redirect_uri=SPOTIFY_REDIRECT_URI,
                                               scope=scope))

# Function to track user streaming minutes
def track_streaming_minutes(user_id):
    while True:
        try:
            # Get current playback state
            playback_state = sp.current_playback()
            if playback_state:
                # Get current track duration and progress
                track_duration = playback_state["item"]["duration_ms"]
                progress = playback_state["progress_ms"]
                # Calculate streaming minutes
                streaming_minutes = (progress / 1000) / 60
                # Update user data in MongoDB
                mongo.db.users.update_one({"_id": user_id}, {"$inc": {"streaming_minutes": streaming_minutes}})
            else:
                # If no playback state, reset streaming minutes
                mongo.db.users.update_one({"_id": user_id}, {"$set": {"streaming_minutes": 0}})
        except Exception as e:
            print(f"Error tracking streaming minutes: {e}")
        time.sleep(60)  # Track every minute

# Route for Spotify login
@app.route("/login")
def login():
    return render_template("index.html")

# Route for Spotify callback
@app.route("/callback")
def callback():
    # Get user ID from Spotify
    user_id = sp.me()["id"]
    # Create or update user data in MongoDB
    user_data = mongo.db.users.find_one({"_id": user_id})
    if not user_data:
        mongo.db.users.insert_one({"_id": user_id, "streaming_minutes": 0})
    # Start tracking streaming minutes in a separate thread
    threading.Thread(target=track_streaming_minutes, args=(user_id,)).start()
    return redirect(url_for("stats"))

# Route for user stats
@app.route("/stats")
def stats():
    # Get user ID from Spotify
    user_id = sp.me()["id"]
    # Get user data from MongoDB
    user_data = mongo.db.users.find_one({"_id": user_id})
    return render_template("stats.html", user_data=user_data)

if __name__ == "__main__":
    app.run(debug=True)
from flask import Flask, request, redirect, session, jsonify, render_template
import requests
import base64

app = Flask(__name__)
app.secret_key = "your_secret_key"

SPOTIFY_CLIENT_ID = "3baa3b2f48c14eb0b1ec3fb7b6c5b0db"
SPOTIFY_CLIENT_SECRET = "62f4ad9723464096864224831ed841b3"
REDIRECT_URI = "https://ltpd.xyz/callback"

AUTH_URL = "https://accounts.spotify.com/authorize"
TOKEN_URL = "https://accounts.spotify.com/api/token"
USER_URL = "https://api.spotify.com/v1/me/player/recently-played"

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

    res = requests.post(TOKEN_URL, data=token_data, headers=headers)
    token_json = res.json()
    
    session["access_token"] = token_json.get("access_token")
    
    return redirect("/stats")

@app.route("/stats")
def stats():
    token = session.get("access_token")
    if not token:
        return redirect("/")  

    headers = {"Authorization": f"Bearer {token}"}
    res = requests.get(USER_URL, headers=headers)
    data = res.json()

    total_minutes = sum(item["track"]["duration_ms"] / 60000 for item in data.get("items", []))

    user_res = requests.get("https://api.spotify.com/v1/me", headers=headers)
    user_data = user_res.json()

    return render_template("stats.html", username=user_data.get("display_name", "Unknown"),
                           profile_image=user_data["images"][0]["url"] if user_data.get("images") else "",
                           total_minutes=round(total_minutes, 2))

if __name__ == "__main__":
    app.run(debug=True)
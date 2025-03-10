from flask import Flask, render_template, request, redirect, url_for
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from pymongo import MongoClient
import spotipy
from spotipy.oauth2 import SpotifyOAuth

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key'

# MongoDB connection
client = MongoClient('mongodb+srv://EFmTCpVa57UnGnG1:EFmTCpVa57UnGnG1@cluster0.iuxk8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
db = client['music_streaming']

# Spotify API connection
sp = spotipy.Spotify(auth_manager=SpotifyOAuth(client_id='3baa3b2f48c14eb0b1ec3fb7b6c5b0db',
                                               client_secret='62f4ad9723464096864224831ed841b3',
                                               redirect_uri='https://test.ltpd.xyz/callback'))

# Login manager
login_manager = LoginManager()
login_manager.init_app(app)

class User(UserMixin):
    def __init__(self, id):
        self.id = id

@login_manager.user_loader
def load_user(user_id):
    return User(user_id)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login')
def login():
    return render_template('login.html')

@app.route('/login', methods=['POST'])
def login_post():
    username = request.form['username']
    password = request.form['password']
    user = db.users.find_one({'username': username, 'password': password})
    if user:
        login_user(User(user['_id']))
        return redirect(url_for('dashboard'))
    return 'Invalid credentials', 401

@app.route('/callback')
def callback():
    sp.auth_manager.get_access_token()
    return redirect(url_for('dashboard'))

@app.route('/dashboard')
@login_required
def dashboard():
    user_id = current_user.id
    user_data = db.users.find_one({'_id': user_id})
    streaming_time = user_data.get('streaming_time', 0)
    return render_template('dashboard.html', streaming_time=streaming_time)

@app.route('/update_streaming_time', methods=['POST'])
@login_required
def update_streaming_time():
    user_id = current_user.id
    streaming_time = request.form['streaming_time']
    db.users.update_one({'_id': user_id}, {'$set': {'streaming_time': streaming_time}})
    return 'Streaming time updated successfully'

if __name__ == '__main__':
    app.run(debug=True)
    
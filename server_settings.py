from flask import Flask
from flask_mongoengine import MongoEngine
from flask_cors import CORS

app = Flask(__name__)
app.config['MONGODB_SETTINGS'] = {
    'db': 'mybb_twitter',
    'host': 'localhost',
    'port': 27017
}
cors = CORS(app, resources={r"/*": {"origins": "*", "allow_headers": ["Content-Type"],
                                    "methods": ["GET", "POST"]}})
db = MongoEngine(app)

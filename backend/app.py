import os
from flask import Flask, g
import sqlite3

app = Flask(__name__, template_folder='../frontend')

base_dir = os.path.dirname(os.path.abspath(__file__))
FRONTEND_PATH = os.path.join(base_dir, '..', 'frontend')
DATABASE_PATH = os.path.join(base_dir, '..', 'database', 'FloatYourBoat.db')


def get_db() -> sqlite3.Connection:
    if 'db' not in g:
        g.db = sqlite3.connect(DATABASE_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close_db(error):
    db: sqlite3.Connection = g.pop('db', None)
    if db is not None:
        db.close()

from routes import *

if __name__ == '__main__':
    app.run(debug=True)
import os
from flask import Flask

app = Flask(__name__, template_folder='../frontend')

base_dir = os.path.dirname(os.path.abspath(__file__))
FRONTEND_PATH = os.path.join(base_dir, '..', 'frontend')

from routes import *

if __name__ == '__main__':
    app.run(debug=True)
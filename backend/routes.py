from app import app, FRONTEND_PATH
from flask import render_template, Response
import os

DATA_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')


# -- Page routes --

# Index page
@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')


# Login page
@app.route('/login', methods=['GET'])
def login():
    return render_template('login.html')


# View listing page
@app.route('/listing', methods=['GET'])
def view_listing():
    return render_template('listing.html')


# Create or edit listing page
@app.route('/edit-listing', methods=['GET'])
def edit_listing():
    return render_template('listing.html')


# View seller page
@app.route('/seller', methods=['GET'])
def view_seller():
    return render_template('seller.html')


# View saved listings page
@app.route('/saved', methods=['GET'])
def view_saved():
    return render_template('saved.html')

# -- CSS and JS file routes --

@app.route('/css/<file_path>', methods=['GET'])
def get_css_file(file_path: str):
    full_path = f'{FRONTEND_PATH}/css/{file_path}'
    if not os.path.isfile(full_path):
        return 'File not found', 404
    
    with open(full_path, 'r', encoding='utf-8') as f:
        return Response(f.read(), 200, mimetype='text/css')


@app.route('/js/<file_path>', methods=['GET'])
def get_js_file(file_path: str):
    full_path = f'{FRONTEND_PATH}/js/{file_path}'
    if not os.path.isfile(full_path):
        return 'File not found', 404
    
    with open(full_path, 'r', encoding='utf-8') as f:
        return Response(f.read(), 200, mimetype='text/javascript')


# -- API routes --

# City data for state/city dropdowns
@app.route('/api/cities', methods=['GET'])
def get_cities():
    full_path = os.path.join(DATA_PATH, 'us_cities.json')
    if not os.path.isfile(full_path):
        return 'City data not found', 404
    with open(full_path, 'r', encoding='utf-8') as f:
        return Response(f.read(), 200, mimetype='application/json')


# Add or update buyer
@app.route('/api/add_or_update_buyer', methods=['POST', 'PUT'])
def add_or_update_buyer():
    pass


# Delete buyer
@app.route('/api/delete_buyer', methods=['DELETE'])
def delete_buyer():
    pass


# Add or update seller
@app.route('/api/add_or_update_seller', methods=['POST', 'PUT'])
def add_or_update_seller():
    pass


# Delete seller
@app.route('/api/delete_seller', methods=['DELETE'])
def delete_seller():
    pass


# Add or update listing
@app.route('/api/add_or_update_listing', methods=['POST', 'PUT'])
def add_or_update_listing():
    pass


# Delete listing
@app.route('/api/delete_listing', methods=['DELETE'])
def delete_listing():
    pass
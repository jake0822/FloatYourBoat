from app import app, FRONTEND_PATH, get_db
from flask import render_template, Response, jsonify, request
import os
import sqlite3


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

# Add or update buyer
@app.route('/api/add_or_update_buyer', methods=['POST', 'PUT'])
def add_or_update_buyer():
    buyer: dict = request.json

    db = get_db()

    row_exists = db.execute('SELECT 1 FROM Buyers WHERE username = ?', [buyer['username']]).fetchone() is not None

    if row_exists: 
        db.execute('UPDATE Buyers SET name = ?, location = ? WHERE username = ?',
            [buyer['name'], buyer['location'], buyer['username']]
        )
    else:
        db.execute('INSERT INTO Buyers (username, name, location) VALUES (?, ?, ?)',
            [buyer['username'], buyer['name'], buyer['location']]
        )
    
    db.commit()

    return {'success': True}


# Delete buyer
@app.route('/api/delete_buyer/<buyer_username>', methods=['DELETE'])
def delete_buyer(buyer_username: str):
    db = get_db()
    result = db.execute('DELETE FROM Buyers WHERE username = ?', [buyer_username])
    db.commit()

    if result.rowcount == 0:
        return {'error': 'Buyer not found'}, 404
    
    return {'success': True}


# Add or update seller
@app.route('/api/add_or_update_seller', methods=['POST', 'PUT'])
def add_or_update_seller():
    seller: dict = request.json

    db = get_db()

    row_exists = db.execute('SELECT 1 FROM Sellers WHERE username = ?', [seller['username']]).fetchone() is not None

    if row_exists: 
        db.execute('UPDATE Sellers SET name = ?, email = ? WHERE username = ?',
            [seller['name'], seller['email'], seller['username']]
        )
    else:
        db.execute('INSERT INTO Sellers (username, name, email) VALUES (?, ?, ?)',
            [seller['username'], seller['name'], seller['email']]
        )
    
    db.commit()

    return {'success': True}


# Delete seller
@app.route('/api/delete_seller/<seller_username>', methods=['DELETE'])
def delete_seller(seller_username: str):
    db = get_db()
    result = db.execute('DELETE FROM Sellers WHERE username = ?', [seller_username])
    db.commit()

    if result.rowcount == 0:
        return {'error': 'Seller not found'}, 404
    
    return {'success': True}


# Get all of a seller's listings
@app.route('/api/get_seller_listings/<seller_username>', methods=['GET'])
def get_seller_listings(seller_username: str):
    db = get_db()
    listings = db.execute('SELECT * FROM Listings WHERE seller_username = ?', [seller_username])
    return jsonify([dict(listing) for listing in listings])


@app.route('/api/get_listing/<int:listing_id>', methods=['GET'])
def get_listing(listing_id: int):
    db = get_db()
    listing = db.execute("SELECT * FROM Listings WHERE listing_id = ?", [listing_id]).fetchone()

    if listing is None:
        return jsonify({'error': 'Listing not found'})

    listing_dict = dict(listing)
    listing_dict['is_sold'] = bool(listing_dict['is_sold'])

    return jsonify(listing_dict)


# Add or update listing
@app.route('/api/add_or_update_listing', methods=['POST', 'PUT'])
def add_or_update_listing():
    listing: dict = request.json
    listing_id = listing.get('listing_id')

    db = get_db()
    if listing_id is None or listing_id == 0:
        # Create new listing
        next_id_result = db.execute('SELECT MAX(listing_id) FROM Listings').fetchone()
        next_id = (next_id_result[0] or 0) + 1
        db.execute(
            'INSERT INTO Listings (listing_id, name, description, location, price, date_listed, is_sold, seller_username) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [next_id, listing['name'], listing['description'], listing['location'],
             listing['price'], listing['date_listed'], int(listing['is_sold']), listing['seller_username']]
        )
    else:
        # Update existing listing
        db.execute(
            'UPDATE Listings SET name = ?, description = ?, location = ?, price = ?, date_listed = ?, is_sold = ?, seller_username = ? WHERE listing_id = ?',
            [listing['name'], listing['description'], listing['location'],
             listing['price'], listing['date_listed'], int(listing['is_sold']), listing['seller_username'],
             listing_id]
        )
    
    db.commit()
    return jsonify({'success': True})


# Delete listing
@app.route('/api/delete_listing/<int:listing_id>', methods=['DELETE'])
def delete_listing(listing_id: int):
    db = get_db()
    result = db.execute('DELETE FROM Listings WHERE listing_id = ?', [listing_id])
    db.commit()

    if result.rowcount == 0:
        return {'error': 'Listing not found'}, 404
    
    return {'success': True}


@app.route('/api/get_browse_page/<int:page_number>')
def get_browse_page(page_number: int):
    db = get_db()
    offset = page_number * 10
    listings = db.execute(
        'SELECT * FROM listings ORDER BY listing_id DESC LIMIT 10 OFFSET ?',
        [offset]
    ).fetchall()
    return jsonify([dict(listing) for listing in listings])
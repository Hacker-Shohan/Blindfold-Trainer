from flask import Flask, render_template, request, jsonify
import sqlite3
import random

app = Flask(__name__)

DB_PATH = 'puzzle.db'  # your SQLite database file

def get_random_puzzle(rating, pieces, difficulty):
    """
    Query the database for a random puzzle matching the rating and pieces.
    difficulty: 'easy', 'normal', 'hard' (for rating adjustment)
    """
    # Adjust rating based on difficulty
    if difficulty == 'easy':
        rating -= 200
    elif difficulty == 'hard':
        rating += 400

    min_rating = rating - 100
    max_rating = rating + 100

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    if pieces is not None:
        cursor.execute(
            "SELECT * FROM puzzles WHERE r BETWEEN ? AND ? AND p = ?",
            (min_rating, max_rating, pieces)
        )
    else:
        cursor.execute(
            "SELECT * FROM puzzles WHERE r BETWEEN ? AND ?",
            (min_rating, max_rating)
        )

    rows = cursor.fetchall()
    conn.close()

    if not rows:
        return None

    # Pick a random puzzle from results
    row = random.choice(rows)
    return {
        'f': row['f'],  # FEN
        'm': row['m'],  # moves
        'r': row['r'],  # rating
        'p': row['p']   # pieces
    }

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get_puzzle')
def get_puzzle():
    try:
        rating = int(request.args.get('rating', 1300))
        pieces = request.args.get('pieces', None)
        difficulty = request.args.get('difficulty', 'normal')

        pieces = int(pieces) if pieces not in (None, 'null') else None

        puzzle = get_random_puzzle(rating, pieces, difficulty)
        if puzzle is None:
            return jsonify({}), 200  # no puzzle found
        return jsonify(puzzle)
    except Exception as e:
        print("Error fetching puzzle:", e)
        return jsonify({}), 500

if __name__ == '__main__':
    app.run(debug=True)
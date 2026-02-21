// DARK/LIGHT MODE TOGGLE
const modeToggle = document.getElementById('modeToggle');
modeToggle.addEventListener('click', () => {
    if (document.body.classList.contains('dark')) {
        document.body.classList.remove('dark');
        document.body.classList.add('light');
        modeToggle.textContent = 'Dark Mode';
    } else {
        document.body.classList.remove('light');
        document.body.classList.add('dark');
        modeToggle.textContent = 'Light Mode';
    }
});

// SLIDERS
const ratingSlider = document.getElementById('ratingSlider');
const ratingValue = document.getElementById('ratingValue');
ratingSlider.addEventListener('input', () => ratingValue.textContent = ratingSlider.value);

const piecesSlider = document.getElementById('piecesSlider');
const piecesValue = document.getElementById('piecesValue');
const ignorePiecesCheckbox = document.getElementById('ignorePieces');

piecesSlider.addEventListener('input', () => piecesValue.textContent = piecesSlider.value);

ignorePiecesCheckbox.addEventListener('change', () => {
    if (ignorePiecesCheckbox.checked) {
        piecesSlider.disabled = true;
        piecesValue.textContent = 'Ignored';
    } else {
        piecesSlider.disabled = false;
        piecesValue.textContent = piecesSlider.value;
    }
});

// DIFFICULTY BUTTONS
let difficulty = 'normal'; // default
const diffButtons = document.querySelectorAll('.difficulty-btn');
diffButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        difficulty = btn.getAttribute('data-diff');
        diffButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// Adjust rating based on difficulty
function adjustRating(rating) {
    if (difficulty === 'easy') return rating - 200;
    if (difficulty === 'hard') return rating + 400;
    return rating;
}

// FEN to human-readable
function fenToReadable(fen) {
    const rows = fen.split(" ")[0].split("/");
    const activeColor = fen.split(" ")[1] === "w" ? "White to move" : "Black to move";

    const pieceNames = {
        'p': 'Pawn', 'r': 'Rook', 'n': 'Knight',
        'b': 'Bishop', 'q': 'Queen', 'k': 'King',
        'P': 'Pawn', 'R': 'Rook', 'N': 'Knight',
        'B': 'Bishop', 'Q': 'Queen', 'K': 'King'
    };

    const result = { white: [], black: [] };
    const files = ['a','b','c','d','e','f','g','h'];

    for (let r = 0; r < 8; r++) {
        let fileIndex = 0;
        for (let char of rows[r]) {
            if (isNaN(char)) {
                const pos = files[fileIndex] + (8 - r);
                if (char === char.toUpperCase()) {
                    result.white.push(`${pieceNames[char]} ${pos}`);
                } else {
                    result.black.push(`${pieceNames[char]} ${pos}`);
                }
                fileIndex++;
            } else {
                fileIndex += parseInt(char);
            }
        }
    }

    return { ...result, turn: activeColor };
}

// Get random FEN
async function getRandomFEN(rating, pieces) {
    const response = await fetch('puzzle.json');
    const puzzles = await response.json();

    let filtered = puzzles.filter(p =>
        p.r >= (rating - 100) && p.r <= (rating + 100)
    );

    if (pieces !== null) {
        filtered = filtered.filter(p => p.p == pieces);
    }

    if (filtered.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * filtered.length);
    return filtered[randomIndex].f;
}

// Button click
document.getElementById('generateBtn').addEventListener('click', async () => {
    let rating = parseInt(ratingSlider.value);
    rating = adjustRating(rating);

    let pieces = ignorePiecesCheckbox.checked ? null : parseInt(piecesSlider.value);

    const fen = await getRandomFEN(rating, pieces);

    if (!fen) {
        document.getElementById('output').textContent = "No puzzle found in this range!";
        return;
    }

    const readable = fenToReadable(fen);
    let outputText = `Turn: ${readable.turn}\n\nWhite pieces:\n${readable.white.join(', ')}\n\nBlack pieces:\n${readable.black.join(', ')}`;
    document.getElementById('output').textContent = outputText;
});
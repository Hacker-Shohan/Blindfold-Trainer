// DARK/LIGHT MODE TOGGLE
const modeToggle = document.getElementById('modeToggle');
modeToggle.addEventListener('click', () => {
    if (document.body.classList.contains('dark')) {
        document.body.classList.replace('dark', 'light');
        modeToggle.textContent = 'Dark Mode';
    } else {
        document.body.classList.replace('light', 'dark');
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
let difficulty = 'normal';
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
    let activeColor = fen.split(" ")[1] === "w" ? "White to move" : "Black to move";

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

// Apply first move from 'm'
function applyFirstMove(result, firstMove) {
    if (!firstMove || firstMove.length !== 4) return result;

    const from = firstMove.slice(0,2);
    const to = firstMove.slice(2,4);

    for (let i = 0; i < result.white.length; i++) {
        const parts = result.white[i].split(" ");
        if (parts[parts.length - 1] === from) {
            parts[parts.length - 1] = to;
            result.white[i] = parts.join(" ");
            break;
        }
    }

    for (let i = 0; i < result.black.length; i++) {
        const parts = result.black[i].split(" ");
        if (parts[parts.length - 1] === from) {
            parts[parts.length - 1] = to;
            result.black[i] = parts.join(" ");
            break;
        }
    }

    result.turn = result.turn === "White to move" ? "Black to move" : "White to move";
    return result;
}

// Global puzzle
let puzzle = null;

// Generate Button - fetch puzzle from Flask
document.getElementById('generateBtn').addEventListener('click', async () => {
    let rating = adjustRating(parseInt(ratingSlider.value));
    let pieces = ignorePiecesCheckbox.checked ? null : parseInt(piecesSlider.value);

    document.getElementById('output').textContent = "Loading puzzle...";

    try {
        const params = new URLSearchParams({
            rating: rating,
            pieces: pieces,
            difficulty: difficulty
        });

        const response = await fetch(`/get_puzzle?${params.toString()}`);
        const data = await response.json();

        if (!data || !data.f || !data.m) {
            document.getElementById('output').textContent = "No puzzle found for these settings!";
            return;
        }

        puzzle = data;
        const readable = fenToReadable(puzzle.f);
        const finalReadable = applyFirstMove(readable, puzzle.m.slice(0,4));

        let outputText = `Turn: ${finalReadable.turn}\n\nWhite pieces:\n${finalReadable.white.join(', ')}\n\nBlack pieces:\n${finalReadable.black.join(', ')}`;
        document.getElementById('output').textContent = outputText;

    } catch (err) {
        console.error(err);
        document.getElementById('output').textContent = "Error fetching puzzle!";
    }
});

// Validate Answer
document.getElementById('submitAnswerBtn').addEventListener('click', () => {
    const userAns = document.getElementById('answerInput').value.trim().toLowerCase();
    if (!puzzle || !puzzle.m) {
        alert("Generate a puzzle first!");
        return;
    }

    const correctAns = puzzle.m.slice(4, 8).toLowerCase();
    if (userAns === correctAns) {
        alert("✅ Correct!");
    } else {
        alert(`❌ Wrong! Correct move was: ${correctAns}`);
    }
});
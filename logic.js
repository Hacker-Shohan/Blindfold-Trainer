// ===== Loading Screen =====
const loadingScreen = document.getElementById('loadingScreen');

// ===== Dark/Light Mode Toggle =====
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

// ===== Sliders =====
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

// ===== Difficulty Buttons =====
let difficulty = 'normal';
const diffButtons = document.querySelectorAll('.difficulty-btn');
diffButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        difficulty = btn.getAttribute('data-diff');
        diffButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// ===== Adjust Rating by Difficulty =====
function adjustRating(rating) {
    if (difficulty === 'easy') return rating - 200;
    if (difficulty === 'hard') return rating + 400;
    return rating;
}

// ===== FEN to Human-readable =====
function fenToReadable(fen) {
    const rows = fen.split(" ")[0].split("/");
    let activeColor = fen.split(" ")[1] === "w" ? "White to move" : "Black to move";
    const pieceNames = {
        'p': 'Pawn','r': 'Rook','n': 'Knight','b': 'Bishop','q': 'Queen','k': 'King',
        'P': 'Pawn','R': 'Rook','N': 'Knight','B': 'Bishop','Q': 'Queen','K': 'King'
    };
    const result = { white: [], black: [] };
    const files = ['a','b','c','d','e','f','g','h'];

    for (let r = 0; r < 8; r++) {
        let fileIndex = 0;
        for (let char of rows[r]) {
            if (isNaN(char)) {
                const pos = files[fileIndex] + (8 - r);
                if (char === char.toUpperCase()) result.white.push(`${pieceNames[char]} ${pos}`);
                else result.black.push(`${pieceNames[char]} ${pos}`);
                fileIndex++;
            } else fileIndex += parseInt(char);
        }
    }
    return { ...result, turn: activeColor };
}

// ===== Apply First Move =====
function applyFirstMove(result, firstMove) {
    if (!firstMove || firstMove.length !== 4) return result;

    const from = firstMove.slice(0,2);
    const to = firstMove.slice(2,4);

    for (let i = 0; i < result.white.length; i++) {
        const parts = result.white[i].split(" ");
        if (parts[parts.length-1] === from) {
            parts[parts.length-1] = to;
            result.white[i] = parts.join(" ");
            break;
        }
    }

    for (let i = 0; i < result.black.length; i++) {
        const parts = result.black[i].split(" ");
        if (parts[parts.length-1] === from) {
            parts[parts.length-1] = to;
            result.black[i] = parts.join(" ");
            break;
        }
    }

    result.turn = result.turn === "White to move" ? "Black to move" : "White to move";
    return result;
}

// ===== Apply First Move to FEN =====
function applyFirstMoveToFEN(fen, firstMove) {
    if (!firstMove || firstMove.length !== 4) return fen;

    const files = ['a','b','c','d','e','f','g','h'];
    let rows = fen.split(" ")[0].split("/");
    let turn = fen.split(" ")[1];

    const board = rows.map(row => {
        let result = [];
        for (let char of row) {
            if (isNaN(char)) result.push(char);
            else result.push(...Array(Number(char)).fill(''));
        }
        return result;
    });

    const fromFile = files.indexOf(firstMove[0]);
    const fromRank = 8 - parseInt(firstMove[1]);
    const toFile = files.indexOf(firstMove[2]);
    const toRank = 8 - parseInt(firstMove[3]);

    board[toRank][toFile] = board[fromRank][fromFile];
    board[fromRank][fromFile] = '';

    const newRows = board.map(row => {
        let rowFEN = '';
        let empty = 0;
        for (let cell of row) {
            if (cell === '') empty++;
            else { if (empty) { rowFEN += empty; empty = 0; } rowFEN += cell; }
        }
        if (empty) rowFEN += empty;
        return rowFEN;
    });

    const newTurn = turn === 'w' ? 'b' : 'w';
    return newRows.join('/') + ' ' + newTurn + ' - - 0 1';
}

// ===== PUZZLE FETCH & FILTER =====
let puzzle = null;

function getChunkFile(rating) {
    // Example: chunk files named chunk_800.json, chunk_900.json, ...
    const chunkRating = Math.floor(rating / 100) * 100;
    return `chunks/chunk_${chunkRating}.json`;
}

async function getRandomPuzzle(rating, pieces) {
    const fileName = getChunkFile(rating);
    let chunk;

    try {
        loadingScreen.style.display = 'flex';
        const response = await fetch(fileName);
        chunk = await response.json();
    } catch(err) {
        console.error("Failed to load chunk:", err);
        loadingScreen.style.display = 'none';
        return null;
    }

    loadingScreen.style.display = 'none';

    let filtered = chunk.filter(p =>
        p.r >= (rating - 100) && p.r <= (rating + 100)
    );

    if (pieces !== null) {
        filtered = filtered.filter(p => Number(p.p) === pieces);
    }

    if (filtered.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * filtered.length);
    return filtered[randomIndex];
}

// ===== Generate Puzzle Button =====
document.getElementById('generateBtn').addEventListener('click', async () => {
    let rating = adjustRating(parseInt(ratingSlider.value));
    let pieces = ignorePiecesCheckbox.checked ? null : parseInt(piecesSlider.value);

    puzzle = await getRandomPuzzle(rating, pieces);

    if (!puzzle) {
        document.getElementById('output').textContent = "No puzzle found in this range!";
        return;
    }

    const readable = fenToReadable(puzzle.f);
    const finalReadable = applyFirstMove(readable, puzzle.m.slice(0,4));
    const updatedFEN = applyFirstMoveToFEN(puzzle.f, puzzle.m.slice(0,4));

    let outputText = `Turn: ${finalReadable.turn}\n\nWhite pieces:\n${finalReadable.white.join(', ')}\n\nBlack pieces:\n${finalReadable.black.join(', ')}`;
    document.getElementById('output').textContent = outputText;

    console.log("Updated FEN:", updatedFEN);
});

// ===== Validate Answer =====
document.getElementById('submitAnswerBtn').addEventListener('click', () => {
    const userAns = document.getElementById('answerInput').value.trim().toLowerCase();
    if (!puzzle || !puzzle.m) {
        alert("Generate a puzzle first!");
        return;
    }

    const correctAns = puzzle.m.slice(4, 8).toLowerCase();
    if (userAns === correctAns) alert("✅ Correct!");
    else alert(`❌ Wrong! Correct move was: ${correctAns}`);
});
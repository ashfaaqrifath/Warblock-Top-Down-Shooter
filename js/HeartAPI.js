let _puzzleModalSolution = null;

async function loadPuzzleModal() {
    const resultEl = document.getElementById('puzzleResult');
    const imgEl = document.getElementById('puzzleImageModal');
    try {
        resultEl.innerHTML = 'Loading...';
        imgEl.src = '';
        // get the puzzle
        const response = await fetch('https://marcconrad.com/uob/heart/api.php?out=json&base64=yes');
        if (!response.ok) throw new Error('Network error ' + response.status);
        const data = await response.json();
        if (!data || !data.question) throw new Error('Invalid puzzle data');
        imgEl.src = 'data:image/png;base64,' + data.question;
        _puzzleModalSolution = data.solution;
        resultEl.innerHTML = '';
    } catch (err) {
        console.error('Puzzle load failed:', err);
        resultEl.innerHTML = '<span class="error">Failed to load API. Try again.</span>';
    }
}

export function openPuzzleModal() {
    const modal = document.getElementById('puzzleModal');
    const ans = document.getElementById('answerInputModal');
    const resultEl = document.getElementById('puzzleResult');
    const checkBtn = document.getElementById('submitBtnModal');
    modal.style.display = 'flex';
    ans.value = '';
    resultEl.innerHTML = '';
    checkBtn.disabled = false;
    loadPuzzleModal();
}

export function closePuzzleModal() {
    document.getElementById('puzzleModal').style.display = 'none';
}


export function initPuzzle() {
    const checkBtn = document.getElementById('submitBtnModal');
    const closeBtn = document.getElementById('closePuzzleBtn');
    const answerInput = document.getElementById('answerInputModal');
    if (checkBtn) {
        checkBtn.addEventListener('click', () => {
            const resultEl = document.getElementById('puzzleResult');
            const val = parseInt(answerInput.value);
            if (isNaN(val)) {
                resultEl.innerHTML = '<span class="error">Please enter a number.</span>';
                return;
            }
            if (val === _puzzleModalSolution) {
                resultEl.innerHTML = '<span class="success">✅ Correct!<br>10 credits + 10 HP rewarded</span>';
                checkBtn.disabled = true;
                window.dispatchEvent(new CustomEvent('puzzle-correct'));
            } else {
                resultEl.innerHTML = '<span class="error">❌ Incorrect. Try again.</span>';
            }
        });
    }
    if (closeBtn) closeBtn.addEventListener('click', closePuzzleModal);
    if (answerInput) {
        answerInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') document.getElementById('submitBtnModal').click();
        });
    }
}
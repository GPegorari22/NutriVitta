document.addEventListener('DOMContentLoaded', () => {
    const rating = document.querySelector('.avaliacao-rating');
    if (!rating) return;

    const scoreButton = rating.querySelector('.avaliacao-score');
    const radios = rating.querySelectorAll('input[name="avaliacao-nota"]');
    const zeroRadio = rating.querySelector('#avaliacao-0');

    const updateScore = () => {
        const checked = rating.querySelector('input[name="avaliacao-nota"]:checked');
        const value = checked ? checked.value : '0';
        if (scoreButton) {
            scoreButton.textContent = value;
            scoreButton.classList.toggle('is-zero', value === '0');
        }
    };

    radios.forEach((radio) => {
        radio.addEventListener('change', updateScore);
    });

    if (scoreButton && zeroRadio) {
        scoreButton.addEventListener('click', () => {
            zeroRadio.checked = true;
            updateScore();
        });
    }

    updateScore();
});



const container = document.querySelector('.calculadoras-container');

if (container) {
    const cards = Array.from(container.querySelectorAll('.calc-card'));
    const defaultCard = container.querySelector('.calc-card.is-default') || cards[1];

    const setActiveCard = (card) => {
        cards.forEach((item) => {
            const isActive = item === card;
            item.classList.toggle('is-active', isActive);
            item.classList.toggle('active', isActive);
        });
    };

    if (defaultCard) {
        setActiveCard(defaultCard);
    }

    cards.forEach((card) => {
        card.addEventListener('mouseenter', () => {
            container.classList.add('is-hovering');
            setActiveCard(card);
        });

        card.addEventListener('focusin', () => {
            container.classList.add('is-hovering');
            setActiveCard(card);
        });
    });

    container.addEventListener('mouseleave', () => {
        container.classList.remove('is-hovering');
    });

    container.addEventListener('focusout', (event) => {
        if (!container.contains(event.relatedTarget)) {
            container.classList.remove('is-hovering');
        }
    });
}



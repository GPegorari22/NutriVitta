const carousel = document.querySelector('.resultados-carousel');

if (carousel) {
    const track = carousel.querySelector('.carousel-track');
    const cards = Array.from(track.querySelectorAll('.resultado-card'));
    const dots = Array.from(document.querySelectorAll('.carousel-dot'));
    const prevButton = carousel.querySelector('.carousel-control.prev');
    const nextButton = carousel.querySelector('.carousel-control.next');
    let currentIndex = 0;
    let step = 0;

    const computeStep = () => {
        if (!cards.length) return;
        const style = window.getComputedStyle(track);
        const gap = parseFloat(style.gap || style.columnGap || '0');
        step = cards[0].offsetWidth + gap;
    };

    const update = () => {
        if (!cards.length) return;
        track.style.transform = `translateX(${-currentIndex * step}px)`;
        cards.forEach((card, index) => {
            card.classList.toggle('is-active', index === currentIndex);
        });
        dots.forEach((dot, index) => {
            dot.classList.toggle('is-active', index === currentIndex);
        });
    };

    const goTo = (index) => {
        if (!cards.length) return;
        const total = cards.length;
        currentIndex = (index + total) % total;
        update();
    };

    computeStep();
    update();

    if (prevButton) {
        prevButton.addEventListener('click', () => {
            goTo(currentIndex - 1);
        });
    }

    if (nextButton) {
        nextButton.addEventListener('click', () => {
            goTo(currentIndex + 1);
        });
    }

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            goTo(index);
        });
    });

    window.addEventListener('resize', () => {
        computeStep();
        update();
    });
}



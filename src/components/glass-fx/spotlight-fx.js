document.addEventListener('DOMContentLoaded', () => {
    // The effect is enabled by adding the 'spotlight-active' class to the body
    if (document.body.classList.contains('spotlight-active')) {
        const spotlight = document.createElement('div');
        spotlight.className = 'spotlight';
        document.body.appendChild(spotlight);

        window.addEventListener('mousemove', (e) => {
            requestAnimationFrame(() => {
                spotlight.style.setProperty('--x', `${e.clientX}px`);
                spotlight.style.setProperty('--y', `${e.clientY}px`);
            });
        });
    }
});

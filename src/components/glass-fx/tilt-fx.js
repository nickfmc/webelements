document.addEventListener('DOMContentLoaded', () => {
    const tiltElements = document.querySelectorAll('.glass-tilt');

    tiltElements.forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const { left, top, width, height } = el.getBoundingClientRect();
            const x = e.clientX - left;
            const y = e.clientY - top;

            const rotateX = (y - height / 2) / (height / 2) * -5; // Reduced from -10 to -5 degrees
            const rotateY = (x - width / 2) / (width / 2) * 5;   // Reduced from 10 to 5 degrees

            el.style.transition = 'transform 0.1s ease-out';
            el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
        });

        el.addEventListener('mouseleave', () => {
            el.style.transition = 'transform 0.5s ease-in-out';
            el.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
        });
    });
});

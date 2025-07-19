document.addEventListener('DOMContentLoaded', () => {
    const shimmerElements = document.querySelectorAll('.glass-shimmer');

    shimmerElements.forEach(el => {
        const shimmer = document.createElement('div');
        shimmer.className = 'shimmer-effect';
        el.appendChild(shimmer);
    });
});

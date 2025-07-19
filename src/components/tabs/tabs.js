document.addEventListener('DOMContentLoaded', () => {
    const tabContainers = document.querySelectorAll('.tabs-container');

    tabContainers.forEach(container => {
        const tabButtons = container.querySelectorAll('.tab-button');
        const tabPanes = container.querySelectorAll('.tab-pane');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetPaneId = button.getAttribute('data-tab');
                
                // Deactivate all buttons and panes within this container
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabPanes.forEach(pane => pane.classList.remove('active'));

                // Activate the clicked button and target pane
                button.classList.add('active');
                document.getElementById(targetPaneId).classList.add('active');
            });
        });
    });
});

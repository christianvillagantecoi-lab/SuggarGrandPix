// goback.js
(function() {
    // Create the button element
    const backButton = document.createElement('a');
    backButton.href = 'https://christianvillagantecoi-lab.github.io/MyPortfolio/'; // Change this to your target HTML file
    backButton.innerHTML = `
        <svg xmlns="https://christianvillagantecoi-lab.github.io/MyPortfolio/" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        <span>Back to projects</span>
    `;

    // Modern styling for the button
    Object.assign(backButton.style, {
        position: 'fixed',
        top: '15px',
        left: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 16px',
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(10px)',
        color: '#1f2937',
        textDecoration: 'none',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: '14px',
        fontWeight: '600',
        borderRadius: '9999px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        zIndex: '9999',
        transition: 'all 0.2s ease-in-out',
        border: '1px solid rgba(229, 231, 235, 0.8)'
    });

    // Hover and active animations
    backButton.addEventListener('mouseenter', () => {
        backButton.style.backgroundColor = '#ffffff';
        backButton.style.transform = 'translateY(-1px)';
        backButton.style.boxShadow = '0 6px 10px -1px rgba(0, 0, 0, 0.15), 0 2px 4px -1px rgba(0, 0, 0, 0.1)';
    });

    backButton.addEventListener('mouseleave', () => {
        backButton.style.backgroundColor = 'rgba(255, 255, 255, 0.85)';
        backButton.style.transform = 'translateY(0)';
        backButton.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
    });

    backButton.addEventListener('mousedown', () => {
        backButton.style.transform = 'translateY(0) scale(0.98)';
    });

    backButton.addEventListener('mouseup', () => {
        backButton.style.transform = 'translateY(-1px) scale(1)';
    });

    // Append the button to the body once the DOM is loaded
    if (document.body) {
        document.body.appendChild(backButton);
    } else {
        window.addEventListener('DOMContentLoaded', () => {
            document.body.appendChild(backButton);
        });
    }
})();
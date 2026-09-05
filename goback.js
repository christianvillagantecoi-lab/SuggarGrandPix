// goback.js
(function() {
    // Create the button element
    const backButton = document.createElement('a');
    backButton.id = 'modern-back-btn';
    backButton.href = 'https://www.google.com'; // Change to your destination link or HTML file
    backButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        <span>Back</span>
    `;

    // Modern styling for the button (hidden by default)
    Object.assign(backButton.style, {
        position: 'fixed',
        top: '20px',
        left: '20px',
        display: 'none', // Hidden initially
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

    // Global helper functions to show/hide the button from your other scripts
    window.showGoBackButton = function() {
        backButton.style.display = 'flex';
    };

    window.hideGoBackButton = function() {
        backButton.style.display = 'none';
    };

    // Automatically check or show it if the menu element is active on load
    window.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(backButton);
        
        // If you use a specific element ID for your menu (e.g., id="menu")
        const menuEl = document.getElementById('menu');
        if (menuEl && window.getComputedStyle(menuEl).display !== 'none') {
            window.showGoBackButton();
        }
    });
})();

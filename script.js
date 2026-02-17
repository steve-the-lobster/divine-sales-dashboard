// View switching functionality
const viewButtons = document.querySelectorAll('.view-btn');
const views = document.querySelectorAll('.view');

viewButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all buttons and views
        viewButtons.forEach(btn => btn.classList.remove('active'));
        views.forEach(view => view.classList.remove('active'));

        // Add active class to clicked button and corresponding view
        button.classList.add('active');
        const viewId = button.getAttribute('data-view');
        document.getElementById(`view-${viewId}`).classList.add('active');
    });
});

// Placeholder for future API integration
async function fetchSalesData() {
    // This will be implemented in Phase 2 with App Store Connect API
    console.log('Ready for API integration');
    
    // Future implementation:
    // - Fetch data from App Store Connect API
    // - Parse trials, conversions, revenue
    // - Update DOM with real data
    // - Add charts and graphs
    // - Implement real-time updates
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('✨ Divine Sales Dashboard loaded successfully!');
    console.log('📊 Ready for Phase 2: API integration');
    
    // Future: Call fetchSalesData() here
});

// Add smooth scroll behavior
document.documentElement.style.scrollBehavior = 'smooth';

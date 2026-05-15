document.addEventListener('DOMContentLoaded', () => {
    // 1. Sidebar Navigation Logic
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.view-section');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active from all nav items
            navItems.forEach(nav => nav.classList.remove('active'));
            // Add active to clicked item
            item.classList.add('active');

            // Find target section
            const targetId = item.getAttribute('data-target');
            
            // Hide all sections
            sections.forEach(sec => sec.classList.remove('active'));
            // Show target section
            document.getElementById(targetId).classList.add('active');
        });
    });

    // 2. Triple Tab Logic (Plan de Vida)
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Check Lock Status (Progresividad)
            if(btn.classList.contains('locked')) {
                console.log("Restricción de Progresividad: Vista en modo Sólo Lectura/Bloqueada.");
                // We no longer block navigation so the user can see the "Acceso Denegado" panel
            }

            // Scope to parent view-section to avoid hiding tabs in other sections
            const parentSection = btn.closest('.view-section');
            const sectionBtns = parentSection.querySelectorAll('.tab-btn');
            const sectionContents = parentSection.querySelectorAll('.tab-content');

            // Remove active from all in this section
            sectionBtns.forEach(t => t.classList.remove('active'));
            sectionContents.forEach(c => c.classList.remove('active'));

            // Set specific active
            btn.classList.add('active');
            const targetContentId = btn.getAttribute('data-tab');
            document.getElementById(targetContentId).classList.add('active');
        });
    });
});

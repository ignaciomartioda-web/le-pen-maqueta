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

    // 2. Triple Tab Logic (Plan de Vida / Social)
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const parentSection = btn.closest('.view-section');
            const sectionBtns = parentSection.querySelectorAll('.tab-btn');
            const sectionContents = parentSection.querySelectorAll('.tab-content');

            // Remove active from all in this section
            sectionBtns.forEach(t => t.classList.remove('active'));
            sectionContents.forEach(c => c.classList.remove('active'));

            // Set specific active
            btn.classList.add('active');
            const targetContentId = btn.getAttribute('data-tab');
            const target = parentSection.querySelector(`#${targetContentId}`) || document.getElementById(targetContentId);
            if (target) target.classList.add('active');
        });
    });

    // 3. Collapsible Forms Logic
    const collapsibleHeaders = document.querySelectorAll('.collapsible-header');
    collapsibleHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const container = header.parentElement;
            container.classList.toggle('collapsed');
            
            // Update icon/text if needed
            const indicator = header.querySelector('.collapse-indicator');
            if (indicator) {
                indicator.textContent = container.classList.contains('collapsed') ? '➕ Abrir Formulario' : '➖ Cerrar Formulario';
            }
        });
    });

    // 4. Form Submission Feedback & Persistence
    const forms = document.querySelectorAll('.instrument-form');
    
    // Load saved data on startup
    forms.forEach(form => {
        const sectionId = form.closest('.view-section').id;
        const savedData = localStorage.getItem(`edp_data_${sectionId}`);
        
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                Object.keys(data).forEach(key => {
                    const input = form.querySelector(`[name="${key}"]`);
                    if (input) {
                        if (input.type === 'radio' || input.type === 'checkbox') {
                            const specificInput = form.querySelector(`[name="${key}"][value="${data[key]}"]`);
                            if (specificInput) specificInput.checked = true;
                        } else {
                            input.value = data[key];
                        }
                    }
                });
            } catch (e) { console.error("Error loading saved data", e); }
        }

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const sectionId = form.closest('.view-section').id;
            const formData = new FormData(form);
            const data = {};
            formData.forEach((value, key) => { data[key] = value; });
            
            // Save to localStorage
            localStorage.setItem(`edp_data_${sectionId}`, JSON.stringify(data));

            // Show Feedback
            const btn = form.querySelector('.btn-primary');
            const originalText = btn.innerHTML;
            btn.innerHTML = '✅ ¡Guardado con éxito!';
            btn.style.background = 'var(--status-green)';
            
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.background = '';
            }, 3000);
        });

        // Make the "Guardar" buttons actually trigger submit if they are type="button"
        const saveBtn = form.querySelector('.btn-primary');
        if (saveBtn && saveBtn.type === 'button') {
            saveBtn.addEventListener('click', () => {
                form.dispatchEvent(new Event('submit'));
            });
        }
    });
});

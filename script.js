document.addEventListener('DOMContentLoaded', () => {
    // 1. Intersection Observer settings for fade-in animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: stop observing once it's visible to keep it visible
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-in').forEach(section => {
        observer.observe(section);
    });

    // 2. Track which section is in view to update Header colors & Nav links
    const header = document.querySelector('.header');
    const sections = document.querySelectorAll('.section');
    const navLinks = document.querySelectorAll('.nav-links a');
    
    window.addEventListener('scroll', () => {
        let currentSection = '';
        let isDarkBg = false;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            // Check if user scrolled into the section
            if (pageYOffset >= (sectionTop - sectionHeight / 3)) {
                currentSection = section.getAttribute('id');
                isDarkBg = section.classList.contains('bg-black');
            }
        });

        // Update Header Background (Dark/Light mode)
        if (isDarkBg) {
            header.classList.add('dark-mode');
        } else {
            header.classList.remove('dark-mode');
        }

        // Update Active Nav Link styling
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    });
});

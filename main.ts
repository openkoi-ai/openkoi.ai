import './style.css';

const copyBtn = document.getElementById('copy-install');
if (copyBtn) {
    copyBtn.addEventListener('click', () => {
        const text = 'cargo install openkoi';
        navigator.clipboard.writeText(text).then(() => {
            const originalHtml = copyBtn.innerHTML;
            copyBtn.innerHTML = '<span>Copied!</span>';
            setTimeout(() => {
                copyBtn.innerHTML = originalHtml;
            }, 2000);
        });
    });
}

// Simple smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href')!);
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

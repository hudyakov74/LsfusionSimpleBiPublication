document.addEventListener('click', (e) => {
    // Проверяем, что кликнули по элементу с нужным классом
    const cell = e.target.closest('.data-grid-footer-cell, .pvtRowLabel, .pvtTotal, .pvtRowSubtotal, .pvtColSubtotal');

    if (cell) {
        const text = cell.innerText.trim();//.replace(/\u00a0/g, '').trim();
        navigator.clipboard.writeText(text).then(() => {
            // Визуальный фидбек
            const originalColor = cell.style.backgroundColor;
            cell.style.backgroundColor = '#d4edda';
            setTimeout(() => cell.style.backgroundColor = originalColor, 300);
        });
    }
});



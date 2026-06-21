if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('SW activo:', reg.scope))
            .catch(err => console.error('Error SW:', err));
    });
}

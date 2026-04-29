document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('dish-form');
    const badge = document.getElementById('status-badge');
    const queueContainer = document.getElementById('queue-state');
    const statsContainer = document.getElementById('stats-display');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const dish = {
                nombre: document.getElementById('nombre').value,
                tipo: document.getElementById('tipo').value,
                prioridad: parseInt(document.getElementById('prioridad').value)
            };
            
            // Validamos que el tipo existe en nuestra API local
            const ok = await RestaurantAPI.addPlatillo(dish);
            if (ok) { 
                form.reset(); 
                // Forzamos actualización inmediata para que no espere 3 segundos
                refreshUI(); 
            } else {
                alert("La cola está llena");
            }
        });
    }

    async function refreshUI() {
        try {
            const queue = await RestaurantAPI.getMostrador();
            const stats = await RestaurantAPI.getStats();
            
            if (queueContainer) renderQueue(queue, queueContainer);
            if (statsContainer) renderStats(stats, statsContainer);
            updateOnlineStatus(true, badge);
        } catch (e) {
            console.error("Error al actualizar UI:", e);
            updateOnlineStatus(false, badge);
        }
    }

    // Polling cada 3 segundos
    setInterval(refreshUI, 3000);
    refreshUI(); // Carga inicial
});

// Mantener estas funciones fuera para que sean accesibles
function updateOnlineStatus(online, badge) {
    if (!badge) return;
    badge.className = online ? 'online' : 'offline';
    // Cambiamos el texto porque ya no hay servidor Java, es "Local"
    badge.innerText = online ? 'Simulador Activo' : 'Error de Sistema';
}

function renderQueue(data, container) {
    const colas = data.colas;
    if (!colas) return;

    container.innerHTML = Object.entries(colas).map(([tipo, info]) => {
        const porcentaje = (info.cantidad / info.capacidad) * 100;
        return `
            <div class="queue-card ${info.cantidad === info.capacidad ? 'full' : ''}">
                <div class="queue-header">
                    <span>${tipo.toUpperCase()}</span>
                    <span>${info.cantidad}/${info.capacidad}</span>
                </div>
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill ${tipo}" style="width: ${porcentaje}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

function renderStats(stats, container) {
    container.innerHTML = `
        <div class="stat-item"><strong>Producidos</strong>: ${stats.producidos}</div>
        <div class="stat-item"><strong>Consumidos</strong>: ${stats.consumidos}</div>
    `;
}

async function consume(tipo) {
    try {
        const dish = await RestaurantAPI.getPlatillo(tipo);
        const log = document.getElementById('last-order');
        if (log) log.innerText = `¡Listo! Entregado: ${dish.nombre}`;
        // En una PWA local, llamamos manualmente a una actualización tras consumir
        // (O simplemente esperamos al intervalo de 3s)
    } catch (e) {
        alert("No hay platillos de ese tipo");
    }
}
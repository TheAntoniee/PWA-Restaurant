// Llave única para identificar los datos en el navegador
const STORAGE_KEY = 'restaurante_pwa_data';

// 1. Intentamos cargar datos previos, si no existen, usamos el estado inicial
const bkp = localStorage.getItem(STORAGE_KEY);
const MostradorLocal = bkp ? JSON.parse(bkp) : {
    colas: {
        caliente: { cantidad: 0, capacidad: 3, platillos: [] },
        frio: { cantidad: 0, capacidad: 3, platillos: [] },
        rapido: { cantidad: 0, capacidad: 3, platillos: [] }
    },
    estadisticas: { producidos: 0, consumidos: 0, expirados: 0 }
};

// Función auxiliar para guardar cambios automáticamente
const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(MostradorLocal));
};

const RestaurantAPI = {
    async addPlatillo(dish) {
        const cola = MostradorLocal.colas[dish.tipo];
        if (cola.cantidad < cola.capacidad) {
            cola.platillos.push({ ...dish, id: Date.now() });
            cola.cantidad++;
            MostradorLocal.estadisticas.producidos++;
            
            save(); // <--- Guardamos en LocalStorage
            return true;
        }
        return false;
    },

    async getPlatillo(tipo) {
        const cola = MostradorLocal.colas[tipo];
        if (cola && cola.cantidad > 0) {
            const p = cola.platillos.shift();
            cola.cantidad--;
            MostradorLocal.estadisticas.consumidos++;
            
            save(); // <--- Guardamos en LocalStorage
            return p;
        }
        throw new Error("Vacio");
    },

    async getMostrador() {
        return JSON.parse(JSON.stringify({ colas: MostradorLocal.colas }));
    },

    async getStats() {
        return { ...MostradorLocal.estadisticas };
    },

    // Función extra por si quieres resetear todo el restaurante
    async resetRestaurante() {
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
    }
};
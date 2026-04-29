# MOSTRADOR — PWA Frontend

Dashboard **Progressive Web App** para el sistema distribuido Productor-Consumidor  
(`ServidorRest.java`). Reemplaza el cliente REST de simulación por una interfaz interactiva.

---

## Estructura del proyecto

```
restaurante-pwa/
├── index.html         # Punto de entrada, estructura del dashboard
├── styles.css         # Estilos (design system industrial / dark terminal)
├── app.js             # Controlador principal (ES Module)
├── api.js             # Capa de abstracción REST
├── service-worker.js  # SW: cache-first (estáticos) + network-first (API)
├── manifest.json      # Configuración PWA
├── icon.svg           # Ícono vectorial (cualquier tamaño)
└── README.md
```

---

## Requisitos previos

| Dependencia           | Versión mínima |
|-----------------------|----------------|
| Java JDK              | 17+            |
| Navegador moderno     | Chrome 90+, Firefox 88+, Safari 15+ |
| Servidor HTTP estático| cualquiera     |

---

## 1. Levantar el servidor Java

```bash
# Compilar
javac ServidorRest.java

# Ejecutar
java ServidorRest
```

El servidor escucha en `http://localhost:8080`.

---

## 2. Servir el frontend

### Opción A — Python (más simple, sin HTTPS)

```bash
cd restaurante-pwa
python3 -m http.server 3000
# Abrir: http://localhost:3000
```

> **Nota**: En `localhost` los Service Workers funcionan sin HTTPS. En producción se requiere HTTPS (ver sección 5).

### Opción B — Node.js + `serve`

```bash
npx serve restaurante-pwa -p 3000
```

### Opción C — `live-server` (con hot-reload para desarrollo)

```bash
npx live-server restaurante-pwa --port=3000
```

---

## 3. CORS del servidor Java

El servidor ya incluye el header:

```
Access-Control-Allow-Origin: *
```

Si el frontend se sirve desde un origen diferente al servidor (p.ej. `localhost:3000` vs `localhost:8080`), CORS ya está habilitado.

---

## 4. Uso del Dashboard

### Panel: PRODUCIR PLATILLO
1. Escribir el nombre del platillo.
2. Seleccionar prioridad (1=Urgente, 2=Normal, 3=Baja).
3. Seleccionar tipo (Caliente / Rápido / Frío).
4. Presionar **ENVIAR AL MOSTRADOR** o tecla `Enter`.

### Panel: TOMAR PLATILLO
- Click en el botón del tipo deseado.
- Si la cola está vacía, se muestra advertencia.
- El platillo de mayor prioridad es entregado primero.

### Panel: ESTADO DEL MOSTRADOR
- Las barras de progreso reflejan el llenado de cada cola (capacidad = 3).
- Barra ámbar = normal; barra roja = llena.
- Auto-refresh cada 2 segundos (toggle para pausar).

### Panel: ESTADÍSTICAS
- Producidos, consumidos, expirados.
- Espera promedio en ms.
- Esperas de cocina/mesero (semáforos).
- Barra de eficiencia = consumidos / producidos × 100%.

### Log de actividad
- Historial de todas las operaciones con timestamp.
- Click **LIMPIAR** para vaciar.

### Cerrar restaurante
- Botón ⏻ CERRAR (esquina superior derecha).
- Requiere confirmación modal.
- Envía `DELETE /restaurante` al servidor.

---

## 5. PWA — HTTPS en producción

Los Service Workers **requieren HTTPS** fuera de `localhost`. Opciones:

### Opción A — Caddy (certificado automático)

```caddyfile
restaurante.example.com {
  root * /var/www/restaurante-pwa
  file_server
  reverse_proxy /platillos localhost:8080
  reverse_proxy /mostrador  localhost:8080
  reverse_proxy /estadisticas localhost:8080
  reverse_proxy /restaurante  localhost:8080
}
```

Con este setup, el frontend y la API quedan en el mismo dominio (sin CORS).

### Opción B — Nginx + Let's Encrypt

```nginx
server {
  listen 443 ssl;
  server_name restaurante.example.com;
  ssl_certificate     /etc/letsencrypt/live/restaurante.example.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/restaurante.example.com/privkey.pem;

  root /var/www/restaurante-pwa;
  index index.html;

  location ~ ^/(platillos|mostrador|estadisticas|restaurante) {
    proxy_pass http://localhost:8080;
  }
}
```

### Opción C — GitHub Pages / Netlify / Vercel

Sirven HTTPS automáticamente. Solo ajustar `BASE_URL` en `api.js`:

```js
// En api.js, primera línea de BASE_URL:
const stored = localStorage.getItem('api_base_url');
return stored || 'https://api.tu-dominio.com';
```

O bien cambiar `BASE_URL` vía `localStorage` desde la consola del navegador:

```js
localStorage.setItem('api_base_url', 'https://api.tu-servidor.com');
location.reload();
```

---

## 6. Instalar como PWA

1. Abrir la URL del frontend en Chrome/Edge.
2. En la barra de direcciones aparecerá el ícono de instalación (⊕).
3. Click → **Instalar**.
4. La app abre en ventana propia sin UI del navegador.

En iOS Safari: botón Compartir → **Añadir a la pantalla de inicio**.

---

## 7. Arquitectura y decisiones técnicas

| Aspecto | Decisión |
|---|---|
| Framework | Vanilla JS ES Modules — sin dependencias, bundle size 0 |
| State management | Objeto `state` mutable + DOM updates directos |
| Polling | `setInterval` cada 2 s (no WebSocket — servidor Java no lo implementa) |
| Cache SW | Cache-first para estáticos, Network-first para API |
| Offline fallback | `localStorage` como caché de último estado conocido |
| Concurrencia UI | Múltiples clicks independientes simulan productores/consumidores concurrentes |
| CORS | Manejado por el servidor Java (`Access-Control-Allow-Origin: *`) |

---

## 8. Endpoint reference

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/platillos` | Agrega un platillo `{nombre, prioridad, tipo}` |
| GET | `/platillos?tipo=<tipo>` | Toma el platillo de mayor prioridad del tipo indicado |
| GET | `/mostrador` | Estado actual de las 3 colas |
| GET | `/estadisticas` | Métricas acumuladas del sistema |
| DELETE | `/restaurante` | Cierra el servidor y vacía las colas |

Tipos válidos: `caliente`, `frio`, `rapido`  
Prioridades: `1` (URGENTE), `2` (NORMAL), `3` (BAJA)

---

## 9. Licencia

MIT — libre uso, modificación y distribución.

// Inicializa o mapa focado na Cratera Jezero
const map = L.map('mars-map', {
    center: [18.4447, 77.4508],
    zoom: 7,
    layers: [nasaLayers.viking]
});

// 1. Atualiza coordenadas ao mover o mouse
map.on('mousemove', (e) => {
    const lat = e.latlng.lat.toFixed(4);
    const lon = e.latlng.lng.toFixed(4);
    document.getElementById('coords-display').innerText = `LAT: ${lat}° | LON: ${lon}°`;
});

// 2. Alternar Camadas Base (Viking vs MOLA)
document.querySelectorAll('input[name="baseLayer"]').forEach((radio) => {
    radio.addEventListener('change', (e) => {
        if (e.target.value === 'viking') {
            map.removeLayer(nasaLayers.mola);
            map.addLayer(nasaLayers.viking);
        } else {
            map.removeLayer(nasaLayers.viking);
            map.addLayer(nasaLayers.mola);
        }
    });
});

// 3. Adicionar Pontos Científicos (Waypoints)
const waypointsGroup = L.layerGroup().addTo(map);

marsWaypoints.forEach((pt) => {
    const marker = L.circleMarker([pt.lat, pt.lon], {
        radius: 8,
        fillColor: pt.risk === "Alto" ? "#ef4444" : "#f97316",
        color: "#ffffff",
        weight: 2,
        fillOpacity: 0.9
    });

    marker.bindPopup(`
        <div class="font-sans">
            <span class="text-[10px] uppercase font-bold text-orange-400">${pt.type}</span>
            <h3 class="font-bold text-sm mt-0.5">${pt.name}</h3>
            <p class="text-xs text-slate-300 mt-1">${pt.science}</p>
            <div class="text-[11px] mt-2 font-mono text-slate-400">Risco de Terreno: <strong class="text-white">${pt.risk}</strong></div>
        </div>
    `);

    marker.addTo(waypointsGroup);
});

// Toggle de visibilidade dos pontos científicos
document.getElementById('toggle-waypoints').addEventListener('change', (e) => {
    if (e.target.checked) {
        map.addLayer(waypointsGroup);
    } else {
        map.removeLayer(waypointsGroup);
    }
});

// 4. Planejador de Rota EVA (Clique em A e B)
let routePoints = [];
let routeLine = null;
let routeMarkers = [];

map.on('click', (e) => {
    if (routePoints.length >= 2) {
        clearRoute();
    }

    routePoints.push(e.latlng);
    const marker = L.marker(e.latlng).addTo(map);
    routeMarkers.push(marker);

    if (routePoints.length === 2) {
        drawRouteAndCalculate();
    }
});

function drawRouteAndCalculate() {
    routeLine = L.polyline(routePoints, {
        color: '#38bdf8',
        weight: 3,
        dashArray: '6, 8'
    }).addTo(map);

    // Cálculo proporcional para o raio de Marte (aprox. 53% do raio da Terra)
    const earthDistanceMeters = routePoints[0].distanceTo(routePoints[1]);
    const marsDistanceKm = (earthDistanceMeters * 0.532) / 1000;

    // Simulação simples de gasto de O2 (ex: 4% por km caminhado)
    const o2Used = Math.min(100, Math.round(marsDistanceKm * 4.2));

    document.getElementById('route-distance').innerText = `${marsDistanceKm.toFixed(2)} km`;
    document.getElementById('route-o2').innerText = `${o2Used}%`;

    const statusEl = document.getElementById('route-status');
    if (o2Used > 75) {
        statusEl.innerText = "CRÍTICO (EXCEDE O₂)";
        statusEl.className = "text-red-500 font-bold";
    } else if (o2Used > 40) {
        statusEl.innerText = "ALERTA MODERADO";
        statusEl.className = "text-amber-400 font-bold";
    } else {
        statusEl.innerText = "SEGURO PARA EVA";
        statusEl.className = "text-emerald-400 font-bold";
    }
}

function clearRoute() {
    routePoints = [];
    if (routeLine) map.removeLayer(routeLine);
    routeMarkers.forEach(m => map.removeLayer(m));
    routeMarkers = [];
    document.getElementById('route-distance').innerText = "0.00 km";
    document.getElementById('route-o2').innerText = "0%";
    const statusEl = document.getElementById('route-status');
    statusEl.innerText = "AGUARDANDO ROTA";
    statusEl.className = "text-slate-500";
}

document.getElementById('clear-route').addEventListener('click', clearRoute);
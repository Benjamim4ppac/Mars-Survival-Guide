// Coordenadas de referência no Valles Marineris
const VIEWS = {
    global: { center: [-8.5, -68.0], zoom: 4 },    // Visão geral do Valles Marineris
    local:  { center: [-6.55, -70.85], zoom: 8 }   // Foco nítido no Candor Chasma Central
};

// Inicializa o mapa com a base de alta estabilidade
const map = L.map('mars-map', {
    center: VIEWS.local.center,
    zoom: VIEWS.local.zoom,
    minZoom: 2,
    maxZoom: 15,
    layers: [nasaLayers.viking]
});

// Painel de alta prioridade para rotas e alvos ficarem sempre por cima das camadas
map.createPane('missionOverlayPane');
map.getPane('missionOverlayPane').style.zIndex = 650;

// 1. Atualiza coordenadas reais no HUD ao mover o mouse
map.on('mousemove', (e) => {
    const lat = e.latlng.lat.toFixed(4);
    const lon = e.latlng.lng.toFixed(4);
    const latDir = lat >= 0 ? 'N' : 'S';
    const lonDir = lon >= 0 ? 'E' : 'W';
    document.getElementById('coords-display').innerText = 
        `LAT: ${Math.abs(lat)}° ${latDir} | LON: ${Math.abs(lon)}° ${lonDir}`;
});

// 2. Alternância entre Órbita Global e Setor Local (Candor Chasma)
const btnGlobal = document.getElementById('btn-view-global');
const btnLocal = document.getElementById('btn-view-local');

function setActiveScaleButton(mode) {
    if (mode === 'global') {
        btnGlobal.className = "px-3 py-1.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold transition";
        btnLocal.className = "px-3 py-1.5 rounded text-slate-400 hover:text-white transition";
    } else {
        btnLocal.className = "px-3 py-1.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold transition";
        btnGlobal.className = "px-3 py-1.5 rounded text-slate-400 hover:text-white transition";
    }
}

btnGlobal.addEventListener('click', () => {
    map.flyTo(VIEWS.global.center, VIEWS.global.zoom, { duration: 1.2 });
    setActiveScaleButton('global');
});

btnLocal.addEventListener('click', () => {
    map.flyTo(VIEWS.local.center, VIEWS.local.zoom, { duration: 1.2 });
    setActiveScaleButton('local');
});

// 3. Troca de Mosaicos Base (THEMIS, Viking, MOLA) mantendo rotas intactas
let currentBaseLayer = nasaLayers.themis;

document.querySelectorAll('input[name="baseLayer"]').forEach((radio) => {
    radio.addEventListener('change', (e) => {
        map.removeLayer(currentBaseLayer);
        currentBaseLayer = nasaLayers[e.target.value];
        map.addLayer(currentBaseLayer);
        currentBaseLayer.bringToBack();
    });
});

// Toggle da camada de relevo sombreado (Hillshade)
document.getElementById('toggle-hillshade').addEventListener('change', (e) => {
    if (e.target.checked) {
        map.addLayer(nasaLayers.hillshade);
    } else {
        map.removeLayer(nasaLayers.hillshade);
    }
});

// 4. Planejador de Rota EVA (Sobreposto a qualquer camada/escala)
let routePoints = [];
let routeLine = null;
let routeMarkers = [];

map.on('click', (e) => {
    if (routePoints.length >= 2) {
        clearRoute();
    }

    routePoints.push(e.latlng);
    const marker = L.circleMarker(e.latlng, {
        pane: 'missionOverlayPane',
        radius: 6,
        fillColor: '#38bdf8',
        color: '#ffffff',
        weight: 2,
        fillOpacity: 1
    }).addTo(map);
    
    routeMarkers.push(marker);

    if (routePoints.length === 2) {
        drawRouteAndCalculate();
    }
});

function drawRouteAndCalculate() {
    routeLine = L.polyline(routePoints, {
        pane: 'missionOverlayPane',
        color: '#38bdf8',
        weight: 3,
        dashArray: '6, 8'
    }).addTo(map);

    // Distância corrigida para o raio de Marte (0.532x raio da Terra)
    const earthDistanceMeters = routePoints[0].distanceTo(routePoints[1]);
    const marsDistanceKm = (earthDistanceMeters * 0.532) / 1000;

    // Consumo base estimado de O2 em terreno plano
    const o2Used = Math.min(100, Math.round(marsDistanceKm * 4.5));

    document.getElementById('route-distance').innerText = `${marsDistanceKm.toFixed(2)} km`;
    document.getElementById('route-o2').innerText = `${o2Used}%`;

    const statusEl = document.getElementById('route-status');
    if (o2Used > 80) {
        statusEl.innerText = "EXCEDE AUTONOMIA";
        statusEl.className = "text-red-500 font-bold";
    } else {
        statusEl.innerText = "ROTA TRAÇADA";
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
    statusEl.innerText = "AGUARDANDO PONTOS";
    statusEl.className = "text-slate-500";
}

document.getElementById('clear-route').addEventListener('click', clearRoute);
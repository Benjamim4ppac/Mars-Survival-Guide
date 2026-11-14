// Escalas de Visualização: Contexto Valles Marineris vs Perímetro Operacional de 200 km
const VIEWS = {
    global: { center: [-8.5, -68.0], zoom: 5 },    // Contexto do Valles Marineris
    local:  { center: [-6.62, -70.75], zoom: 9 }   // Enquadra exatamente o raio de 200 km no Candor Chasma
};

const map = L.map('mars-map', {
    center: VIEWS.local.center,
    zoom: VIEWS.local.zoom,
    minZoom: 3,
    maxZoom: 15,
    keyboard: false,
    layers: [nasaLayers.topo]
});

// Painéis hierárquicos
map.createPane('geologyPane');
map.getPane('geologyPane').style.zIndex = 450;

map.createPane('missionOverlayPane');
map.getPane('missionOverlayPane').style.zIndex = 650;

// ============================================================================
// PERÍMETRO OPERACIONAL DE 200 KM AO REDOR DA BASE CANDOR ALPHA
// (Em Marte, 1° de latitude equivale a ~59.2 km, então 200 km ≈ 3.38°;
//  para Leaflet L.circle que usa metros terrestres, 200 km marcianos ≈ 376.000 m terrestres)
// ============================================================================
const operationalPerimeter = L.circle([MISSION_CENTER.lat, MISSION_CENTER.lon], {
    pane: 'missionOverlayPane',
    radius: (MISSION_CENTER.radiusMarsKm * 1000) / 0.532,
    color: '#22d3ee',
    weight: 1.5,
    dashArray: '8, 8',
    fillColor: '#22d3ee',
    fillOpacity: 0.03,
    interactive: false
}).addTo(map);

// Anel intermediário de 100 km (Alcance de EVA a pé / rover leve sem recarga)
const innerPerimeter = L.circle([MISSION_CENTER.lat, MISSION_CENTER.lon], {
    pane: 'missionOverlayPane',
    radius: (100 * 1000) / 0.532,
    color: '#38bdf8',
    weight: 1,
    dashArray: '3, 6',
    fill: false,
    opacity: 0.5,
    interactive: false
}).addTo(map);

// ============================================================================
// MODELO DIGITAL DE ELEVAÇÃO (DEM) CALIBRADO COM DADOS MOLA DO CANDOR CHASMA
// ============================================================================
function getMarsElevationMOLA(lat, lon) {
    const canyonAxisLat = -6.0 + ((lon + 95.0) / 55.0) * -7.0;
    const distFromAxis = Math.abs(lat - canyonAxisLat);

    let baseElevation;
    if (distFromAxis < 1.2) {
        baseElevation = -4350 + (distFromAxis * 350);
    } else if (distFromAxis < 2.8) {
        const wallProgress = (distFromAxis - 1.2) / 1.6;
        baseElevation = -3930 + (wallProgress * 5400);
    } else {
        baseElevation = 1470 + Math.sin(lon * 0.5) * 320;
    }

    // Elevação do platô interno Candor Mensa
    const distCandorMensa = Math.hypot(lat - (-6.05), lon - (-70.90));
    if (distCandorMensa < 0.65) {
        baseElevation += (1 - distCandorMensa / 0.65) * 1650;
    }

    const microRelief = (Math.sin(lat * 18) * Math.cos(lon * 18)) * 120;
    return Math.round(baseElevation + microRelief);
}

// 1. Atualiza Coordenadas + Altitude MOLA + Distância da Base no HUD
function updateCoordsHUD(latlng) {
    const lat = latlng.lat.toFixed(4);
    const lon = latlng.lng.toFixed(4);
    const alt = getMarsElevationMOLA(latlng.lat, latlng.lng);
    const distFromBaseKm = ((latlng.distanceTo([MISSION_CENTER.lat, MISSION_CENTER.lon]) * 0.532) / 1000).toFixed(1);
    
    const latDir = lat >= 0 ? 'N' : 'S';
    const lonDir = lon >= 0 ? 'E' : 'W';
    
    document.getElementById('coords-display').innerHTML = 
        `LAT: ${Math.abs(lat)}° ${latDir} | LON: ${Math.abs(lon)}° ${lonDir} | <span class="text-amber-400 font-bold">ALT: ${alt.toLocaleString('pt-BR')} m</span> | <span class="text-cyan-300">BASE: ${distFromBaseKm} km</span>`;
}

map.on('mousemove', (e) => updateCoordsHUD(e.latlng));
map.on('move', () => updateCoordsHUD(map.getCenter()));

// 2. Alternância Global vs Local (200 km)
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

// 3. Troca de Mosaicos Base
let currentBaseLayer = nasaLayers.topo;
document.querySelectorAll('input[name="baseLayer"]').forEach((radio) => {
    radio.addEventListener('change', (e) => {
        const selected = e.target.value;
        if (nasaLayers[selected]) {
            map.removeLayer(currentBaseLayer);
            currentBaseLayer = nasaLayers[selected];
            map.addLayer(currentBaseLayer);
            currentBaseLayer.bringToBack();
        }
    });
});

document.getElementById('toggle-hillshade').addEventListener('change', (e) => {
    if (e.target.checked) {
        map.addLayer(nasaLayers.hillshade);
        nasaLayers.hillshade.bringToFront();
    } else {
        map.removeLayer(nasaLayers.hillshade);
    }
});

// 4. CAMADA GEOLÓGICA ESPECTRAL (Sem bordas duras — mesclada ao relevo)
const geologyLayersList = [];

const geologyGeoJsonLayer = L.geoJSON(vallesMarinerisGeology, {
    pane: 'geologyPane',
    style: (feature) => ({
        stroke: false, // Remove a linha de contorno geométrica ("polígono feio")
        fillColor: feature.properties.color,
        fillOpacity: 0.72
    }),
    onEachFeature: (feature, layer) => {
        const p = feature.properties;
        layer.bindPopup(`
            <div class="font-sans max-w-xs">
                <div class="flex items-center gap-2">
                    <span class="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded text-white" style="background:${p.color}">${p.code}</span>
                    <span class="text-[10px] uppercase font-bold text-slate-400">${p.mission}</span>
                </div>
                <h3 class="font-bold text-sm mt-1">${p.name}</h3>
                <div class="text-xs text-slate-300 mt-1"><strong>Mineralogia:</strong> ${p.mineral}</div>
                <div class="text-xs text-cyan-300 font-mono mt-1">Rendimento H₂O: ~${p.waterYieldLitersPerTon} L/ton</div>
                <div class="text-[11px] text-slate-400 mt-1"><strong>Extração:</strong> ${p.extractionMethod}</div>
                <p class="text-[11px] text-slate-300 mt-1.5 border-t border-slate-700 pt-1">${p.desc}</p>
            </div>
        `);
        geologyLayersList.push({ properties: p, layer: layer });
    }
}).addTo(map);

document.getElementById('toggle-hydro').addEventListener('change', (e) => {
    const legend = document.getElementById('hydro-legend');
    if (e.target.checked) {
        map.addLayer(geologyGeoJsonLayer);
        legend.style.display = 'block';
    } else {
        map.removeLayer(geologyGeoJsonLayer);
        legend.style.display = 'none';
    }
});

// 5. ALVOS DE EXTRAÇÃO ISRU (Dentro dos 200 km)
const targetsGroup = L.layerGroup().addTo(map);
const targetMarkers = [];

isruTargets.forEach((pt) => {
    const isBase = pt.type.includes("Habitat");
    const alt = getMarsElevationMOLA(pt.lat, pt.lon);
    const marker = L.circleMarker([pt.lat, pt.lon], {
        pane: 'missionOverlayPane',
        radius: isBase ? 8 : 6,
        fillColor: isBase ? "#10b981" : "#38bdf8",
        color: "#ffffff",
        weight: 2,
        fillOpacity: 1
    }).bindPopup(`
        <div class="font-sans">
            <span class="text-[10px] uppercase font-bold text-cyan-400">${pt.type}</span>
            <h3 class="font-bold text-sm mt-0.5">${pt.name}</h3>
            <div class="text-xs font-mono text-amber-300 mt-1">Altitude Local: ${alt.toLocaleString('pt-BR')} m</div>
            <div class="text-xs font-mono text-emerald-400">${pt.yield}</div>
            <p class="text-xs text-slate-300 mt-1">${pt.detail}</p>
        </div>
    `);
    marker.addTo(targetsGroup);
    targetMarkers.push({ pt, marker });
});

document.getElementById('toggle-targets').addEventListener('change', (e) => {
    e.target.checked ? map.addLayer(targetsGroup) : map.removeLayer(targetsGroup);
});

// 6. TELEMETRIA DE DESLOCAMENTO (Distância + Altitude Δh + Inclinação + O2 Real)
let routePoints = [];
let routeLine = null;
let routeMarkers = [];

function addRoutePoint(latlng) {
    if (routePoints.length >= 2) clearRoute();

    routePoints.push(latlng);
    const marker = L.circleMarker(latlng, {
        pane: 'missionOverlayPane',
        radius: 5,
        fillColor: '#f8fafc',
        color: '#0284c7',
        weight: 2,
        fillOpacity: 1
    }).addTo(map);
    
    routeMarkers.push(marker);

    if (routePoints.length === 2) drawRouteAndCalculate();
}

map.on('click', (e) => addRoutePoint(e.latlng));

function isPointInPolygon(latlng, polyLayer) {
    const latlngs = polyLayer.getLatLngs()[0];
    let inside = false;
    for (let i = 0, j = latlngs.length - 1; i < latlngs.length; j = i++) {
        const xi = latlngs[i].lat, yi = latlngs[i].lng;
        const xj = latlngs[j].lat, yj = latlngs[j].lng;
        const intersect = ((yi > latlng.lng) !== (yj > latlng.lng)) &&
            (latlng.lat < (xj - xi) * (latlng.lng - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

function drawRouteAndCalculate() {
    const p1 = routePoints[0];
    const p2 = routePoints[1];

    const marsDistanceMeters = p1.distanceTo(p2) * 0.532;
    const marsDistanceKm = marsDistanceMeters / 1000;

    // Verifica se a rota sai do perímetro de segurança de 200 km da base
    const distP2FromBaseKm = (p2.distanceTo([MISSION_CENTER.lat, MISSION_CENTER.lon]) * 0.532) / 1000;
    const outOfRange = distP2FromBaseKm > MISSION_CENTER.radiusMarsKm;

    // Amostragem de 10 segmentos para altitude e inclinação
    const steps = 10;
    const stepDistanceMeters = marsDistanceMeters / steps;
    let totalClimbMeters = 0;
    let maxSlopeDeg = 0;

    let prevAlt = getMarsElevationMOLA(p1.lat, p1.lng);
    const startAlt = prevAlt;

    for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const sampleLat = p1.lat + (p2.lat - p1.lat) * t;
        const sampleLon = p1.lng + (p2.lng - p1.lng) * t;
        const currentAlt = getMarsElevationMOLA(sampleLat, sampleLon);
        
        const deltaH = currentAlt - prevAlt;
        if (deltaH > 0) totalClimbMeters += deltaH;

        if (stepDistanceMeters > 0) {
            const slopeRad = Math.atan(Math.abs(deltaH) / stepDistanceMeters);
            const slopeDeg = slopeRad * (180 / Math.PI);
            if (slopeDeg > maxSlopeDeg) maxSlopeDeg = slopeDeg;
        }
        prevAlt = currentAlt;
    }

    const netElevationChange = prevAlt - startAlt;

    // Consumo real de O2 (Tanque xEMU = 540g utilizáveis: 25g/km + 0.18g/m subida)
    const o2Grams = Math.round((marsDistanceKm * 25) + (totalClimbMeters * 0.18));
    const o2Percent = Math.min(100, Math.round((o2Grams / 540) * 100));

    const isDangerous = maxSlopeDeg > 20 || o2Percent > 85 || outOfRange;
    routeLine = L.polyline(routePoints, {
        pane: 'missionOverlayPane',
        color: isDangerous ? '#ef4444' : '#38bdf8',
        weight: 3.5,
        dashArray: '6, 8'
    }).addTo(map);

    document.getElementById('route-distance').innerText = `${marsDistanceKm.toFixed(2)} km ${outOfRange ? '(FORA DE 200km!)' : ''}`;
    
    const sign = netElevationChange >= 0 ? '+' : '';
    document.getElementById('route-elevation').innerText = `${sign}${netElevationChange} m (Subida: ${totalClimbMeters}m)`;
    
    const slopeEl = document.getElementById('route-slope');
    slopeEl.innerText = `${maxSlopeDeg.toFixed(1)}° ${maxSlopeDeg > 20 ? '(ÍNGREME!)' : ''}`;
    slopeEl.className = maxSlopeDeg > 20 ? "text-red-400 font-bold" : "text-emerald-400 font-bold";

    const o2El = document.getElementById('route-o2');
    o2El.innerText = `${o2Grams}g / 540g (${o2Percent}%)`;
    o2El.className = o2Percent > 85 ? "text-red-500 font-bold" : "text-cyan-400 font-bold";

    // Verifica reserva hídrica no destino
    let foundGeo = null;
    geologyLayersList.forEach((item) => {
        if (isPointInPolygon(p2, item.layer)) {
            foundGeo = item.properties;
        }
    });

    const resEl = document.getElementById('route-resource');
    const yieldEl = document.getElementById('route-yield');

    if (foundGeo) {
        resEl.innerText = `[${foundGeo.code}] ${foundGeo.mineral.split(' ')[0]}`;
        resEl.className = "text-cyan-300 font-bold text-right";
        yieldEl.innerText = `~${foundGeo.waterYieldLitersPerTon} L/ton`;
    } else {
        resEl.innerText = "SOLO SECO / PLATÔ";
        resEl.className = "text-slate-400 text-right";
        yieldEl.innerText = "0 L/ton";
    }
}

function clearRoute() {
    routePoints = [];
    if (routeLine) map.removeLayer(routeLine);
    routeMarkers.forEach(m => map.removeLayer(m));
    routeMarkers = [];
    document.getElementById('route-distance').innerText = "0.00 km";
    document.getElementById('route-elevation').innerText = "0 m";
    document.getElementById('route-slope').innerText = "0.0°";
    document.getElementById('route-slope').className = "text-slate-200 font-bold";
    document.getElementById('route-o2').innerText = "0g (0%)";
    document.getElementById('route-o2').className = "text-cyan-400 font-bold";
    document.getElementById('route-resource').innerText = "--";
    document.getElementById('route-resource').className = "text-slate-500 text-right";
    document.getElementById('route-yield').innerText = "0 L/ton";
}

document.getElementById('clear-route').addEventListener('click', clearRoute);

// 7. NAVEGAÇÃO E CONTROLE COMPLETO POR TECLADO
const baseLayerOrder = ['topo', 'viking', 'mola'];
let baseLayerIndex = 0;

window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter'].includes(e.code)) {
        e.preventDefault();
    }

    const key = e.key.toLowerCase();
    const panStep = 140;

    if (key === 'w' || e.key === 'ArrowUp') {
        map.panBy([0, -panStep], { animate: true, duration: 0.25 });
    } else if (key === 's' || e.key === 'ArrowDown') {
        map.panBy([0, panStep], { animate: true, duration: 0.25 });
    } else if (key === 'a' || e.key === 'ArrowLeft') {
        map.panBy([-panStep, 0], { animate: true, duration: 0.25 });
    } else if (key === 'd' || e.key === 'ArrowRight') {
        map.panBy([panStep, 0], { animate: true, duration: 0.25 });
    } else if (key === '+' || key === '=') {
        map.zoomIn();
    } else if (key === '-') {
        map.zoomOut();
    } else if (key === 'c' || e.key === 'Home') {
        btnLocal.click();
    } else if (key === 'g') {
        btnGlobal.click();
    } else if (key === 'l') {
        btnLocal.click();
    } else if (e.key === 'Enter' || e.code === 'Space') {
        addRoutePoint(map.getCenter());
    } else if (['1', '2', '3', '4'].includes(key)) {
        const idx = parseInt(key, 10) - 1;
        const item = targetMarkers[idx];
        if (item) {
            map.flyTo([item.pt.lat, item.pt.lon], 10, { duration: 0.8 });
            item.marker.openPopup();
        }
    } else if (key === 'h') {
        document.getElementById('toggle-hydro').click();
    } else if (key === 'i') {
        document.getElementById('toggle-targets').click();
    } else if (key === 'r') {
        document.getElementById('toggle-hillshade').click();
    } else if (key === 'b') {
        baseLayerIndex = (baseLayerIndex + 1) % baseLayerOrder.length;
        document.querySelector(`input[name="baseLayer"][value="${baseLayerOrder[baseLayerIndex]}"]`)?.click();
    } else if (key === 'x' || e.key === 'Escape') {
        clearRoute();
    }
});
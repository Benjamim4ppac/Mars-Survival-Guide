const map = L.map('mars-map', {
    center: [18.4480, 77.4380],
    zoom: 12, // Zoom mais próximo na Cratera Jezero
    layers: [nasaLayers.viking]
});

// 1. Coordenadas em tempo real
map.on('mousemove', (e) => {
    document.getElementById('coords-display').innerText = 
        `LAT: ${e.latlng.lat.toFixed(4)}° N | LON: ${e.latlng.lng.toFixed(4)}° E`;
});

// 2. Camadas Base e Overlays
document.querySelectorAll('input[name="baseLayer"]').forEach((radio) => {
    radio.addEventListener('change', (e) => {
        map.removeLayer(e.target.value === 'viking' ? nasaLayers.mola : nasaLayers.viking);
        map.addLayer(nasaLayers[e.target.value]);
    });
});

document.getElementById('toggle-hillshade').addEventListener('change', (e) => {
    e.target.checked ? map.addLayer(nasaLayers.hillshade) : map.removeLayer(nasaLayers.hillshade);
});

// 3. Camada de Inclinação e Terreno (Polígonos)
const hazardsGroup = L.layerGroup().addTo(map);
const hazardPolygons = [];

terrainHazards.forEach((hz) => {
    const poly = L.polygon(hz.coords, {
        color: hz.color,
        fillColor: hz.color,
        fillOpacity: 0.28,
        weight: 2,
        dashArray: hz.type === 'terrain' ? '4, 4' : null
    }).bindPopup(`
        <div class="font-sans">
            <span class="text-[10px] uppercase font-bold" style="color:${hz.color}">${hz.riskLevel}</span>
            <h3 class="font-bold text-sm mt-0.5">${hz.name}</h3>
            <p class="text-xs text-slate-300 mt-1">Inclinação média: <strong>${hz.slopeDeg}°</strong></p>
            <p class="text-xs text-slate-300">Penalidade de O₂: <strong>+${Math.round((hz.o2Multiplier - 1)*100)}%</strong></p>
        </div>
    `);
    poly.addTo(hazardsGroup);
    hazardPolygons.push({ data: hz, layer: poly });
});

document.getElementById('toggle-hazards').addEventListener('change', (e) => {
    e.target.checked ? map.addLayer(hazardsGroup) : map.removeLayer(hazardsGroup);
});

// 4. Camada de Alvos Científicos (CRISM)
const waypointsGroup = L.layerGroup().addTo(map);

marsWaypoints.forEach((pt) => {
    const marker = L.circleMarker([pt.lat, pt.lon], {
        radius: 7,
        fillColor: "#06b6d4",
        color: "#ffffff",
        weight: 2,
        fillOpacity: 0.95
    }).bindPopup(`
        <div class="font-sans">
            <span class="text-[10px] uppercase font-bold text-cyan-400">${pt.category}</span>
            <h3 class="font-bold text-sm mt-0.5">${pt.name}</h3>
            <div class="text-[11px] text-amber-300 font-mono mt-1">Mineral: ${pt.mineral}</div>
            <p class="text-xs text-slate-300 mt-1">${pt.desc}</p>
            <div class="text-[11px] mt-2 font-mono text-emerald-400">Valor Científico: ${pt.scienceScore}/100 pts</div>
        </div>
    `);
    marker.addTo(waypointsGroup);
});

document.getElementById('toggle-waypoints').addEventListener('change', (e) => {
    e.target.checked ? map.addLayer(waypointsGroup) : map.removeLayer(waypointsGroup);
});

// 5. Simulador Climático (MEDA)
let weatherMultiplier = 1.0;
const weatherData = {
    nominal: { temp: "-63 °C", wind: "4.2 m/s NE", uv: "ALTA (8.4)", tau: "0.42 (Boa)", mult: 1.0, filter: "none" },
    dusty:   { temp: "-58 °C", wind: "14.8 m/s E", uv: "MOD (5.1)",  tau: "1.65 (Turva)", mult: 1.25, filter: "sepia(0.35) brightness(0.9)" },
    storm:   { temp: "-51 °C", wind: "28.5 m/s E", uv: "BAIXA (2.0)", tau: "4.10 (CRÍTICO)", mult: 1.75, filter: "sepia(0.75) contrast(1.1) brightness(0.65)" }
};

document.getElementById('weather-scenario').addEventListener('change', (e) => {
    const w = weatherData[e.target.value];
    weatherMultiplier = w.mult;
    document.getElementById('meda-temp').innerText = w.temp;
    document.getElementById('meda-wind').innerText = w.wind;
    document.getElementById('meda-uv').innerText = w.uv;
    document.getElementById('meda-tau').innerText = w.tau;
    
    // Efeito visual atmosférico direto sobre o mapa
    document.getElementById('mars-map').style.filter = w.filter;

    if (routePoints.length === 2) drawRouteAndCalculate();
});

// 6. Planejador de Rota Inteligente (Cruza Distância + Terreno + Ciência + Clima)
let routePoints = [];
let routeLine = null;
let routeMarkers = [];

map.on('click', (e) => {
    if (routePoints.length >= 2) clearRoute();
    routePoints.push(e.latlng);
    routeMarkers.push(L.marker(e.latlng).addTo(map));
    if (routePoints.length === 2) drawRouteAndCalculate();
});

function drawRouteAndCalculate() {
    if (routeLine) map.removeLayer(routeLine);

    // Verifica se algum ponto da rota cai dentro de zona de risco/inclinação
    let terrainMultiplier = 1.0;
    let hazardAlert = "";

    hazardPolygons.forEach(({ data, layer }) => {
        const bounds = layer.getBounds();
        if (bounds.contains(routePoints[0]) || bounds.contains(routePoints[1])) {
            terrainMultiplier = Math.max(terrainMultiplier, data.o2Multiplier);
            hazardAlert = data.name;
        }
    });

    // Verifica proximidade com alvos científicos (raio de ~800m marcianos)
    let scienceGained = 0;
    marsWaypoints.forEach((pt) => {
        const ptLatLng = L.latLng(pt.lat, pt.lon);
        const d1 = routePoints[0].distanceTo(ptLatLng) * 0.532;
        const d2 = routePoints[1].distanceTo(ptLatLng) * 0.532;
        if (d1 < 800 || d2 < 800) scienceGained += pt.scienceScore;
    });

    const marsDistanceKm = (routePoints[0].distanceTo(routePoints[1]) * 0.532) / 1000;
    const o2Used = Math.min(100, Math.round(marsDistanceKm * 6.5 * terrainMultiplier * weatherMultiplier));

    routeLine = L.polyline(routePoints, {
        color: o2Used > 75 ? '#ef4444' : '#38bdf8',
        weight: 4,
        dashArray: '8, 8'
    }).addTo(map);

    document.getElementById('route-distance').innerText = `${marsDistanceKm.toFixed(2)} km`;
    document.getElementById('route-o2').innerText = `${o2Used}% ${terrainMultiplier > 1 ? '(Terreno Íngreme!)' : ''}`;

    const statusEl = document.getElementById('route-status');
    if (o2Used > 75 || weatherMultiplier >= 1.75) {
        statusEl.innerText = hazardAlert ? `PERIGO: ${hazardAlert.toUpperCase()}` : "ABORTAR / RISCO CRÍTICO";
        statusEl.className = "text-red-500 font-bold";
    } else {
        statusEl.innerText = `SEGURO (+${scienceGained} PTS CIÊNCIA)`;
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
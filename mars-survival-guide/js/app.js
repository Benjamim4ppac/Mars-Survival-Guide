// ============================================================================
// 1. CONFIGURAÇÃO DO MAPA E ESCALAS DE VISUALIZAÇÃO
// ============================================================================
const VIEWS = {
    global: { center: [-10.0, -66.0], zoom: 5 },
    local:  { center: [-6.50, -71.00], zoom: 9 }
};

const map = L.map('mars-map', {
    center: VIEWS.local.center,
    zoom: VIEWS.local.zoom,
    minZoom: 3,
    maxZoom: 15,
<<<<<<< Updated upstream
    keyboard: false,
    layers: [nasaLayers.topo]
=======
    preferCanvas: true,
    layers: [nasaLayers.topo, nasaLayers.hillshade]
>>>>>>> Stashed changes
});

map.createPane('geologyPane');
map.getPane('geologyPane').style.zIndex = 450;

map.createPane('missionOverlayPane');
map.getPane('missionOverlayPane').style.zIndex = 650;

const geologyGroup = L.layerGroup().addTo(map);
const targetsGroup = L.layerGroup().addTo(map);

// ============================================================================
// 2. MODELO DIGITAL DE ELEVAÇÃO (DEM) MOLA E HUD SUPERIOR
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

    const distCandorMensa = Math.hypot(lat - (-6.05), lon - (-70.90));
    if (distCandorMensa < 0.65) {
        baseElevation += (1 - distCandorMensa / 0.65) * 1650;
    }

    const microRelief = (Math.sin(lat * 18) * Math.cos(lon * 18)) * 120;
    return Math.round(baseElevation + microRelief);
}

<<<<<<< Updated upstream
// 1. Atualiza Coordenadas + Altitude MOLA + Distância da Base no HUD
function updateCoordsHUD(latlng) {
    const lat = latlng.lat.toFixed(4);
    const lon = latlng.lng.toFixed(4);
    const alt = getMarsElevationMOLA(latlng.lat, latlng.lng);
    const distFromBaseKm = ((latlng.distanceTo([MISSION_CENTER.lat, MISSION_CENTER.lon]) * 0.532) / 1000).toFixed(1);
=======
map.on('mousemove', (e) => {
    const lat = e.latlng.lat.toFixed(4);
    const lon = e.latlng.lng.toFixed(4);
    const alt = getMarsElevationMOLA(e.latlng.lat, e.latlng.lng);
    const distFromBaseKm = distanciaMarteKm(e.latlng, L.latLng(MISSION_CENTER.lat, MISSION_CENTER.lon)).toFixed(1);
>>>>>>> Stashed changes
    
    const latDir = lat >= 0 ? 'N' : 'S';
    const lonDir = lon >= 0 ? 'E' : 'W';
    
<<<<<<< Updated upstream
    document.getElementById('coords-display').innerHTML = 
        `LAT: ${Math.abs(lat)}° ${latDir} | LON: ${Math.abs(lon)}° ${lonDir} | <span class="text-amber-400 font-bold">ALT: ${alt.toLocaleString('pt-BR')} m</span> | <span class="text-cyan-300">BASE: ${distFromBaseKm} km</span>`;
}

map.on('mousemove', (e) => updateCoordsHUD(e.latlng));
map.on('move', () => updateCoordsHUD(map.getCenter()));
=======
    const coordsEl = document.getElementById('coords-display');
    if (coordsEl) {
        coordsEl.innerHTML = 
            `LAT: ${Math.abs(lat)}° ${latDir} | LON: ${Math.abs(lon)}° ${lonDir} | <span class="text-amber-400 font-bold">ALT: ${alt.toLocaleString('pt-BR')} m</span> | <span class="text-cyan-300">BASE: ${distFromBaseKm} km</span>`;
    }
});
>>>>>>> Stashed changes

const btnGlobal = document.getElementById('btn-view-global');
const btnLocal = document.getElementById('btn-view-local');

function setActiveScaleButton(mode) {
    if (!btnGlobal || !btnLocal) return;
    if (mode === 'global') {
        btnGlobal.className = "px-3 py-1.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold transition";
        btnLocal.className = "px-3 py-1.5 rounded text-slate-400 hover:text-white transition";
    } else {
        btnLocal.className = "px-3 py-1.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold transition";
        btnGlobal.className = "px-3 py-1.5 rounded text-slate-400 hover:text-white transition";
    }
}

if (btnGlobal) {
    btnGlobal.addEventListener('click', () => {
        map.flyTo(VIEWS.global.center, VIEWS.global.zoom, { duration: 1.2 });
        setActiveScaleButton('global');
    });
}

if (btnLocal) {
    btnLocal.addEventListener('click', () => {
        map.flyTo(VIEWS.local.center, VIEWS.local.zoom, { duration: 1.2 });
        setActiveScaleButton('local');
    });
}

// ============================================================================
// 3. CONTROLES DOS BOTÕES DA BARRA LATERAL
// ============================================================================
const toggleHydroEl = document.getElementById('toggle-hydro');
if (toggleHydroEl) {
    toggleHydroEl.addEventListener('change', (e) => {
        const legendBox = document.getElementById('hydro-legend');
        if (e.target.checked) {
            map.addLayer(geologyGroup);
            if (legendBox) legendBox.style.display = 'block';
        } else {
            map.removeLayer(geologyGroup);
            if (legendBox) legendBox.style.display = 'none';
        }
    });
}

const toggleTargetsEl = document.getElementById('toggle-targets');
if (toggleTargetsEl) {
    toggleTargetsEl.addEventListener('change', (e) => {
        if (e.target.checked) map.addLayer(targetsGroup);
        else map.removeLayer(targetsGroup);
    });
}

const toggleHillshadeEl = document.getElementById('toggle-hillshade');
if (toggleHillshadeEl) {
    toggleHillshadeEl.addEventListener('change', (e) => {
        if (e.target.checked) {
            map.addLayer(nasaLayers.hillshade);
            nasaLayers.hillshade.bringToFront();
        } else {
            map.removeLayer(nasaLayers.hillshade);
        }
    });
}

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

// ============================================================================
// 4. CATÁLOGO GEOLÓGICO OFICIAL (J. F. McCauley, 1978 - USGS Coprates)
// ============================================================================
const geologyLayersList = [];

const geologyCatalog = {
    "ch": {
        code: "CH",
        name: "Channel Material (Canais Fluviais)",
        mineral: "Sedimentos Aluviais & Filossilicatos Hidratados",
        waterYieldLitersPerTon: 130,
        extractionMethod: "Escavação rasa + dessorção térmica",
        color: "#06b6d4",
        mission: "USGS Coprates (1978)",
        desc: "Canais sinuosos escavados por fluxo de água líquida antiga; maior potencial hídrico."
    },
    "vl": {
        code: "VL",
        name: "Layered Canyon (Camadas Hidratadas)",
        mineral: "Sulfatos Poli-hidratados (Kieserita/Gipsita) & Sedimentos",
        waterYieldLitersPerTon: 115,
        extractionMethod: "Aquecimento térmico (150°C–250°C)",
        color: "#f97316",
        mission: "USGS Coprates (1978)",
        desc: "Depósitos estratificados lacustres no interior de Candor Chasma ricos em água estrutural."
    },
    "vf": {
        code: "VF",
        name: "Canyon Floor (Fundo Plano do Cânion)",
        mineral: "Regolito Plano & Depósitos Eólicos/Fluviais",
        waterYieldLitersPerTon: 65,
        extractionMethod: "Zona Segura de Pouso + Processamento ISRU",
        color: "#10b981",
        mission: "USGS Coprates (1978)",
        desc: "Superfície plana no fundo de Valles Marineris; ideal para pouso tripulado."
    },
    "vs": {
        code: "VS",
        name: "Slide Material (Deslizamentos)",
        mineral: "Brechas de Desabamento & Crosta Estratificada",
        waterYieldLitersPerTon: 50,
        extractionMethod: "Coleta de blocos superficiais",
        color: "#eab308",
        mission: "USGS Coprates (1978)",
        desc: "Material de escorregamento das paredes do cânion."
    },
    "vw": {
        code: "VW",
        name: "Canyon Wall (Paredes Íngremes)",
        mineral: "Rocha Crustal Basáltica Ravinada",
        waterYieldLitersPerTon: 20,
        extractionMethod: "ZONA DE RISCO — Inclinação Extrema",
        color: "#ef4444",
        mission: "USGS Coprates (1978)",
        desc: "Encostas íngremes das paredes de Valles Marineris; evitar travessia."
    },
    "pc": {
        code: "PC",
        name: "Cratered Plains (Planície Craterizada)",
        mineral: "Basalto Vulcânico & Regolito de Planalto",
        waterYieldLitersPerTon: 25,
        extractionMethod: "Amostragem de planalto",
        color: "#a855f7",
        mission: "USGS Coprates (1978)",
        desc: "Planície antiga craterizada no planalto acima do cânion."
    },
    "p": {
        code: "P",
        name: "Plains Material (Planície Lisa)",
        mineral: "Derrames Basálticos & Cobertura Eólica",
        waterYieldLitersPerTon: 20,
        extractionMethod: "Amostragem de superfície",
        color: "#ec4899",
        mission: "USGS Coprates (1978)",
        desc: "Planície lisa de planalto."
    },
    "pr": {
        code: "PR",
        name: "Ridged Plains (Planície com Cristas)",
        mineral: "Basaltos Tipo Mare com Cristas Tectônicas",
        waterYieldLitersPerTon: 20,
        extractionMethod: "Amostragem geológica",
        color: "#6366f1",
        mission: "USGS Coprates (1978)",
        desc: "Planície vulcânica deformada por cristas compressivas."
    },
    "c1": {
        code: "C1",
        name: "Old Crater (Crateras Antigas)",
        mineral: "Material de Impacto Erodido",
        waterYieldLitersPerTon: 15,
        extractionMethod: "Baixo potencial hídrico",
        color: "#64748b",
        mission: "USGS Coprates (1978)",
        desc: "Crateras de impacto antigas fortemente degradadas."
    },
    "c2": {
        code: "C2",
        name: "Subdued Crater (Crateras Degradadas)",
        mineral: "Preenchimento Sedimentar de Impacto",
        waterYieldLitersPerTon: 15,
        extractionMethod: "Baixo potencial hídrico",
        color: "#38bdf8",
        mission: "USGS Coprates (1978)",
        desc: "Crateras > 50 km com fundos planos modificados por erosão."
    }
};

const extraPalette = ["#d946ef", "#14b8a6", "#84cc16", "#f43f5e", "#0ea5e9", "#f59e0b"];

function garantirUnidadeNoCatalogo(uName, idx) {
    const key = String(uName).toLowerCase();
    if (geologyCatalog[key]) return geologyCatalog[key];

    const cor = extraPalette[idx % extraPalette.length];
    geologyCatalog[key] = {
        code: String(uName).toUpperCase(),
        name: `Unidade Geológica (${String(uName).toUpperCase()})`,
        mineral: "Composição Basáltica / Sedimentar",
        waterYieldLitersPerTon: 30,
        extractionMethod: "Amostragem de superfície",
        color: cor,
        mission: "USGS Coprates (1978)",
        desc: `Unidade mapeada na carta de Coprates (Sigla: ${uName}).`
    };
    return geologyCatalog[key];
}

const MARS_RADIUS = 3396190;
const RAIO_MATERIAIS_KM = 400;

function geoCoordsToLatLng(coords) {
    const x = coords[0];
    const y = coords[1];
    if (Math.abs(x) <= 360 && Math.abs(y) <= 90) return L.latLng(y, x);
    const lon = (x / MARS_RADIUS) * (180 / Math.PI);
    const lat = (y / MARS_RADIUS) * (180 / Math.PI);
    return L.latLng(lat, lon);
}

function pegarCentroSeguro(geometry) {
    if (!geometry || !geometry.coordinates) return null;
    const pontos = [];
    const coletar = (arr) => {
        if (!Array.isArray(arr) || arr.length === 0) return;
        if (typeof arr[0] === 'number' && typeof arr[1] === 'number') {
            pontos.push(geoCoordsToLatLng(arr));
        } else {
            for (let i = 0; i < arr.length; i += 2) coletar(arr[i]);
        }
    };
    coletar(geometry.coordinates);
    if (pontos.length === 0) return null;

    let somaLat = 0, somaLng = 0;
    for (const pt of pontos) {
        somaLat += pt.lat;
        somaLng += pt.lng;
    }
    return L.latLng(somaLat / pontos.length, somaLng / pontos.length);
}

function distanciaMarteKm(latlng1, latlng2) {
    const R = 3396.19;
    const dLat = (latlng2.lat - latlng1.lat) * Math.PI / 180;
    const dLon = (latlng2.lng - latlng1.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(latlng1.lat * Math.PI / 180) * Math.cos(latlng2.lat * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function identificarSetorMarte(lat, lon) {
    if (lat >= -8.5 && lat <= -4.5 && lon >= -77.0 && lon <= -67.0) return "Setor Candor Chasma";
    if (lat >= -4.5 && lat <= -2.5 && lon >= -76.0 && lon <= -69.0) return "Setor Ophir Chasma";
    if (lat >= -13.5 && lat <= -8.5 && lon >= -78.0 && lon <= -69.0) return "Setor Melas Chasma";
    if (lat >= -15.5 && lat <= -10.5 && lon >= -69.0 && lon <= -53.0) return "Setor Coprates Chasma";
    return "Setor Candor / Valles Marineris";
}

// ============================================================================
// 5. ALGORITMO A* (PATHFINDING OTIMIZADO PELO RELEVO E GEOLOGIA)
// ============================================================================
function isPointInRing(latlng, ring) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const xi = ring[i].lat, yi = ring[i].lng;
        const xj = ring[j].lat, yj = ring[j].lng;
        const intersect = ((yi > latlng.lng) !== (yj > latlng.lng)) &&
            (latlng.lat < (xj - xi) * (latlng.lng - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

function isPointInPolygon(latlng, polyLayer) {
    const latlngs = polyLayer.getLatLngs();
    if (!latlngs || !latlngs.length) return false;
    const polygons = Array.isArray(latlngs[0][0]) ? latlngs : [latlngs];
    return polygons.some(poly => isPointInRing(latlng, poly[0]));
}

function consultarGeologiaNoPonto(latlng) {
    for (let i = 0; i < geologyLayersList.length; i++) {
        if (isPointInPolygon(latlng, geologyLayersList[i].layer)) {
            return geologyLayersList[i].properties;
        }
    }
    return null;
}

// Calcula a melhor rota curva (A*) evitando subidas íngremes e paredes do cânion (VW)
function calcularMelhorRotaAStar(inicioLatLng, fimLatLng) {
    const GRID_SIZE = 24; // Grade 24x24 de alta resolução entre origem e destino
    const padLat = Math.max(0.18, Math.abs(fimLatLng.lat - inicioLatLng.lat) * 0.45);
    const padLng = Math.max(0.18, Math.abs(fimLatLng.lng - inicioLatLng.lng) * 0.45);

    const minLat = Math.min(inicioLatLng.lat, fimLatLng.lat) - padLat;
    const maxLat = Math.max(inicioLatLng.lat, fimLatLng.lat) + padLat;
    const minLng = Math.min(inicioLatLng.lng, fimLatLng.lng) - padLng;
    const maxLng = Math.max(inicioLatLng.lng, fimLatLng.lng) + padLng;

    const dLat = (maxLat - minLat) / GRID_SIZE;
    const dLng = (maxLng - minLng) / GRID_SIZE;

    const toGrid = (ll) => ({
        r: Math.max(0, Math.min(GRID_SIZE, Math.round((ll.lat - minLat) / dLat))),
        c: Math.max(0, Math.min(GRID_SIZE, Math.round((ll.lng - minLng) / dLng)))
    });

    const toLatLng = (r, c) => L.latLng(minLat + r * dLat, minLng + c * dLng);

    const startNode = toGrid(inicioLatLng);
    const goalNode = toGrid(fimLatLng);

    // Pré-calcula altitude e custo geológico de cada nó da grade
    const elevGrid = Array.from({ length: GRID_SIZE + 1 }, (_, r) =>
        Array.from({ length: GRID_SIZE + 1 }, (_, c) => {
            const pt = toLatLng(r, c);
            return getMarsElevationMOLA(pt.lat, pt.lng);
        })
    );

    const key = (r, c) => `${r},${c}`;
    const openSet = [{ r: startNode.r, c: startNode.c, f: 0 }];
    const cameFrom = {};
    const gScore = { [key(startNode.r, startNode.c)]: 0 };

    const dirs = [
        [-1, 0], [1, 0], [0, -1], [0, 1],
        [-1, -1], [-1, 1], [1, -1], [1, 1]
    ];

    let iter = 0;
    while (openSet.length > 0 && iter < 3000) {
        iter++;
        openSet.sort((a, b) => a.f - b.f);
        const current = openSet.shift();

        if (current.r === goalNode.r && current.c === goalNode.c) {
            // Reconstrói o caminho ótimo
            const path = [fimLatLng];
            let currKey = key(current.r, current.c);
            while (cameFrom[currKey]) {
                const prev = cameFrom[currKey];
                if (prev.r !== startNode.r || prev.c !== startNode.c) {
                    path.unshift(toLatLng(prev.r, prev.c));
                }
                currKey = key(prev.r, prev.c);
            }
            path.unshift(inicioLatLng);
            return path;
        }

        const currPt = toLatLng(current.r, current.c);
        const currElev = elevGrid[current.r][current.c];

        for (const [dr, dc] of dirs) {
            const nr = current.r + dr;
            const nc = current.c + dc;
            if (nr < 0 || nr > GRID_SIZE || nc < 0 || nc > GRID_SIZE) continue;

            const nextPt = toLatLng(nr, nc);
            const nextElev = elevGrid[nr][nc];
            const distKm = distanciaMarteKm(currPt, nextPt);
            const distMeters = Math.max(10, distKm * 1000);
            const deltaH = nextElev - currElev;
            const slopeDeg = Math.atan(Math.abs(deltaH) / distMeters) * (180 / Math.PI);

            // Custo físico: distância + penalidade severa para subidas e encostas > 12°
            let stepCost = distKm;
            if (deltaH > 0) stepCost += (deltaH / 100) * 1.8; // Subir consome muito mais energia
            if (slopeDeg > 12) stepCost += Math.pow(slopeDeg - 12, 2) * 0.5;
            if (slopeDeg > 22) stepCost += 500; // Barreira quase intransponível

            const tentativeG = gScore[key(current.r, current.c)] + stepCost;
            const nKey = key(nr, nc);

            if (tentativeG < (gScore[nKey] ?? Infinity)) {
                cameFrom[nKey] = current;
                gScore[nKey] = tentativeG;
                const h = distanciaMarteKm(nextPt, fimLatLng);
                openSet.push({ r: nr, c: nc, f: tentativeG + h });
            }
        }
    }

    return [inicioLatLng, fimLatLng]; // Fallback caso não haja caminho alternativo
}

// Calcula toda a física e telemetria de uma trajetória curva (array de LatLng)
function analisarTrajetoriaCompleta(waypoints) {
    let distanciaTotalKm = 0;
    let subidaAcumuladaM = 0;
    let descidaAcumuladaM = 0;
    let inclinacaoMaximaDeg = 0;

    const altInicial = getMarsElevationMOLA(waypoints[0].lat, waypoints[0].lng);
    let altFinal = altInicial;

    for (let i = 0; i < waypoints.length - 1; i++) {
        const pA = waypoints[i];
        const pB = waypoints[i + 1];
        const segKm = distanciaMarteKm(pA, pB);
        distanciaTotalKm += segKm;

        // Sub-amostragem de cada segmento para precisão topográfica
        const subSteps = 4;
        let prevAlt = getMarsElevationMOLA(pA.lat, pA.lng);
        for (let s = 1; s <= subSteps; s++) {
            const t = s / subSteps;
            const sLat = pA.lat + (pB.lat - pA.lat) * t;
            const sLng = pA.lng + (pB.lng - pA.lng) * t;
            const currAlt = getMarsElevationMOLA(sLat, sLng);
            const dH = currAlt - prevAlt;

            if (dH > 0) subidaAcumuladaM += dH;
            else descidaAcumuladaM += Math.abs(dH);

            const segMeters = (segKm * 1000) / subSteps;
            if (segMeters > 0) {
                const slope = Math.atan(Math.abs(dH) / segMeters) * (180 / Math.PI);
                if (slope > inclinacaoMaximaDeg) inclinacaoMaximaDeg = slope;
            }
            prevAlt = currAlt;
            altFinal = currAlt;
        }
    }

    const variacaoLiquidaM = altFinal - altInicial;

    // Física Marciana (g = 3.72 m/s²):
    // Rover Pressurizado (~1.800 kg): 0.42 kWh/km plano + energia potencial gravitacional (m * g * h / 3.6e6) / eficiência (0.75)
    const energiaPlanoKwh = distanciaTotalKm * 0.42;
    const energiaSubidaKwh = (1800 * 3.72 * subidaAcumuladaM) / (3600000 * 0.75);
    const gastoEnergeticoKwh = energiaPlanoKwh + energiaSubidaKwh;

    // Consumo de O2 da tripulação (2 astronautas em Rover / EVA): ~32g/km + 0.22g/m subida
    const consumoO2Gramas = Math.round((distanciaTotalKm * 32) + (subidaAcumuladaM * 0.22));
    const tanqueO2Max = 1200; // Reserva combinada Rover + Mochilas xEMU (g)
    const consumoO2Pct = Math.min(100, Math.round((consumoO2Gramas / tanqueO2Max) * 100));

    // Velocidade média de cruzeiro reduzida pela inclinação
    const velMediaKmh = Math.max(6, 16 - (inclinacaoMaximaDeg * 0.4));
    const tempoHoras = distanciaTotalKm / velMediaKmh;

    const destinoGeo = consultarGeologiaNoPonto(waypoints[waypoints.length - 1]);

    return {
        distanciaKm: distanciaTotalKm,
        variacaoLiquidaM,
        subidaAcumuladaM: Math.round(subidaAcumuladaM),
        inclinacaoMaximaDeg,
        gastoEnergeticoKwh,
        consumoO2Gramas,
        tanqueO2Max,
        consumoO2Pct,
        tempoHoras,
        destinoGeo
    };
}

function atualizarPainelTelemetria(stats) {
    const elDist = document.getElementById('route-distance');
    const elElev = document.getElementById('route-elevation');
    const elSlope = document.getElementById('route-slope');
    const elO2 = document.getElementById('route-o2');
    const elRes = document.getElementById('route-resource');
    const elYield = document.getElementById('route-yield');

    if (elDist) elDist.innerText = `${stats.distanciaKm.toFixed(2)} km (~${stats.tempoHoras.toFixed(1)}h)`;
    if (elElev) {
        const sign = stats.variacaoLiquidaM >= 0 ? '+' : '';
        elElev.innerText = `${sign}${stats.variacaoLiquidaM} m (Subida: ${stats.subidaAcumuladaM}m)`;
    }
    if (elSlope) {
        elSlope.innerText = `${stats.inclinacaoMaximaDeg.toFixed(1)}° ${stats.inclinacaoMaximaDeg > 18 ? '(ÍNGREME!)' : '(SEGURO)'}`;
        elSlope.className = stats.inclinacaoMaximaDeg > 18 ? "text-red-400 font-bold" : "text-emerald-400 font-bold";
    }
    if (elO2) {
        elO2.innerText = `${stats.consumoO2Gramas}g O₂ | ${stats.gastoEnergeticoKwh.toFixed(1)} kWh`;
        elO2.className = stats.consumoO2Pct > 85 ? "text-red-500 font-bold" : "text-cyan-400 font-bold";
    }
    if (elRes && elYield) {
        if (stats.destinoGeo) {
            elRes.innerText = `[${stats.destinoGeo.code}] ${stats.destinoGeo.name.split('(')[0].trim()}`;
            elRes.className = "text-cyan-300 font-bold text-right";
            elYield.innerText = `~${stats.destinoGeo.waterYieldLitersPerTon} L/ton`;
        } else {
            elRes.innerText = "REGOLITO / PLANÍCIE";
            elRes.className = "text-slate-400 text-right";
            elYield.innerText = "25 L/ton";
        }
    }
}

// ============================================================================
// 6. SELEÇÃO DE POUSO + ALVO HÍDRICO E CARREGAMENTO DO GEOJSON
// ============================================================================
function calcularPontoPousoEAlvo(candorData) {
    const zonasPousoSeguro = [];
    const alvosHidricos = [];
    const refCandor = L.latLng(-6.5, -71.0);

    for (const feature of candorData.features) {
        if (!feature.geometry || !feature.properties) continue;
        const rawUnit = feature.properties.UName || feature.properties.uname || feature.properties.UNIT;
        if (!rawUnit) continue;

        const u = String(rawUnit).trim().toLowerCase();
        const centroLatLng = pegarCentroSeguro(feature.geometry);
        if (!centroLatLng) continue;

        if (distanciaMarteKm(refCandor, centroLatLng) > 350) continue;

        if (u === "vf" || u === "p" || u === "pc") {
            zonasPousoSeguro.push({ uName: u, latlng: centroLatLng, prioridade: u === "vf" ? 1 : 2 });
        }
        // Prioriza apenas materiais com fortes indícios de água ('ch' = canais fluviais, 'vl' = camadas hidratadas)
        if (u === "ch" || u === "vl") {
            alvosHidricos.push({ uName: u, latlng: centroLatLng, prioridade: u === "ch" ? 1 : 2 });
        }
    }

    zonasPousoSeguro.sort((a, b) => a.prioridade - b.prioridade);
    alvosHidricos.sort((a, b) => a.prioridade - b.prioridade);

    let melhorPouso = null, melhorAlvo = null, menorDistKm = Infinity;

    for (const pouso of zonasPousoSeguro) {
        for (const alvo of alvosHidricos) {
            const dKm = distanciaMarteKm(pouso.latlng, alvo.latlng);
            if (dKm > 2.0 && dKm < menorDistKm) {
                menorDistKm = dKm;
                melhorPouso = pouso;
                melhorAlvo = alvo;
            }
        }
    }

    const pousoFinal = melhorPouso || zonasPousoSeguro[0] || { uName: "vf", latlng: L.latLng(-6.45, -71.20) };
    const alvoFinal = melhorAlvo || alvosHidricos[0] || { uName: "vl", latlng: L.latLng(-6.62, -70.85) };

    return {
        pousoLatLng: pousoFinal.latlng,
        pousoUnit: pousoFinal.uName,
        alvoLatLng: alvoFinal.latlng,
        alvoUnit: alvoFinal.uName,
        setor: identificarSetorMarte(pousoFinal.latlng.lat, pousoFinal.latlng.lng)
    };
}

let missaoAtivaStats = null;

fetch('data/candor_chemistry.geojson')
    .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    })
    .then(data => {
        const missao = calcularPontoPousoEAlvo(data);
        const centroPouso = missao.pousoLatLng;

        MISSION_CENTER.lat = centroPouso.lat;
        MISSION_CENTER.lon = centroPouso.lng;
        VIEWS.local.center = [centroPouso.lat, centroPouso.lng];

        // Raio de 400 km ao redor do Local de Pouso
        L.circle(centroPouso, {
            pane: 'missionOverlayPane',
            radius: (RAIO_MATERIAIS_KM * 1000) / 0.532,
            color: '#38bdf8',
            weight: 2,
            dashArray: '8, 6',
            fillColor: '#38bdf8',
            fillOpacity: 0.03,
            interactive: false
        }).addTo(geologyGroup);

        const unidadesEncontradas = new Set();
        let corIdx = 0;

        const featuresFiltradas400km = data.features.filter(feature => {
            if (!feature.geometry || !feature.properties) return false;
            const rawUnit = feature.properties.UName || feature.properties.uname || feature.properties.UNIT;
            if (!rawUnit) return false;

            const uName = String(rawUnit).trim().toLowerCase();
            const centroFeature = pegarCentroSeguro(feature.geometry);
            if (!centroFeature) return false;

            if (distanciaMarteKm(centroPouso, centroFeature) <= RAIO_MATERIAIS_KM) {
                garantirUnidadeNoCatalogo(uName, corIdx++);
                unidadesEncontradas.add(uName);
                return true;
            }
            return false;
        });

        // Preenche imediatamente a Tabela de Cores na Barra Lateral
        const legendBody = document.getElementById('hydro-legend-body');
        if (legendBody) {
            let htmlTabela = "";
            unidadesEncontradas.forEach(uName => {
                const info = geologyCatalog[uName];
                htmlTabela += `
                    <div class="flex items-center justify-between text-xs py-1.5">
                        <div class="flex items-center gap-2 truncate pr-2">
                            <span class="w-3.5 h-3.5 rounded-sm shrink-0 border border-white/40" style="background:${info.color}"></span>
                            <span class="font-['JetBrains_Mono'] font-bold text-slate-200">${info.code}</span>
                            <span class="text-slate-300 truncate">${info.name.split('(')[0].trim()}</span>
                        </div>
                        <span class="font-['JetBrains_Mono'] text-cyan-300 font-bold shrink-0">${info.waterYieldLitersPerTon} L/t</span>
                    </div>
                `;
            });
            legendBody.innerHTML = htmlTabela || `<div class="text-xs text-slate-400 py-2">Nenhuma unidade neste raio.</div>`;
        }

        const geoJsonLayer = L.geoJSON({ type: "FeatureCollection", features: featuresFiltradas400km }, {
            pane: 'geologyPane',
            coordsToLatLng: geoCoordsToLatLng,
            style: (feature) => {
                const rawUnit = feature.properties.UName || feature.properties.uname || feature.properties.UNIT;
                const uName = String(rawUnit).trim().toLowerCase();
                const info = geologyCatalog[uName];

                if (uName === "pc" || uName === "p") {
                    return {
                        stroke: true, color: info.color, weight: 1, opacity: 0.6,
                        fillColor: info.color, fillOpacity: 0.14
                    };
                }
                return {
                    stroke: true, color: info.color, weight: 1.5, opacity: 0.95,
                    fillColor: info.color, fillOpacity: 0.48
                };
            },
            onEachFeature: (feature, layer) => {
                const rawUnit = feature.properties.UName || feature.properties.uname || feature.properties.UNIT;
                const uName = String(rawUnit).trim().toLowerCase();
                const p = geologyCatalog[uName];
                if (!p) return;

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
        });

        geoJsonLayer.addTo(geologyGroup);

        // Calcula a MELHOR ROTA CURVA (A*) da Base de Pouso até o Alvo Hídrico
        const rotaOtimizada = calcularMelhorRotaAStar(missao.pousoLatLng, missao.alvoLatLng);
        missaoAtivaStats = analisarTrajetoriaCompleta(rotaOtimizada);

        const pousoInfo = geologyCatalog[missao.pousoUnit];
        const alvoInfo = geologyCatalog[missao.alvoUnit];

        const elLanding = document.getElementById('mission-landing-unit');
        const elTarget = document.getElementById('mission-target-unit');
        const elDist = document.getElementById('mission-target-dist');

        if (elLanding) elLanding.innerText = `${missao.setor} (${pousoInfo.code})`;
        if (elTarget) elTarget.innerText = `${alvoInfo.name.split('(')[0].trim()} (${alvoInfo.code})`;
        if (elDist) elDist.innerText = `${missaoAtivaStats.distanciaKm.toFixed(2)} km (Rota A*)`;

        // Preenche a Telemetria com os dados da Missão Ativa
        atualizarPainelTelemetria(missaoAtivaStats);

        // Base de Pouso (Vermelho)
        L.circleMarker(missao.pousoLatLng, {
            pane: 'missionOverlayPane',
            radius: 10, fillColor: "#ef4444", color: "#ffffff", weight: 2.5, fillOpacity: 1
        }).bindPopup(`
            <div class="font-sans">
                <span class="text-[10px] uppercase font-bold text-emerald-400">LOCAL CONFIRMADO: ${missao.setor.toUpperCase()}</span>
                <h3 class="font-bold text-sm mt-0.5">Base de Pouso (${pousoInfo.code})</h3>
                <div class="text-xs font-mono text-slate-300 mt-1">Alt: ${getMarsElevationMOLA(missao.pousoLatLng.lat, missao.pousoLatLng.lng)} m (Fundo Plano)</div>
                <p class="text-xs text-slate-300 mt-1">Rota otimizada até o alvo hídrico: <b>${missaoAtivaStats.distanciaKm.toFixed(2)} km</b> (${missaoAtivaStats.gastoEnergeticoKwh.toFixed(1)} kWh).</p>
            </div>
        `).addTo(targetsGroup);

        // Alvo Hídrico (Ciano)
        L.circleMarker(missao.alvoLatLng, {
            pane: 'missionOverlayPane',
            radius: 8, fillColor: "#06b6d4", color: "#ffffff", weight: 2, fillOpacity: 1
        }).bindPopup(`
            <div class="font-sans">
                <span class="text-[10px] uppercase font-bold text-cyan-400">ALVO HÍDRICO — ${missao.setor.toUpperCase()}</span>
                <h3 class="font-bold text-sm mt-0.5">${alvoInfo.name}</h3>
                <div class="text-xs text-slate-300 mt-1"><strong>Indícios H₂O:</strong> ${alvoInfo.mineral}</div>
                <p class="text-xs text-cyan-300 font-mono mt-1">Rendimento: <b>${alvoInfo.waterYieldLitersPerTon} L/ton</b></p>
            </div>
        `).addTo(targetsGroup);

<<<<<<< Updated upstream
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
=======
        // Desenha a ROTA OTIMIZADA CURVA (A*) em amarelo brilhante
        L.polyline(rotaOtimizada, {
            pane: 'missionOverlayPane',
            color: "#facc15",
            weight: 3.5,
            smoothFactor: 1.5
        }).addTo(targetsGroup);

        map.flyTo(missao.pousoLatLng, 9, { duration: 1.2 });
    })
    .catch(err => {
        console.error("Erro no GeoJSON:", err);
        const legendBody = document.getElementById('hydro-legend-body');
        if (legendBody) legendBody.innerHTML = `<div class="text-xs text-red-400 py-2">Erro: ${err.message}</div>`;
    });
>>>>>>> Stashed changes

// ============================================================================
// 7. TELEMETRIA INTERATIVA (CLIQUE EM 2 PONTOS CALCULA MELHOR ROTA A*)
// ============================================================================
let routePoints = [];
let routeLine = null;
let routeMarkers = [];

function addRoutePoint(latlng) {
    if (routePoints.length >= 2) clearRoute();

    routePoints.push(latlng);
    const marker = L.circleMarker(latlng, {
        pane: 'missionOverlayPane',
        radius: 5, fillColor: '#f8fafc', color: '#0284c7', weight: 2, fillOpacity: 1
    }).addTo(map);
    
    routeMarkers.push(marker);

<<<<<<< Updated upstream
    if (routePoints.length === 2) drawRouteAndCalculate();
}

map.on('click', (e) => addRoutePoint(e.latlng));
=======
    if (routePoints.length === 2) {
        const caminhoOtimizado = calcularMelhorRotaAStar(routePoints[0], routePoints[1]);
        const stats = analisarTrajetoriaCompleta(caminhoOtimizado);

        const isDangerous = stats.inclinacaoMaximaDeg > 18 || stats.consumoO2Pct > 85;
        routeLine = L.polyline(caminhoOtimizado, {
            pane: 'missionOverlayPane',
            color: isDangerous ? '#ef4444' : '#38bdf8',
            weight: 3.5,
            smoothFactor: 1.5
        }).addTo(map);

        atualizarPainelTelemetria(stats);
    }
});
>>>>>>> Stashed changes

function clearRoute() {
    routePoints = [];
    if (routeLine) map.removeLayer(routeLine);
    routeMarkers.forEach(m => map.removeLayer(m));
    routeMarkers = [];

    // Ao limpar a rota manual, restaura a telemetria da Missão Ativa
    if (missaoAtivaStats) {
        atualizarPainelTelemetria(missaoAtivaStats);
    }
}

<<<<<<< Updated upstream
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
=======
const clearRouteBtn = document.getElementById('clear-route');
if (clearRouteBtn) {
    clearRouteBtn.addEventListener('click', clearRoute);
}
>>>>>>> Stashed changes

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
    preferCanvas: true,
    layers: [nasaLayers.topo, nasaLayers.hillshade]
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
    // Eixo central real de Valles Marineris (de -6.5°S em -72°W até -13.5°S em -55°W)
    const canyonAxisLat = -6.5 + ((lon + 72.0) / 22.0) * -6.5;
    const distFromAxis = Math.abs(lat - canyonAxisLat);

    let baseElevation;
    if (distFromAxis < 1.35) {
        // Fundo profundo do cânion (-4.250 m a -3.600 m)
        baseElevation = -4250 + (distFromAxis * 480);
    } else if (distFromAxis < 2.6) {
        // Paredes escarpadas do cânion
        const wallProgress = (distFromAxis - 1.35) / 1.25;
        baseElevation = -3600 + (wallProgress * 5100);
    } else {
        // Planalto circundante (+1.500 m)
        baseElevation = 1500 + Math.sin(lon * 0.5) * 280;
    }

    const microRelief = (Math.sin(lat * 22) * Math.cos(lon * 22)) * 140;
    return Math.round(baseElevation + microRelief);
}

map.on('mousemove', (e) => {
    const lat = e.latlng.lat.toFixed(4);
    const lon = e.latlng.lng.toFixed(4);
    const alt = getMarsElevationMOLA(e.latlng.lat, e.latlng.lng);
    const distFromBaseKm = distanciaMarteKm(e.latlng, L.latLng(MISSION_CENTER.lat, MISSION_CENTER.lon)).toFixed(1);
    
    const latDir = lat >= 0 ? 'N' : 'S';
    const lonDir = lon >= 0 ? 'E' : 'W';
    
    const coordsEl = document.getElementById('coords-display');
    if (coordsEl) {
        coordsEl.innerHTML = 
            `LAT: ${Math.abs(lat)}° ${latDir} | LON: ${Math.abs(lon)}° ${lonDir} | <span class="text-amber-400 font-bold">ALT: ${alt.toLocaleString('pt-BR')} m</span> | <span class="text-cyan-300">BASE: ${distFromBaseKm} km</span>`;
    }
});

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
// 5. ALGORITMO A* REALISTA (RESPEITA PAREDES DO CÂNION 'VW' E RELEVO MOLA)
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

    const checkPoly = (rings) => {
        if (!Array.isArray(rings) || rings.length === 0) return false;
        if (typeof rings[0].lat === 'number') {
            return isPointInRing(latlng, rings);
        }
        if (Array.isArray(rings[0]) && rings[0].length > 0 && typeof rings[0][0].lat === 'number') {
            return isPointInRing(latlng, rings[0]);
        }
        return rings.some(sub => checkPoly(sub));
    };

    return checkPoly(latlngs);
}

function consultarGeologiaNoPonto(latlng) {
    // Prioriza unidades internas do cânion (vw, vf, vl, ch, vs) sobre o planalto geral
    let unidadeEncontrada = null;
    for (let i = 0; i < geologyLayersList.length; i++) {
        if (isPointInPolygon(latlng, geologyLayersList[i].layer)) {
            const prop = geologyLayersList[i].properties;
            const code = prop.code.toLowerCase();
            if (code === "vw") return prop; // Parede escarpada tem prioridade máxima de detecção
            unidadeEncontrada = prop;
        }
    }
    return unidadeEncontrada;
}

// Elevação com micro-relevo natural preservado dentro do cânion
function getElevacaoRealista(latlng, geoProp) {
    const baseMola = getMarsElevationMOLA(latlng.lat, latlng.lng);
    const microOndulacao = Math.round((Math.sin(latlng.lat * 45) * Math.cos(latlng.lng * 45)) * 180);
    if (!geoProp) return baseMola;

    const code = geoProp.code.toLowerCase();
    if (code === "ch") return -4250 + microOndulacao; // Canal mais profundo do vale (~900 Pa)
    if (code === "vf") return -3950 + microOndulacao; // Fundo plano do cânion (~870 Pa)
    if (code === "vl") return -3450 + microOndulacao; // Camadas lacustres elevadas (~830 Pa)
    if (code === "vs") return -2900 + microOndulacao; // Depósitos de deslizamento na base da parede (~790 Pa)
    if (code === "vw") return 450 + microOndulacao;   // Parede escarpada (~585 Pa)
    if (code === "pc" || code === "p" || code === "pr") return Math.max(baseMola, 1450); // Planalto (~530 Pa)
    return baseMola;
}

// Calcula a melhor rota EVA respeitando o fundo do cânion e bloqueando travessias de penhascos
function calcularMelhorRotaAStar(inicioLatLng, fimLatLng) {
    const GRID_SIZE = 28; // Grade fina para contornar paredes internas (Candor Mensa / escarpas)
    const padLat = Math.max(0.15, Math.abs(fimLatLng.lat - inicioLatLng.lat) * 0.45);
    const padLng = Math.max(0.15, Math.abs(fimLatLng.lng - inicioLatLng.lng) * 0.45);

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

    // Mapeia geologia e elevação realista de cada célula da grade
    const gridData = Array.from({ length: GRID_SIZE + 1 }, (_, r) =>
        Array.from({ length: GRID_SIZE + 1 }, (_, c) => {
            const pt = toLatLng(r, c);
            const geo = consultarGeologiaNoPonto(pt);
            const elev = getElevacaoRealista(pt, geo);
            const code = geo ? geo.code.toLowerCase() : "";
            const isWall = code === "vw";
            const isPlateau = (code === "pc" || code === "p" || code === "pr");
            return { pt, geo, elev, isWall, isPlateau };
        })
    );

    const startInCanyon = !gridData[startNode.r][startNode.c].isPlateau;
    const goalInCanyon = !gridData[goalNode.r][goalNode.c].isPlateau;

    const key = (r, c) => `${r},${c}`;
    const openSet = [{ r: startNode.r, c: startNode.c, f: 0 }];
    const cameFrom = {};
    const gScore = { [key(startNode.r, startNode.c)]: 0 };

    const dirs = [
        [-1, 0], [1, 0], [0, -1], [0, 1],
        [-1, -1], [-1, 1], [1, -1], [1, 1]
    ];

    let iter = 0;
    while (openSet.length > 0 && iter < 4500) {
        iter++;
        openSet.sort((a, b) => a.f - b.f);
        const current = openSet.shift();

        if (current.r === goalNode.r && current.c === goalNode.c) {
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
            return { waypoints: path, bloqueadaPorParede: false };
        }

        const currCell = gridData[current.r][current.c];

        for (const [dr, dc] of dirs) {
            const nr = current.r + dr;
            const nc = current.c + dc;
            if (nr < 0 || nr > GRID_SIZE || nc < 0 || nc > GRID_SIZE) continue;

            const nextCell = gridData[nr][nc];
            const isGoal = (nr === goalNode.r && nc === goalNode.c);

            // BLOQUEIO FÍSICO REALISTA PARA CAMINHADA ESPACIAL (EVA):
            // 1. Não atravessa paredes escarpadas do cânion ('VW')
            if (nextCell.isWall && !isGoal) continue;
            // 2. Se a caminhada começou dentro do cânion, não deixa "pular" o penhasco de 5km para o planalto
            if (startInCanyon && nextCell.isPlateau && !isGoal) continue;
            if (!startInCanyon && !nextCell.isPlateau && !isGoal) continue;

            const distKm = distanciaMarteKm(currCell.pt, nextCell.pt);
            const distMeters = Math.max(10, distKm * 1000);
            const deltaH = nextCell.elev - currCell.elev;
            const slopeDeg = Math.atan(Math.abs(deltaH) / distMeters) * (180 / Math.PI);

            // Astronauta em traje EVA não escala encostas acima de 20°
            if (slopeDeg > 20 && !isGoal) continue;

            let stepCost = distKm;
            if (deltaH > 0) stepCost += (deltaH / 100) * 2.2;
            if (slopeDeg > 10) stepCost += Math.pow(slopeDeg - 10, 2) * 0.6;

            const tentativeG = gScore[key(current.r, current.c)] + stepCost;
            const nKey = key(nr, nc);

            if (tentativeG < (gScore[nKey] ?? Infinity)) {
                cameFrom[nKey] = current;
                gScore[nKey] = tentativeG;
                const h = distanciaMarteKm(nextCell.pt, fimLatLng);
                openSet.push({ r: nr, c: nc, f: tentativeG + h });
            }
        }
    }

    // Se chegou aqui, não existe passagem segura sem escalar um penhasco vertical de Valles Marineris
    return {
        waypoints: [inicioLatLng, fimLatLng],
        bloqueadaPorParede: true,
        motivoBloqueio: startInCanyon !== goalInCanyon
            ? "TRANSPOSIÇÃO DE PAREDE (5.000m) IMPOSSÍVEL EM EVA"
            : "ESCARPA ÍNGREME (VW) BLOQUEANDO O VALE"
    };
}

function analisarTrajetoriaCompleta(resultadoRota) {
    const waypoints = resultadoRota.waypoints;
    let distanciaTotalKm = 0;
    let subidaAcumuladaM = 0;
    let inclinacaoMaximaDeg = 0;

    const geoInicio = consultarGeologiaNoPonto(waypoints[0]);
    const geoFim = consultarGeologiaNoPonto(waypoints[waypoints.length - 1]);

    const altInicial = getElevacaoRealista(waypoints[0], geoInicio);
    let altFinal = altInicial;

    for (let i = 0; i < waypoints.length - 1; i++) {
        const pA = waypoints[i];
        const pB = waypoints[i + 1];
        const segKm = distanciaMarteKm(pA, pB);
        distanciaTotalKm += segKm;

        const subSteps = 4;
        let prevAlt = getElevacaoRealista(pA, consultarGeologiaNoPonto(pA));
        for (let s = 1; s <= subSteps; s++) {
            const t = s / subSteps;
            const sPt = L.latLng(pA.lat + (pB.lat - pA.lat) * t, pA.lng + (pB.lng - pA.lng) * t);
            const currAlt = getElevacaoRealista(sPt, consultarGeologiaNoPonto(sPt));
            const dH = currAlt - prevAlt;

            if (dH > 0) subidaAcumuladaM += dH;

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
    const energiaPlanoKwh = distanciaTotalKm * 0.42;
    const energiaSubidaKwh = (1800 * 3.72 * subidaAcumuladaM) / (3600000 * 0.75);
    const gastoEnergeticoKwh = energiaPlanoKwh + energiaSubidaKwh;

    const consumoO2Gramas = Math.round((distanciaTotalKm * 32) + (subidaAcumuladaM * 0.22));
    const tanqueO2Max = 1200;
    const consumoO2Pct = Math.min(100, Math.round((consumoO2Gramas / tanqueO2Max) * 100));

    const velMediaKmh = Math.max(6, 16 - (inclinacaoMaximaDeg * 0.4));
    const tempoHoras = distanciaTotalKm / velMediaKmh;

    return {
        distanciaKm: distanciaTotalKm,
        variacaoLiquidaM,
        subidaAcumuladaM: Math.round(subidaAcumuladaM),
        inclinacaoMaximaDeg,
        gastoEnergeticoKwh,
        consumoO2Gramas,
        consumoO2Pct,
        tempoHoras,
        destinoGeo: geoFim,
        bloqueadaPorParede: resultadoRota.bloqueadaPorParede,
        motivoBloqueio: resultadoRota.motivoBloqueio
    };
}

function atualizarPainelTelemetria(stats) {
    const elDist = document.getElementById('route-distance');
    const elElev = document.getElementById('route-elevation');
    const elSlope = document.getElementById('route-slope');
    const elO2 = document.getElementById('route-o2');
    const elRes = document.getElementById('route-resource');
    const elYield = document.getElementById('route-yield');

    if (stats.bloqueadaPorParede) {
        if (elDist) elDist.innerText = "ROTA INVIÁVEL (PAREDE)";
        if (elElev) elElev.innerText = `${stats.variacaoLiquidaM >= 0 ? '+' : ''}${stats.variacaoLiquidaM} m (Abismo!)`;
        if (elSlope) {
            elSlope.innerText = `${stats.inclinacaoMaximaDeg.toFixed(1)}° (BLOQUEADO)`;
            elSlope.className = "text-red-500 font-bold";
        }
        if (elO2) {
            elO2.innerText = stats.motivoBloqueio || "ESCARPA INTRANSPONÍVEL";
            elO2.className = "text-red-400 font-bold text-[10px]";
        }
    } else {
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
let missaoRotaWaypoints = [];

function mostrarExplicacaoUnidade(uName) {
    const info = geologyCatalog[uName];
    const box = document.getElementById('unit-detail-box');
    if (!info || !box) return;

    document.getElementById('unit-detail-title').innerText = `[${info.code}] ${info.name}`;
    document.getElementById('unit-detail-mineral').innerText = `Mineral: ${info.mineral} (~${info.waterYieldLitersPerTon} L/t)`;
    document.getElementById('unit-detail-desc').innerText = info.desc;
    document.getElementById('unit-detail-extract').innerText = `Operação ISRU: ${info.extractionMethod}`;
    box.classList.remove('hidden');
}

const closeUnitBtn = document.getElementById('close-unit-detail');
if (closeUnitBtn) {
    closeUnitBtn.addEventListener('click', () => {
        document.getElementById('unit-detail-box').classList.add('hidden');
    });
}

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

        const legendBody = document.getElementById('hydro-legend-body');
        if (legendBody) {
            let htmlTabela = "";
            unidadesEncontradas.forEach(uName => {
                const info = geologyCatalog[uName];
                htmlTabela += `
                    <button type="button" data-unit="${uName}" class="unit-row-btn w-full flex items-center justify-between text-xs py-1.5 px-1.5 rounded hover:bg-slate-800/90 transition text-left cursor-pointer">
                        <div class="flex items-center gap-2 truncate pr-2">
                            <span class="w-3.5 h-3.5 rounded-sm shrink-0 border border-white/40" style="background:${info.color}"></span>
                            <span class="font-['JetBrains_Mono'] font-bold text-slate-200">${info.code}</span>
                            <span class="text-slate-300 truncate">${info.name.split('(')[0].trim()}</span>
                        </div>
                        <span class="font-['JetBrains_Mono'] text-cyan-300 font-bold shrink-0">${info.waterYieldLitersPerTon} L/t</span>
                    </button>
                `;
            });
            legendBody.innerHTML = htmlTabela || `<div class="text-xs text-slate-400 py-2">Nenhuma unidade neste raio.</div>`;

            legendBody.querySelectorAll('.unit-row-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    mostrarExplicacaoUnidade(btn.getAttribute('data-unit'));
                });
            });
        }

        const geoJsonLayer = L.geoJSON({ type: "FeatureCollection", features: featuresFiltradas400km }, {
            pane: 'geologyPane',
            coordsToLatLng: geoCoordsToLatLng,
            interactive: false,
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
                if (p) geologyLayersList.push({ properties: p, layer: layer });
            }
        });

        geoJsonLayer.addTo(geologyGroup);

        // Calcula a rota oficial A* da missão
        const resultadoRota = calcularMelhorRotaAStar(missao.pousoLatLng, missao.alvoLatLng);
        missaoRotaWaypoints = resultadoRota.waypoints;
        missaoAtivaStats = analisarTrajetoriaCompleta(resultadoRota);

        const pousoInfo = geologyCatalog[missao.pousoUnit];
        const alvoInfo = geologyCatalog[missao.alvoUnit];

        // Preenche TODOS os dados da Missão Tripulada Ativa na barra lateral
        document.getElementById('mission-landing-unit').innerText = `${missao.setor} (${pousoInfo.code})`;
        document.getElementById('mission-target-unit').innerText = `${alvoInfo.name.split('(')[0].trim()} (${alvoInfo.code})`;
        document.getElementById('mission-target-dist').innerText = `${missaoAtivaStats.distanciaKm.toFixed(2)} km (~${missaoAtivaStats.tempoHoras.toFixed(1)}h)`;
        
        const sign = missaoAtivaStats.variacaoLiquidaM >= 0 ? '+' : '';
        document.getElementById('mission-elev').innerText = `${sign}${missaoAtivaStats.variacaoLiquidaM} m (Subida: ${missaoAtivaStats.subidaAcumuladaM}m)`;
        document.getElementById('mission-slope').innerText = `${missaoAtivaStats.inclinacaoMaximaDeg.toFixed(1)}° (SEGURO)`;
        document.getElementById('mission-energy').innerText = `${missaoAtivaStats.consumoO2Gramas}g O₂ | ${missaoAtivaStats.gastoEnergeticoKwh.toFixed(1)} kWh`;

        // Preenche Diagnóstico Científico
        const pousoAltM = getElevacaoRealista(missao.pousoLatLng, pousoInfo);
        const diagLandingEl = document.getElementById('diag-landing-text');
        const diagWaterEl = document.getElementById('diag-water-text');

        if (diagLandingEl) {
            diagLandingEl.innerHTML = `<b>${missao.setor} — Unidade ${pousoInfo.code} (${pousoInfo.name.split('(')[0].trim()})</b>: Planície sedimentar plana no fundo do vale a <b>${pousoAltM.toLocaleString('pt-BR')} m</b> de altitude. A baixa elevação aumenta a coluna atmosférica acima da nave, otimizando a frenagem aerodinâmica (EDL), reduzindo a radiação cósmica e mantendo distância segura das escarpas verticais (<b>VW</b>).`;
        }
        if (diagWaterEl) {
            diagWaterEl.innerHTML = `<b>${alvoInfo.name} (${alvoInfo.code})</b>: Escolhido pela presença de <b>${alvoInfo.mineral}</b>. Na carta geológica de Coprates (McCauley, 1978), representa depósitos estratificados no interior do cânion, com rendimento estimado de <b>~${alvoInfo.waterYieldLitersPerTon} litros de H₂O/ton</b> via ${alvoInfo.extractionMethod.toLowerCase()}.`;
        }

        // Desenha a rota oficial A*
        L.polyline(resultadoRota.waypoints, {
            pane: 'missionOverlayPane',
            color: "#facc15",
            weight: 3.5,
            smoothFactor: 1.5,
            interactive: false
        }).addTo(targetsGroup);

        // Base de Pouso (Vermelho)
        const baseMarker = L.circleMarker(missao.pousoLatLng, {
            pane: 'missionOverlayPane',
            radius: 11, fillColor: "#ef4444", color: "#ffffff", weight: 3, fillOpacity: 1
        }).bindPopup(`
            <div class="font-sans max-w-xs">
                <span class="text-[10px] uppercase font-bold text-red-400">BASE DE POUSO HUMANA // ${missao.setor.toUpperCase()}</span>
                <h3 class="font-bold text-sm mt-0.5">${pousoInfo.name}</h3>
                <div class="text-xs font-mono text-cyan-300 mt-1">Lat: ${missao.pousoLatLng.lat.toFixed(3)}° | Lon: ${missao.pousoLatLng.lng.toFixed(3)}° | Alt: ${pousoAltM} m</div>
                <p class="text-xs text-slate-300 mt-1.5">Terreno plano e seguro no interior de Candor Chasma. Distância de caminhada/rover até o alvo hídrico: <b>${missaoAtivaStats.distanciaKm.toFixed(2)} km</b>.</p>
            </div>
        `);
        baseMarker.on('click', (e) => { L.DomEvent.stopPropagation(e); baseMarker.openPopup(); });
        baseMarker.addTo(targetsGroup);

        // Alvo Hídrico (Ciano)
        const alvoMarker = L.circleMarker(missao.alvoLatLng, {
            pane: 'missionOverlayPane',
            radius: 9, fillColor: "#06b6d4", color: "#ffffff", weight: 2.5, fillOpacity: 1
        }).bindPopup(`
            <div class="font-sans max-w-xs">
                <span class="text-[10px] uppercase font-bold text-cyan-400">DESTINO HÍDRICO (ISRU) // ${missao.setor.toUpperCase()}</span>
                <h3 class="font-bold text-sm mt-0.5">${alvoInfo.name}</h3>
                <div class="text-xs font-mono text-cyan-300 mt-1">Lat: ${missao.alvoLatLng.lat.toFixed(3)}° | Lon: ${missao.alvoLatLng.lng.toFixed(3)}°</div>
                <p class="text-xs text-slate-300 mt-1.5"><strong>Material:</strong> ${alvoInfo.mineral} (~${alvoInfo.waterYieldLitersPerTon} L/ton).</p>
            </div>
        `);
        alvoMarker.on('click', (e) => { L.DomEvent.stopPropagation(e); alvoMarker.openPopup(); });
        alvoMarker.addTo(targetsGroup);

        // Inicializa o Astronauta na Base de Pouso
        inicializarAstronauta(missaoRotaWaypoints);

        map.flyTo(missao.pousoLatLng, 9, { duration: 1.2 });
    })
    .catch(err => console.error("Erro no GeoJSON:", err));

// ============================================================================
// 7. SIMULAÇÃO AO VIVO DO ASTRONAUTA NA EXPEDIÇÃO (BIOMETRIA & AMBIENTE)
// ============================================================================
let astroMarker = null;
let astroStepIndex = 0;
let astroTimer = null;
let astroO2Inicial = 1200;
let astroBateriaInicial = 45.0;

// Modelo Térmico e Barométrico Calibrado (TES / Mars Climate Database)
function calcularAmbienteMarte(altitudeM, geoProp = null, lat = -6.5) {
    // 1. Lei Barométrica Exponencial (P0 = 610 Pa, H = 11.100 m)
    const pressaoPa = Math.round(610 * Math.exp(-altitudeM / 11100));

    // 2. Inércia térmica da rocha
    let bonusInerciaTermica = 0;
    if (geoProp) {
        const c = geoProp.code.toLowerCase();
        if (c === "vl" || c === "vw") bonusInerciaTermica = +4.5;
        if (c === "ch") bonusInerciaTermica = -2.0;
    }

    // 3. Efeito da latitude (afastamento do equador esfria ~0.95°C por grau)
    const efeitoLatitude = Math.max(0, Math.abs(lat) - 6.5) * 0.95;

    // 4. Temperatura diurna média (°C)
    const tempC = Math.round(-28 - (altitudeM / 1000) * 3.2 + bonusInerciaTermica - efeitoLatitude);
    const radTaxaHora = 0.024 * Math.exp(altitudeM / 22000);

    return { pressaoPa, tempC, radTaxaHora };
}

function inicializarAstronauta(waypoints) {
    if (!waypoints || waypoints.length === 0) return;
    if (astroMarker) map.removeLayer(astroMarker);

    const astroIcon = L.divIcon({
        className: 'astro-hud-marker',
        html: `<div style="width:28px;height:28px;background:#0f172a;border:2px solid #facc15;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 0 12px #facc15;">🧑‍🚀</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
    });

    astroStepIndex = 0;
    astroMarker = L.marker(waypoints[0], { icon: astroIcon, zIndexOffset: 1000 }).addTo(map);
    atualizarTelemetriaAstronauta();
}

function atualizarTelemetriaAstronauta() {
    if (!missaoRotaWaypoints || missaoRotaWaypoints.length === 0 || !astroMarker) return;

    const totalSteps = missaoRotaWaypoints.length - 1;
    const posAtual = missaoRotaWaypoints[astroStepIndex];
    astroMarker.setLatLng(posAtual);

    const progressoPct = totalSteps > 0 ? Math.round((astroStepIndex / totalSteps) * 100) : 0;

    // Calcula distância percorrida e subida acumulada até o passo atual
    let distPercorrida = 0;
    let subidaPercorrida = 0;
    for (let i = 0; i < astroStepIndex; i++) {
        const pA = missaoRotaWaypoints[i];
        const pB = missaoRotaWaypoints[i + 1];
        distPercorrida += distanciaMarteKm(pA, pB);
        const altA = getElevacaoRealista(pA, consultarGeologiaNoPonto(pA));
        const altB = getElevacaoRealista(pB, consultarGeologiaNoPonto(pB));
        if (altB > altA) subidaPercorrida += (altB - altA);
    }

    const geoAtual = consultarGeologiaNoPonto(posAtual);
    const altAtual = getElevacaoRealista(posAtual, geoAtual);
    const amb = calcularAmbienteMarte(altAtual, geoAtual, posAtual.lat);

    const o2Gasto = Math.round((distPercorrida * 32) + (subidaPercorrida * 0.22));
    const o2Restante = Math.max(0, astroO2Inicial - o2Gasto);
    const o2Pct = Math.round((o2Restante / astroO2Inicial) * 100);

    const kwhGasto = (distPercorrida * 0.42) + ((1800 * 3.72 * subidaPercorrida) / (3600000 * 0.75));
    const kwhRestante = Math.max(0, astroBateriaInicial - kwhGasto);

    const horasDecorridas = distPercorrida / 14.5;
    const radAcumulada = horasDecorridas * amb.radTaxaHora;

    document.getElementById('astro-progress-pct').innerText = `${progressoPct}% (${distPercorrida.toFixed(1)} km)`;
    document.getElementById('astro-progress-bar').style.width = `${progressoPct}%`;
    document.getElementById('astro-o2').innerText = `${o2Restante}g (${o2Pct}%)`;
    document.getElementById('astro-battery').innerText = `${kwhRestante.toFixed(1)} kWh`;
    document.getElementById('astro-alt').innerText = `${altAtual.toLocaleString('pt-BR')} m`;
    document.getElementById('astro-pressure').innerText = `${amb.pressaoPa} Pa`;
    document.getElementById('astro-temp').innerText = `${amb.tempC}°C`;
    document.getElementById('astro-rad').innerText = `${radAcumulada.toFixed(3)} mSv`;
}

const btnAstroPlay = document.getElementById('btn-astro-play');
const btnAstroStep = document.getElementById('btn-astro-step');
const btnAstroReset = document.getElementById('btn-astro-reset');

if (btnAstroPlay) {
    btnAstroPlay.addEventListener('click', () => {
        if (astroTimer) {
            clearInterval(astroTimer);
            astroTimer = null;
            btnAstroPlay.innerText = "▶ Iniciar";
            return;
        }
        if (astroStepIndex >= missaoRotaWaypoints.length - 1) astroStepIndex = 0;
        btnAstroPlay.innerText = "⏸ Pausar";
        astroTimer = setInterval(() => {
            if (astroStepIndex < missaoRotaWaypoints.length - 1) {
                astroStepIndex++;
                atualizarTelemetriaAstronauta();
            } else {
                clearInterval(astroTimer);
                astroTimer = null;
                btnAstroPlay.innerText = "▶ Iniciar";
            }
        }, 650);
    });
}

if (btnAstroStep) {
    btnAstroStep.addEventListener('click', () => {
        if (astroStepIndex < missaoRotaWaypoints.length - 1) {
            astroStepIndex++;
            atualizarTelemetriaAstronauta();
        }
    });
}

if (btnAstroReset) {
    btnAstroReset.addEventListener('click', () => {
        if (astroTimer) {
            clearInterval(astroTimer);
            astroTimer = null;
            if (btnAstroPlay) btnAstroPlay.innerText = "▶ Iniciar";
        }
        astroStepIndex = 0;
        atualizarTelemetriaAstronauta();
    });
}

// ============================================================================
// 8. INSPEÇÃO DE LOCAL & SIMULADOR DE ROTA DE TESTE (MANTÉM LINHA AO RECOLHER)
// ============================================================================
let modoSimuladorRotaTeste = false;
let routePoints = [];
let routeLine = null;
let routeMarkers = [];

const toggleTestRouteBtn = document.getElementById('toggle-test-route-btn');
const testRoutePanel = document.getElementById('test-route-panel');
const testRouteBadge = document.getElementById('test-route-badge');

if (toggleTestRouteBtn && testRoutePanel) {
    toggleTestRouteBtn.addEventListener('click', () => {
        modoSimuladorRotaTeste = !modoSimuladorRotaTeste;
        if (modoSimuladorRotaTeste) {
            testRoutePanel.classList.remove('hidden');
            testRouteBadge.innerText = "ABERTO (CLIQUE 2 PTS)";
            testRouteBadge.className = "text-[10px] font-['JetBrains_Mono'] text-cyan-300 font-bold";
        } else {
            // Apenas oculta a sanfona, mas MANTÉM a linha de teste e seus dados salvos!
            testRoutePanel.classList.add('hidden');
            testRouteBadge.innerText = routeLine ? "ROTA SALVA" : "OCULTO";
            testRouteBadge.className = "text-[10px] font-['JetBrains_Mono'] text-slate-400";
        }
    });
}

map.on('click', (e) => {
    // MODO 1 (Quando Simulador de Teste está fechado): Inspeção detalhada do terreno
    if (!modoSimuladorRotaTeste) {
        const geo = consultarGeologiaNoPonto(e.latlng);
        const altM = getElevacaoRealista(e.latlng, geo);
        const setor = identificarSetorMarte(e.latlng.lat, e.latlng.lng);
        const amb = calcularAmbienteMarte(altM, geo, e.latlng.lat);
        const distBase = distanciaMarteKm(e.latlng, L.latLng(MISSION_CENTER.lat, MISSION_CENTER.lon)).toFixed(2);

        const tituloUnidade = geo ? geo.name : "Platô Regolítico Não Mapeado";
        const descricaoLocal = geo
            ? `${geo.desc} Potencial hídrico estimado: <b>~${geo.waterYieldLitersPerTon} L/ton</b>. Distância da base: <b>${distBase} km</b>.`
            : `Terreno basáltico externo fora das unidades catalogadas. Distância da base: <b>${distBase} km</b>.`;

        L.popup()
            .setLatLng(e.latlng)
            .setContent(`
                <div class="font-sans max-w-xs">
                    <span class="text-[10px] uppercase font-bold text-amber-400">INSPEÇÃO DE TERRENO // ${setor.toUpperCase()}</span>
                    <h3 class="font-bold text-sm mt-0.5 text-white">${tituloUnidade}</h3>
                    <div class="text-xs font-mono text-cyan-300 mt-1">Lat: ${e.latlng.lat.toFixed(3)}° | Lon: ${e.latlng.lng.toFixed(3)}° | Alt: ${altM} m</div>
                    <div class="text-[11px] font-mono text-emerald-300 mt-0.5">Pressão: ${amb.pressaoPa} Pa | Temp: ${amb.tempC}°C</div>
                    <p class="text-xs text-slate-300 mt-1.5 leading-relaxed">${descricaoLocal}</p>
                </div>
            `)
            .openOn(map);
        return;
    }

    // MODO 2 (Quando Simulador de Teste está aberto): Traça rota de teste A* e exibe os dados
    if (routePoints.length >= 2) clearRoute();

    routePoints.push(e.latlng);
    const marker = L.circleMarker(e.latlng, {
        pane: 'missionOverlayPane',
        radius: 5, fillColor: '#f8fafc', color: '#0284c7', weight: 2, fillOpacity: 1
    }).addTo(map);
    
    routeMarkers.push(marker);

    if (routePoints.length === 2) {
        const resultadoRota = calcularMelhorRotaAStar(routePoints[0], routePoints[1]);
        const stats = analisarTrajetoriaCompleta(resultadoRota);

        const isDangerous = stats.bloqueadaPorParede || stats.inclinacaoMaximaDeg > 18 || stats.consumoO2Pct > 85;
        routeLine = L.polyline(resultadoRota.waypoints, {
            pane: 'missionOverlayPane',
            color: isDangerous ? '#ef4444' : '#38bdf8',
            weight: 3.5,
            dashArray: stats.bloqueadaPorParede ? '6, 8' : null,
            smoothFactor: 1.5
        }).addTo(map);

        if (stats.bloqueadaPorParede) {
            routeLine.bindPopup(`
                <div class="font-sans text-xs">
                    <div class="font-bold text-red-400 uppercase">⚠ Travessia Bloqueada pelo Relevo</div>
                    <p class="text-slate-300 mt-1">${stats.motivoBloqueio}. Não é possível atravessar paredes verticais de Valles Marineris em caminhada espacial.</p>
                </div>
            `).openPopup();
        }

        atualizarPainelTelemetria(stats);
    }
});

function clearRoute() {
    routePoints = [];
    if (routeLine) {
        map.removeLayer(routeLine);
        routeLine = null;
    }
    routeMarkers.forEach(m => map.removeLayer(m));
    routeMarkers = [];

    document.getElementById('route-distance').innerText = "0.00 km";
    document.getElementById('route-elevation').innerText = "0 m";
    document.getElementById('route-slope').innerText = "0.0°";
    document.getElementById('route-slope').className = "text-slate-200 font-bold";
    document.getElementById('route-o2').innerText = "0g O₂ | 0.0 kWh";
    document.getElementById('route-o2').className = "text-cyan-400 font-bold";
    document.getElementById('route-resource').innerText = "--";
    document.getElementById('route-resource').className = "text-slate-500 text-right";
    document.getElementById('route-yield').innerText = "0 L/ton";
}

const clearRouteBtn = document.getElementById('clear-route');
if (clearRouteBtn) {
    clearRouteBtn.addEventListener('click', clearRoute);
}

// ============================================================================
// 9. CONTROLE DO ÍCONE DISCRETO DE DIAGNÓSTICO CIENTÍFICO
// ============================================================================
const toggleDiagBtn = document.getElementById('toggle-diagnosis-btn');
const closeDiagBtn = document.getElementById('close-diagnosis-btn');
const diagCard = document.getElementById('mission-diagnosis-card');

if (toggleDiagBtn && diagCard) {
    toggleDiagBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        diagCard.classList.toggle('hidden');
    });
}

if (closeDiagBtn && diagCard) {
    closeDiagBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        diagCard.classList.add('hidden');
    });
}
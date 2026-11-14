// CENTRO DA OPERAÇÃO: Base Candor Alpha (Raio Operacional de 200 km em Marte)
const MISSION_CENTER = {
    lat: -6.62,
    lon: -70.75,
    radiusMarsKm: 200
};

// UNIDADES GEOLÓGICAS HÍDRICAS NO SETOR CANDOR CHASMA (Raio de 200 km)
// Fontes: NASA MRO (CRISM), Mars Odyssey (GRS/HEND) & ESA Mars Express (OMEGA)
const vallesMarinerisGeology = {
    "type": "FeatureCollection",
    "features": [
        // 1. SULFATOS POLIHIDRATADOS (Candor Mensa Norte/Central - ~45 km da base)
        {
            "type": "Feature",
            "properties": {
                "code": "Hcs",
                "name": "Depósito Estratificado Candor Mensa (Sulfatos)",
                "mineral": "Kieserita & Gipsita Polihidratada (12-15% H₂O)",
                "mission": "NASA MRO (CRISM) / Mars Express (OMEGA)",
                "waterYieldLitersPerTon": 125,
                "extractionMethod": "Aquecimento térmico moderado (150°C - 200°C)",
                "color": "#ea580c",
                "desc": "Formação acamadada interna (ILD) rica em sulfatos hidratados. Principal reserva de fácil extração a norte da base."
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [-71.45, -5.85], [-71.15, -5.75], [-70.75, -5.80], [-70.45, -5.95],
                    [-70.35, -6.18], [-70.55, -6.32], [-70.95, -6.35], [-71.30, -6.22],
                    [-71.50, -6.02], [-71.45, -5.85]
                ]]
            }
        },

        // 2. VEIOS DE OPALA HIDRATADA (Falha Sudoeste de Candor - ~65 km da base)
        {
            "type": "Feature",
            "properties": {
                "code": "Hvo",
                "name": "Veios Hidrotermais de Opala Hidratada",
                "mineral": "Sílica Opalina & Filossilicatos (SiO₂·nH₂O)",
                "mission": "NASA MRO (CRISM Bandas 1.9µm / 2.2µm)",
                "waterYieldLitersPerTon": 90,
                "extractionMethod": "Trituração e dessorção térmica (220°C)",
                "color": "#c026d3",
                "desc": "Afloramentos claros na transição entre Candor Chasma e Melas Labes, formados por circulação hidrotermal antiga."
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [-72.10, -6.65], [-71.75, -6.55], [-71.40, -6.65], [-71.25, -6.88],
                    [-71.35, -7.15], [-71.70, -7.25], [-72.05, -7.10], [-72.20, -6.85],
                    [-72.10, -6.65]
                ]]
            }
        },

        // 3. ANOMALIA DE HIDROGÊNIO SUBSUPERFICIAL (Bacia Leste de Candor - ~55 km da base)
        {
            "type": "Feature",
            "properties": {
                "code": "Qsu",
                "name": "Bacia de Hidrogênio Subsuperficial (WEH > 6%)",
                "mineral": "Regolito Hidratado / Gelo Intersticial Raso",
                "mission": "NASA Mars Odyssey (GRS/HEND) / ExoMars FREND",
                "waterYieldLitersPerTon": 75,
                "extractionMethod": "Escavação rasa (0.5m - 1.0m) + Destilação",
                "color": "#2563eb",
                "desc": "Planície sedimentar protegida na sombra da escarpa sul, com alta retenção de hidrogênio no primeiro metro do solo."
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [-70.35, -6.50], [-69.95, -6.45], [-69.65, -6.62], [-69.60, -6.92],
                    [-69.85, -7.15], [-70.25, -7.12], [-70.45, -6.88], [-70.42, -6.65],
                    [-70.35, -6.50]
                ]]
            }
        }
    ]
};

// Pontos de Operação EVA dentro do raio de 200 km
const isruTargets = [
    {
        name: "Base Operacional Candor Alpha",
        type: "Habitat / Centro do Perímetro (200 km)",
        lat: -6.62,
        lon: -70.75,
        yield: "Ponto Zero (0 km)",
        detail: "Planície central consolidada no Candor Chasma (-4.250m). Centro de operações e suporte de vida."
    },
    {
        name: "Poço ILD-01 (Candor Mensa)",
        type: "Alvo Primário: Sulfatos (48 km N)",
        lat: -6.05,
        lon: -70.90,
        yield: "~125 L H₂O / ton",
        detail: "Afloramento estratificado de kieserita. Maior rendimento hídrico dentro do alcance operacional."
    },
    {
        name: "Fissura Opalina SW",
        type: "Alvo: Opala Hidratada (62 km SW)",
        lat: -6.90,
        lon: -71.72,
        yield: "~90 L H₂O / ton",
        detail: "Depósito de sílica hidratada acessível pela calha oeste sem precisar escalar os paredões principais."
    },
    {
        name: "Estação de Sondagem HEND-E",
        type: "Alvo: Hidrogênio WEH (52 km E)",
        lat: -6.78,
        lon: -69.95,
        yield: "~75 L H₂O / ton",
        detail: "Terreno plano com alta concentração de hidrogênio subsuperficial. Baixíssimo custo energético de acesso."
    }
];
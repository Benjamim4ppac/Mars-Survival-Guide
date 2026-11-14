// CENTRO DA OPERAÇÃO HIPERLOCALIZADA: Setor Ophir-Mutch (Raio EVA de 12 km)
const MISSION_CENTER = {
    lat: -3.28,
    lon: -60.62,
    radiusMarsKm: 12
};

// Pontos de Operação EVA alinhados aos polígonos reais do GeoJSON
const isruTargets = [
    {
        name: "Módulo de Pouso Ares-01 (Planície Segura)",
        type: "Habitat / Ponto Zero (0 km)",
        lat: -3.28,
        lon: -60.62,
        yield: "Base Operacional",
        image: "https://mars.nasa.gov/system/resources/detail_files/26895_PIA25326-web.jpg",
        detail: "Planície basáltica plana com baixa declividade (< 3°), ideal para pouso seguro (EDL) e montagem do painel solar."
    },
    {
        name: "Escarpa de Sulfatos (Borda Oeste da Cratera)",
        type: "Alvo Primário H₂O: Sulfatos [Hcs] (3.5 km E)",
        lat: -3.26,
        lon: -60.51,
        yield: "~125 L H₂O / ton",
        image: "https://mars.nasa.gov/system/resources/detail_files/25711_PIA24422-web.jpg",
        detail: "Camadas claras de kieserita expostas pelo impacto. Principal fonte de extração rápida de água por aquecimento térmico."
    },
    {
        name: "Terraço Sedimentar Interno (Anel Sul)",
        type: "Alvo Científico: Gelo Subsuperficial [Hch] (5.8 km SE)",
        lat: -3.34,
        lon: -60.45,
        yield: "~95 L H₂O / ton",
        image: "https://mars.nasa.gov/system/resources/detail_files/26425_PIA24924-web.jpg",
        detail: "Depósito retrabalhado protegido na sombra da parede sul da cratera, preservando voláteis subsuperficiais."
    },
    {
        name: "Veio Hidrotermal Norte (Fossa Ophir)",
        type: "Alvo Científico: Opala Hidratada [Hvo] (7.5 km NW)",
        lat: -3.14,
        lon: -60.75,
        yield: "~90 L H₂O / ton",
        image: "https://mars.nasa.gov/system/resources/detail_files/25043_PIA23884-web.jpg",
        detail: "Fratura tectônica com sílica opalina hidratada, evidência de atividade hidrotermal passada."
    }
];
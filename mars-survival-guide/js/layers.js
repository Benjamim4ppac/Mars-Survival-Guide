const nasaLayers = {
    // 1. Viking Color Mosaic (Base óptica de Marte - CDN OpenPlanetary / NASA)
    viking: L.tileLayer(
        'https://cartocdn-gusc.global.ssl.fastly.net/opmbuilder/api/v1/map/named/opm-mars-basemap-v0-2/all/{z}/{x}/{y}.png',
        {
            attribution: 'NASA / USGS / OpenPlanetary (Mars Basemap)',
            maxNativeZoom: 9,
            maxZoom: 16,
            noWrap: true
        }
    ),

    // 2. THEMIS Day IR Mosaic (100m/px - Textura térmica e relevo do Valles Marineris)
    themis: L.tileLayer(
        'https://trek.nasa.gov/tiles/Mars/EQ/Mars_MO_THEMIS-IR-Day_mosaic_global_100m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg',
        {
            attribution: 'NASA / JPL / ASU (THEMIS Day IR)',
            maxNativeZoom: 7,
            maxZoom: 16,
            noWrap: true
        }
    ),

    // 3. MOLA Altimetria Colorida (Profundidade do Valles Marineris)
    mola: L.tileLayer(
        'https://trek.nasa.gov/tiles/Mars/EQ/Mars_MGS_MOLA_ClrShade_merge_global_463m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg',
        {
            attribution: 'NASA / JPL / GSFC (MOLA Elevation)',
            maxNativeZoom: 6,
            maxZoom: 16,
            noWrap: true
        }
    ),

    // 4. Overlay de Relevo Sombreado (Hillshade)
    hillshade: L.tileLayer(
        'https://trek.nasa.gov/tiles/Mars/EQ/Mars_MGS_MOLA_Shade_merge_global_463m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg',
        {
            attribution: 'NASA MOLA Hillshade',
            maxNativeZoom: 6,
            maxZoom: 16,
            opacity: 0.4,
            noWrap: true
        }
    )
};
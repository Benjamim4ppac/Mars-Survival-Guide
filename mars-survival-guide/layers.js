const nasaLayers = {
    // 1. Base Global (Para visão geral de Marte)
    viking: L.tileLayer(
        'https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg',
        { attribution: 'NASA / JPL / USGS (Viking)', maxNativeZoom: 9, maxZoom: 18, noWrap: true }
    ),
    // 2.  Elevação Global (MOLA)
    mola: L.tileLayer(
        'https://trek.nasa.gov/tiles/Mars/EQ/Mars_MGS_MOLA_ClrShade_merge_global_463m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg',
        { attribution: 'NASA / JPL / GSFC (MOLA)', maxNativeZoom: 8, maxZoom: 18, noWrap: true }
    ),
    // 3. Relevo Sombreado (Hillshade)
    hillshade: L.tileLayer(
        'https://trek.nasa.gov/tiles/Mars/EQ/Mars_MGS_MOLA_Shade_merge_global_463m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg',
        { attribution: 'NASA MOLA Hillshade', maxNativeZoom: 8, maxZoom: 18, opacity: 0.45, noWrap: true }
    ),
    // 4. ALTA RESOLUÇÃO JEZERO (Câmera CTX - 6 metros/pixel) -> Perfeito para EVA!
    jezeroCTX: L.tileLayer(
        'https://trek.nasa.gov/tiles/Mars/EQ/Jezero_MRO_CTX_Mosaic_6m/1.0.0/default/default028mm/{z}/{y}/{x}.png',
        { 
            attribution: 'NASA / JPL / MSSS (CTX 6m)', 
            maxNativeZoom: 15, 
            maxZoom: 18,
            bounds: [[17.8, 76.8], [19.0, 78.2]] // Carrega apenas na região de Jezero
        }
    )
};
// Endpoints públicos oficiais do NASA Mars Trek (WMTS)
const nasaLayers = {
    viking: L.tileLayer(
        'https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg',
        {
            attribution: 'NASA / JPL / USGS (Viking Mosaic)',
            maxZoom: 9,
            noWrap: true
        }
    ),
    mola: L.tileLayer(
        'https://trek.nasa.gov/tiles/Mars/EQ/Mars_MGS_MOLA_ClrShade_merge_global_463m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg',
        {
            attribution: 'NASA / JPL / GSFC (MOLA Elevation)',
            maxZoom: 8,
            noWrap: true
        }
    )
};
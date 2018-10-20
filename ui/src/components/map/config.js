export const TILE_HOST = process.env.NODE_ENV === "production" ? "http://34.237.24.48:8000" : "http://localhost:8000"

export const COUNT_COLORS = [
    "#fff7ec",
    "#fee8c8",
    "#fdd49e",
    "#fdbb84",
    "#fc8d59",
    "#ef6548",
    "#d7301f",
    "#b30000",
    "#7f0000"
]

export const LAYER_CONFIG = [
    { id: "HUC2", group: "HUC", minzoom: 0, maxzoom: 4.5, title: "Hydrologic region" },
    { id: "HUC4", group: "HUC", minzoom: 4.5, maxzoom: 6, title: "Hydrologic subregion" },
    { id: "HUC8", group: "HUC", minzoom: 6, maxzoom: 21, title: "Hydrologic subbasin" },
    { id: "ECO3", group: "ECO", minzoom: 0, maxzoom: 6, title: "Level 3 Ecoregion" },
    { id: "ECO4", group: "ECO", minzoom: 6, maxzoom: 21, title: "Level 4 Ecoregion" },
    { id: "states", group: "states", minzoom: 0, maxzoom: 21, title: "State" }
]

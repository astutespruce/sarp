"""Update summary unit map tiles with summary statistics of dams and small barriers
within them.

Base summary unit map tile are created using `analysis/prep/boundaries/create_region_tiles.py`.

These statistics are based on:
* dams: not dropped or duplicate
* small_barriers: not duplicate (dropped barriers are included in stats)
* road crossings

This is run AFTER running `aggregate_networks.py`

Inputs:
* `data/api/dams.feather`
* `data/api/small_barriers.feather`
* `data/api/road_crossings.feather`

Outputs:
* `/tiles/summary.mbtiles`
* `/data/api/map_units.feather`

"""

from pathlib import Path
import subprocess

import pandas as pd
import pyarrow as pa
from pyarrow.csv import write_csv

from analysis.lib.util import append

# Note: states are identified by name, whereas counties are uniquely identified by
# FIPS code.
# The values from these fields in the dams / small_barriers data must exactly match
# the IDs for those units set when the vector tiles of those units are created, otherwise
# they won't join properly in the frontend.

SUMMARY_UNITS = [
    "State",
    "COUNTYFIPS",
    "HUC2",
    "HUC6",
    "HUC8",
    "HUC10",
    "HUC12",
]

INT_COLS = [
    "dams",
    "recon_dams",
    "ranked_dams",
    "small_barriers",
    "total_small_barriers",
    "crossings",
    "ranked_small_barriers",
]


# use local clone of github.com/tippecanoe
tile_join = "../lib/tippecanoe/tile-join"

data_dir = Path("data")
api_dir = data_dir / "api"
src_dir = data_dir / "barriers/master"
bnd_dir = data_dir / "boundaries"
results_dir = data_dir / "barriers/networks"
ui_data_dir = Path("ui/data")
src_tile_dir = data_dir / "tiles"
out_tile_dir = Path("tiles")
tmp_dir = Path("/tmp")


### Read dams
dams = pd.read_feather(
    results_dir / f"dams.feather",
    columns=["id", "HasNetwork"] + SUMMARY_UNITS,
).set_index("id", drop=False)

# Get recon from master
dams_master = pd.read_feather(
    src_dir / "dams.feather", columns=["id", "Recon", "unranked"]
).set_index("id")
dams = dams.join(dams_master)
dams["Recon"] = dams.Recon > 0

dams["Ranked"] = dams.HasNetwork & (dams.unranked == 0)


### Read road-related barriers
barriers = pd.read_feather(
    results_dir / "small_barriers.feather",
    columns=["id", "HasNetwork"] + SUMMARY_UNITS,
).set_index("id", drop=False)

barriers_master = pd.read_feather(
    "data/barriers/master/small_barriers.feather",
    columns=["id", "dropped", "excluded", "unranked"],
).set_index("id")

barriers = barriers.join(barriers_master)

# barriers that were not dropped or excluded are likely to have impacts
barriers["Included"] = ~(barriers.dropped | barriers.excluded)

barriers["Ranked"] = barriers.HasNetwork & (barriers.unranked == 0)

### Read road / stream crossings
# NOTE: crossings are already de-duplicated against each other and against
# barriers
crossings = pd.read_feather(
    src_dir / "road_crossings.feather", columns=["id"] + SUMMARY_UNITS
)


# Calculate summary statistics for each type of summary unit
# These are joined to vector tiles
stats = None
mbtiles_files = []
for unit in SUMMARY_UNITS:
    print(f"processing {unit}")

    if unit == "State":
        units = pd.read_feather(
            bnd_dir / "region_states.feather", columns=["id"]
        ).set_index("id")
    elif unit == "COUNTYFIPS":
        units = pd.read_feather(
            bnd_dir / "region_counties.feather", columns=["id"]
        ).set_index("id")
    else:
        units = pd.read_feather(bnd_dir / f"{unit}.feather", columns=[unit]).set_index(
            unit
        )

    dam_stats = (
        dams[[unit, "id", "Ranked", "Recon"]]
        .groupby(unit)
        .agg({"id": "count", "Ranked": "sum", "Recon": "sum"})
        .rename(
            columns={
                "id": "dams",
                "Ranked": "ranked_dams",
                "Recon": "recon_dams",
            }
        )
    )

    barriers_stats = (
        barriers[[unit, "id", "Included", "Ranked"]]
        .groupby(unit)
        .agg(
            {
                "id": "count",
                "Included": "sum",
                "Ranked": "sum",
            }
        )
        .rename(
            columns={
                "id": "total_small_barriers",
                "Included": "small_barriers",
                "Ranked": "ranked_small_barriers",
            }
        )
    )

    crossing_stats = crossings[[unit, "id"]].groupby(unit).size().rename("crossings")

    merged = (
        units.join(dam_stats, how="left")
        .join(barriers_stats, how="left")
        .join(crossing_stats, how="left")
        .fillna(0)
    )
    merged[INT_COLS] = merged[INT_COLS].astype("uint32")

    unit = "County" if unit == "COUNTYFIPS" else unit

    # collate stats
    tmp = merged[["ranked_dams", "ranked_small_barriers", "crossings"]].copy()
    tmp.index.name = "id"
    tmp = tmp.reset_index()
    tmp["layer"] = unit
    stats = append(stats, tmp)

    # Write summary CSV for each unit type
    merged.index.name = "id"
    write_csv(pa.Table.from_pandas(merged.reset_index()), tmp_dir / f"{unit}.csv")

    # join to tiles
    mbtiles_filename = f"{tmp_dir}/{unit}_summary.mbtiles"
    mbtiles_files.append(mbtiles_filename)

    ret = subprocess.run(
        [
            tile_join,
            "-f",
            "-pg",
            "-o",
            mbtiles_filename,
            "-c",
            f"{tmp_dir}/{unit}.csv",
            f"{src_tile_dir}/{unit}.mbtiles",
        ]
    )
    ret.check_returncode()


# join all summary tiles together
print("Merging all summary tiles")
ret = subprocess.run(
    [
        tile_join,
        "-f",
        "-pg",
        "--no-tile-size-limit",
        "-o",
        f"{out_tile_dir}/summary.mbtiles",
        f"{src_tile_dir}/mask.mbtiles",
        f"{src_tile_dir}/boundary.mbtiles",
    ]
    + mbtiles_files
)
ret.check_returncode()


# output unit stats with bounds for API
# NOTE: not currently using bounds
units = pd.read_feather(
    bnd_dir / "unit_bounds.feather",
    columns=["layer", "priority", "id", "state", "name", "key"],
).set_index(["layer", "id"])
out = units.join(stats.set_index(["layer", "id"]))
out.reset_index().to_feather(api_dir / "map_units.feather")

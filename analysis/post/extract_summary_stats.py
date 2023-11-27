from pathlib import Path
import json

import numpy as np
import pandas as pd

from analysis.constants import STATES, REGION_STATES

# Bin year removed in to smaller groups
# 0 = unknown
# 1 = <= 1999
YEAR_REMOVED_BINS = [0, 1, 2000, 2010, 2020, 2021, 2022, 2023, 2024]


def calc_year_removed_bin(series):
    return pd.cut(series, bins=YEAR_REMOVED_BINS, right=False, labels=np.arange(0, len(YEAR_REMOVED_BINS) - 1))


def pack_year_removed_stats(df):
    """Combine year removed counts and gained miles into a single string:
    <year_bin>:<count>|<gainmiles>,...
    """
    stats = (
        df[["YearRemoved", "RemovedGainMiles"]]
        .reset_index()
        .groupby("YearRemoved", observed=True)
        .agg({"id": "count", "RemovedGainMiles": "sum"})
        .apply(lambda row: f"{int(row.id)}|{row.RemovedGainMiles:.2f}", axis=1)
        .to_dict()
    )
    if len(stats) == 0:
        return ""

    bins = range(len(YEAR_REMOVED_BINS) - 1)
    return ",".join([stats.get(bin, "") for bin in bins])


data_dir = Path("data")
src_dir = data_dir / "barriers/master"
api_dir = data_dir / "api"
ui_data_dir = Path("ui/data")


### Read dams
dams = pd.read_feather(
    api_dir / "dams.feather",
    columns=["id", "HUC2", "HasNetwork", "Ranked", "Removed", "State"],
).set_index("id", drop=False)
# Get recon from master
dams_master = pd.read_feather(src_dir / "dams.feather", columns=["id", "Recon"]).set_index("id")
dams = dams.join(dams_master)

# get stats for removed dams
removed_dam_networks = (
    pd.read_feather(
        data_dir / "networks/clean/removed/removed_dams_networks.feather",
        columns=["id", "EffectiveGainMiles", "YearRemoved"],
    )
    .set_index("id")
    .rename(columns={"EffectiveGainMiles": "RemovedGainMiles"})
)
removed_dam_networks["YearRemoved"] = calc_year_removed_bin(removed_dam_networks.YearRemoved)
dams = dams.join(removed_dam_networks)
dams["RemovedGainMiles"] = dams.RemovedGainMiles.fillna(0)


### Read road-related barriers
barriers = pd.read_feather(
    api_dir / "small_barriers.feather",
    columns=["id", "HasNetwork", "Ranked", "Removed", "State"],
).set_index("id", drop=False)
barriers_master = pd.read_feather(
    "data/barriers/master/small_barriers.feather", columns=["id", "dropped", "excluded"]
).set_index("id")

barriers = barriers.join(barriers_master)

removed_barrier_networks = (
    pd.read_feather(
        data_dir / "networks/clean/removed/removed_combined_barriers_networks.feather",
        columns=["id", "EffectiveGainMiles", "YearRemoved"],
    )
    .set_index("id")
    .rename(columns={"EffectiveGainMiles": "RemovedGainMiles"})
)
removed_barrier_networks["YearRemoved"] = calc_year_removed_bin(removed_barrier_networks.YearRemoved)
barriers = barriers.join(removed_barrier_networks)
barriers["RemovedGainMiles"] = barriers.RemovedGainMiles.fillna(0)

# barriers that were not dropped or excluded are likely to have impacts
barriers["Included"] = ~(barriers.dropped | barriers.excluded)


largefish_barriers = pd.read_feather(
    api_dir / "largefish_barriers.feather",
    columns=["id", "BarrierType", "Ranked"],
)

smallfish_barriers = pd.read_feather(
    api_dir / "smallfish_barriers.feather",
    columns=["id", "BarrierType", "Ranked"],
)


### Read road / stream crossings
# NOTE: crossings are already de-duplicated against each other and against
# barriers
crossings = pd.read_feather(src_dir / "road_crossings.feather", columns=["id", "State", "NearestBarrierID"])


# Calculate summary stats for entire analysis area
# NOTE: this is limited to the states fully within the analysis region and excludes
# HUC4s that cross their borders

analysis_states = STATES.keys()
analysis_dams = dams.loc[dams.State.isin(analysis_states)]
analysis_barriers = barriers.loc[barriers.State.isin(analysis_states)]
analysis_crossings = crossings.loc[crossings.State.isin(analysis_states) & (crossings.NearestBarrierID == "")]

stats = {
    "total": {
        "dams": len(analysis_dams),
        "ranked_dams": int(analysis_dams.Ranked.sum()),
        "recon_dams": int((analysis_dams.Recon > 0).sum()),
        "ranked_largefish_barriers_dams": int(
            (largefish_barriers.loc[largefish_barriers.BarrierType == "dams"].Ranked).sum()
        ),
        "ranked_smallfish_barriers_dams": int(
            (smallfish_barriers.loc[largefish_barriers.BarrierType == "dams"].Ranked).sum()
        ),
        "removed_dams": int(analysis_dams.Removed.sum()),
        "removed_dams_gain_miles": int(round(analysis_dams.RemovedGainMiles.sum())),
        "removed_dams_by_year": pack_year_removed_stats(analysis_dams),
        "total_small_barriers": len(analysis_barriers),
        "small_barriers": int(analysis_barriers.Included.sum()),
        "ranked_small_barriers": int(analysis_barriers.Ranked.sum()),
        "ranked_largefish_barriers_small_barriers": int(
            (largefish_barriers.loc[largefish_barriers.BarrierType == "small_barriers"].Ranked).sum()
        ),
        "ranked_smallfish_barriers_small_barriers": int(
            (smallfish_barriers.loc[largefish_barriers.BarrierType == "small_barriers"].Ranked).sum()
        ),
        "removed_small_barriers": int(analysis_barriers.Removed.sum()),
        "removed_small_barriers_gain_miles": int(round(analysis_barriers.RemovedGainMiles.sum())),
        "removed_small_barriers_by_year": pack_year_removed_stats(analysis_barriers),
        "crossings": len(analysis_crossings),
    }
}

# Calculate stats for regions
# NOTE: these are groupings of states and some states may be in multiple regions
region_stats = []
for region, region_states in REGION_STATES.items():
    region_dams = dams.loc[dams.State.isin(region_states)]
    region_barriers = barriers.loc[barriers.State.isin(region_states)]
    region_crossings = crossings.loc[crossings.State.isin(region_states)]

    region_stats.append(
        {
            "id": region,
            "dams": len(region_dams),
            "ranked_dams": int(region_dams.Ranked.sum()),
            "recon_dams": int((region_dams.Recon > 0).sum()),
            "removed_dams": int(region_dams.Removed.sum()),
            "removed_dams_gain_miles": int(round(region_dams.RemovedGainMiles.sum())),
            "removed_dams_by_year": pack_year_removed_stats(region_dams),
            "total_small_barriers": len(region_barriers),
            "small_barriers": int(region_barriers.Included.sum()),
            "ranked_small_barriers": int(region_barriers.Ranked.sum()),
            "removed_small_barriers": int(region_barriers.Removed.sum()),
            "removed_small_barriers_gain_miles": int(round(region_barriers.RemovedGainMiles.sum())),
            "removed_small_barriers_by_year": pack_year_removed_stats(region_barriers),
            "crossings": len(region_crossings),
        }
    )

stats["region"] = region_stats


# only extract core counts in states for data download page,
# as other stats are joined to state vector tiles elsewhere
state_stats = []
for state in sorted(STATES.keys()):
    state_dams = dams.loc[dams.State == state]
    state_barriers = barriers.loc[barriers.State == state]

    # NOTE: removed barrier counts not currently used at state level in this
    # data structure; only used in tiles
    state_stats.append(
        {
            "id": state,
            "dams": int(len(state_dams)),
            "recon_dams": int((state_dams.Recon > 0).sum()),
            # "removed_dams": int(state_dams.Removed.sum()),
            # "removed_dams_gain_miles": int(round(state_dams.RemovedGainMiles.sum())),
            "total_small_barriers": int(len(state_barriers)),
            "small_barriers": int(state_barriers.Included.sum()),
            # "removed_small_barriers": int(state_barriers.Removed.sum()),
            # "removed_small_barriers_gain_miles": int(round(state_barriers.RemovedGainMiles.sum())),
        }
    )
stats["State"] = state_stats

# Write the summary statistics into the UI directory so that it can be imported at build time
# into the code
with open(ui_data_dir / "summary_stats.json", "w") as outfile:
    outfile.write(json.dumps(stats))

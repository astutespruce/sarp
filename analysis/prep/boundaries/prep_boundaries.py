"""
Create geofeather files for each of the input boundaries, in the same projection
as barriers (EPSG:102003 - CONUS Albers).

Note: output shapefiles for creating tilesets are limited to only those areas that overlap
the SARP states boundary.
"""
from pathlib import Path
import warnings

import geopandas as gp
import numpy as np
import pandas as pd
import shapely
from pyogrio import read_dataframe, write_dataframe

from analysis.constants import (
    CRS,
    GEO_CRS,
    OWNERTYPE_TO_DOMAIN,
    OWNERTYPE_TO_PUBLIC_LAND,
    STATES,
)
from analysis.lib.geometry import explode, dissolve, to_multipolygon


def encode_bbox(geometries):
    return np.apply_along_axis(
        lambda bbox: ",".join([str(v) for v in bbox]),
        arr=shapely.bounds(geometries).round(3).tolist(),
        axis=1,
    )


data_dir = Path("data")
out_dir = data_dir / "boundaries"
src_dir = out_dir / "source"

county_filename = src_dir / "tl_2022_us_county.shp"
huc4_df = gp.read_feather(out_dir / "huc4.feather")

# state outer boundaries, NOT analysis boundaries
bnd_df = gp.read_feather(out_dir / "region_boundary.feather")
bnd = bnd_df.loc[bnd_df.id == "total"].geometry.values.data[0]
bnd_geo = bnd_df.loc[bnd_df.id == "total"].to_crs(GEO_CRS).geometry.values.data[0]

state_df = gp.read_feather(
    out_dir / "region_states.feather", columns=["STATEFIPS", "geometry", "id"]
)

# Clip HUC4 areas outside state boundaries; these are remainder
state_merged = shapely.coverage_union_all(state_df.geometry.values.data)

# find all that intersect but are not contained
tree = shapely.STRtree(huc4_df.geometry.values.data)
intersects_ix = tree.query(state_merged, predicate="intersects")
contains_ix = tree.query(state_merged, predicate="contains")
ix = np.setdiff1d(intersects_ix, contains_ix)

outer_huc4 = huc4_df.iloc[ix].copy()
outer_huc4["km2"] = shapely.area(outer_huc4.geometry.values.data) / 1e6

# calculate geometric difference, explode, and keep non-slivers
# outer HUC4s are used to clip NID dams for areas outside region states for which
# inventoried dams are available
outer_huc4["geometry"] = shapely.difference(
    outer_huc4.geometry.values.data, state_merged
)
outer_huc4 = explode(outer_huc4)
outer_huc4["clip_km2"] = shapely.area(outer_huc4.geometry.values.data) / 1e6
outer_huc4["percent"] = 100 * outer_huc4.clip_km2 / outer_huc4.km2
keep_huc4 = outer_huc4.loc[outer_huc4.clip_km2 >= 100].HUC4.unique()
outer_huc4 = outer_huc4.loc[
    outer_huc4.HUC4.isin(keep_huc4) & (outer_huc4.clip_km2 >= 2.5)
].copy()
outer_huc4 = dissolve(outer_huc4, by="HUC4", agg={"HUC2": "first"}).reset_index(
    drop=True
)
outer_huc4.to_feather(out_dir / "outer_huc4.feather")
write_dataframe(outer_huc4, out_dir / "outer_huc4.fgb")

### Counties - within HUC4 bounds
print("Processing counties")
state_fips = sorted(state_df.STATEFIPS.unique())

county_df = (
    read_dataframe(
        county_filename,
        columns=["NAME", "GEOID", "STATEFP"],
    )
    .to_crs(CRS)
    .rename(columns={"NAME": "County", "GEOID": "COUNTYFIPS", "STATEFP": "STATEFIPS"})
)

# keep only those within the region HUC4 outer boundary
tree = shapely.STRtree(county_df.geometry.values.data)
ix = np.unique(tree.query(huc4_df.geometry.values.data, predicate="intersects")[1])
ix.sort()
county_df = county_df.iloc[ix].reset_index(drop=True)
county_df.geometry = to_multipolygon(shapely.make_valid(county_df.geometry.values.data))

# keep larger set for spatial joins
county_df.to_feather(out_dir / "counties.feather")
write_dataframe(county_df, out_dir / "counties.fgb")

# Subset these in the region for tiles and summary stats
county_df.loc[county_df.STATEFIPS.isin(state_fips)].rename(
    columns={"COUNTYFIPS": "id", "County": "name"}
).to_feather(out_dir / "region_counties.feather")


### Extract bounds and names for unit search in user interface
print("Projecting geometries to geographic coordinates for search index")
print("Processing state and county")
state_geo_df = (
    gp.read_feather(
        out_dir / "states.feather", columns=["geometry", "id", "State", "STATEFIPS"]
    )
    .rename(columns={"State": "name"})
    .to_crs(GEO_CRS)
)
state_geo_df["bbox"] = encode_bbox(state_geo_df.geometry.values.data)
state_geo_df["in_region"] = state_geo_df.id.isin(STATES)
state_geo_df["state"] = ""  # state_geo_df.id
state_geo_df["layer"] = "State"
state_geo_df["priority"] = 1
state_geo_df["key"] = state_geo_df["name"]

county_geo_df = (
    county_df.loc[county_df.STATEFIPS.isin(state_fips)]
    .rename(columns={"COUNTYFIPS": "id", "County": "name"})
    .join(state_df.set_index("STATEFIPS").id.rename("state"), on="STATEFIPS")
    .to_crs(GEO_CRS)
    .join(state_geo_df.set_index("STATEFIPS").name.rename("state_name"), on="STATEFIPS")
)
county_geo_df["name"] = county_geo_df["name"] + " County"
county_geo_df["bbox"] = encode_bbox(county_geo_df.geometry.values.data)
county_geo_df["layer"] = "County"
county_geo_df["priority"] = 2
county_geo_df["key"] = county_geo_df["name"] + " " + county_geo_df.state_name

out = pd.concat(
    [
        state_geo_df.loc[state_geo_df.in_region][
            ["layer", "priority", "id", "state", "name", "key", "bbox"]
        ],
        county_geo_df[["layer", "priority", "id", "state", "name", "key", "bbox"]],
    ],
    sort=False,
    ignore_index=True,
)

for i, unit in enumerate(["HUC2", "HUC6", "HUC8", "HUC10", "HUC12"]):
    print(f"Processing {unit}")
    df = (
        gp.read_feather(out_dir / f"{unit.lower()}.feather")
        .rename(columns={unit: "id"})
        .to_crs(GEO_CRS)
    )

    df["bbox"] = encode_bbox(df.geometry.values.data)
    df["layer"] = unit
    df["priority"] = i + 2

    # only keep those that overlap the boundary
    tree = shapely.STRtree(df.geometry.values.data)
    ix = tree.query(bnd_geo, predicate="intersects")
    df = df.loc[ix]

    # spatially join to states
    tree = shapely.STRtree(state_geo_df.geometry.values.data)
    left, right = tree.query(df.geometry.values.data, predicate="intersects")
    unit_states = (
        pd.DataFrame(
            {
                "id": df.id.values.take(left),
                "state": state_geo_df.id.values.take(right),
            }
        )
        .groupby("id")["state"]
        .unique()
        .apply(sorted)
    )

    df = df.join(unit_states, on="id")
    df["state"] = df.state.fillna("").apply(lambda x: ",".join(x))
    df["key"] = df.name + " " + df.id

    out = pd.concat(
        [out, df[["layer", "priority", "id", "state", "name", "key", "bbox"]]],
        sort=False,
        ignore_index=True,
    )

out.reset_index(drop=True).to_feather(out_dir / "unit_bounds.feather")

### Protected areas

print("Extracting protected areas (will take a while)...")
df = (
    read_dataframe(
        src_dir / "SARP_ProtectedAreas_2021.gdb",
        layer="SARP_ProtectedArea_National_2021",
        columns=["OwnerType", "OwnerName", "EasementHolderType", "Preference"],
    )
    .to_crs(CRS)
    .rename(
        columns={
            "OwnerType": "otype",
            "OwnerName": "owner",
            "EasementHolderType": "etype",
            "Preference": "sort",
        }
    )
)

# select those that are within the boundary
tree = shapely.STRtree(df.geometry.values.data)
ix = tree.query(bnd, predicate="intersects")

df = df.take(ix)

# this takes a while...
print("Making geometries valid, this might take a while")
df.geometry = shapely.make_valid(df.geometry.values.data)


# sort on 'sort' so that later when we do spatial joins and get multiple hits, we take the ones with
# the lowest sort value (1 = highest priority) first.
df.sort = df.sort.fillna(255).astype("uint8")  # missing values should sort to bottom
df = df.sort_values(by="sort").drop(columns=["sort"])

# partner federal agencies to call out specifically
# map of substrings to search for specific owners
partner_federal = {
    "US Fish and Wildlife Service": [
        "FWS",
        "USFWS",
        "USFW",
        "US FWS",
        "U.S. Fish and Wildlife Service",
        "U. S. Fish & Wildlife Service",
        "U.S. Fish & Wildlife Service",
        "U.S. Fish and Wildlife Service (FWS)",
        "US Fish & Wildlife Service",
        "US Fish and Wildlife Service",
        "USDI FISH AND WILDLIFE SERVICE",
    ],
    "USDA Forest Service": [
        "Forest Service",
        "USFS",
        "USDA FOREST SERVICE",
        "USDA Forest Service",
        "US Forest Service",
        "USDA Forest Service",
        "U.S. Forest Service",
        "U.S. Forest Service (USFS)",
        "United States Forest Service",
    ],
}

has_owner = df.owner.notnull()
for partner, substrings in partner_federal.items():
    print("Finding specific federal partner {}".format(partner))
    # search on the primary name
    df.loc[has_owner & df.owner.str.contains(partner), "otype"] = partner

    for substring in substrings:
        df.loc[has_owner & df.owner.str.contains(substring), "otype"] = partner

    print("Found {:,} areas for that partner".format(len(df.loc[df.otype == partner])))


# convert to int groups
df["OwnerType"] = df.otype.map(OWNERTYPE_TO_DOMAIN)
# drop all that didn't get matched
# CAUTION: make sure the types we want are properly handled!
df = df.dropna(subset=["OwnerType"])
df.OwnerType = df.OwnerType.astype("uint8")

# Add in public status
df["ProtectedLand"] = (
    df.OwnerType.map(OWNERTYPE_TO_PUBLIC_LAND).fillna(False).astype("bool")
)

# only save owner type
df = df[["geometry", "OwnerType", "ProtectedLand"]].reset_index(drop=True)
df.to_feather(out_dir / "protected_areas.feather")


### Priority layers

# Conservation opportunity areas (for now the only priority type) joined to HUC8
# 1 = COA
coa = read_dataframe(src_dir / "Priority_Areas.gdb", layer="SARP_COA")[
    ["HUC_8"]
].set_index("HUC_8")
coa["coa"] = 1

# take the lowest value (highest priority) for duplicate watersheds
coa = coa.groupby(level=0).min()

# 0 = not priority for a given priority dataset
priorities = coa.fillna(0).astype("uint8")

# drop duplicates
priorities = (
    priorities.reset_index()
    .drop_duplicates()
    .rename(columns={"index": "HUC8"})
    .reset_index(drop=True)
)

# join to HUC8 dataset for tiles
huc8_df = gp.read_feather(out_dir / "huc8.feather")
df = huc8_df.join(priorities.set_index("HUC_8"), on="HUC8")

for col in ["coa"]:
    df[col] = df[col].fillna(0).astype("uint8")

df.rename(columns={"HUC8": "id"}).to_feather(out_dir / "huc8_priorities.feather")


### Environmental justice disadvantaged communities
print("Processing environmental justice areas")

# Process Census tracts for disadvantaged communities
df = read_dataframe(src_dir / "environmental_justice_tracts/usa.shp", columns=["SN_C"])
df = df.loc[df.geometry.notnull() & (df.SN_C == 1)].reset_index(drop=True)

# select areas that overlap HUC4s
tree = shapely.STRtree(df.geometry.values)
huc4_geo = huc4_df.to_crs(GEO_CRS)
ix = np.unique(tree.query(huc4_geo.geometry.values, predicate="intersects")[1])
df = df.take(ix).to_crs(CRS)

df = (
    dissolve(df.explode(ignore_index=True), by="SN_C")
    .drop(columns=["SN_C"])
    .explode(ignore_index=True)
    .reset_index(drop=True)
)
df.to_feather(out_dir / "environmental_justice_tracts.feather")

# process Tribal lands (all are considered disadvantaged)
df = read_dataframe(src_dir / "tl_2022_us_aiannh.shp", columns=[]).to_crs(CRS)
tree = shapely.STRtree(df.geometry.values)
ix = np.unique(tree.query(huc4_df.geometry.values, predicate="intersects")[1])
df = df.take(ix)

df["group"] = 1
df = (
    dissolve(df.explode(ignore_index=True), by="group")
    .drop(columns=["group"])
    .explode(ignore_index=True)
    .reset_index(drop=True)
)

df.to_feather(out_dir / "tribal_lands.feather")

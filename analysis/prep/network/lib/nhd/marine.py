import warnings

import numpy as np
import pandas as pd
import shapely
from pyogrio import read_dataframe

from analysis.lib.graph.speedups import DirectedGraph
from analysis.lib.geometry import explode, dissolve, make_valid
from analysis.prep.network.lib.nhd.util import get_column_names


warnings.filterwarnings("ignore", message=".*does not have any features to read.*")
warnings.filterwarnings("ignore", message=".*Warning 1: organizePolygons.*")


COLS = ["FType"]

# estuary
WB_FTYPES = [493]

# Sea/ocean, bay/inlent
# WARNING: sometimes bay/inlet is coded for parts of inland waterbodies
AREA_FTYPES = [445, 312]


def extract_marine(gdb, target_crs):
    """Extract areas from NHDWaterbody and NHDArea that are marine connected.

    Parameters
    ----------
    gdb : str
        path to the NHD HUC4 Geodatabase
    target_crs: GeoPandas CRS object
        target CRS to project NHD to for analysis, like length calculations.
        Must be a planar projection.

    Returns
    -------
    GeoDataFrame
    """

    print("Reading and dissolving marine areas...")

    layer = "NHDArea"
    read_cols, col_map = get_column_names(gdb, layer, COLS)
    ftype_col = col_map.get("FType", "FType")

    area = read_dataframe(
        gdb,
        layer=layer,
        columns=read_cols,
        force_2d=True,
        where=f"{ftype_col} in {tuple(AREA_FTYPES)}",
    ).rename(columns=col_map)

    layer = "NHDWaterbody"
    read_cols, col_map = get_column_names(gdb, layer, COLS)
    ftype_col = col_map.get("FType", "FType")

    wb = read_dataframe(
        gdb,
        layer=layer,
        columns=read_cols,
        force_2d=True,
        # more complex expression when list is size 1
        where=f"{ftype_col} in ({','.join([str(t) for t in WB_FTYPES])})",
    ).rename(columns=col_map)

    df = pd.concat([area, wb], ignore_index=True, sort=False)

    if not len(df):
        return df.to_crs(target_crs)

    df = explode(df).reset_index(drop=True)
    df["geometry"] = make_valid(df.geometry.values.data)
    df = explode(df)
    df = df.loc[shapely.get_type_id(df.geometry.values.data) == 3].reset_index(
        drop=True
    )

    if not len(df):
        return df.to_crs(target_crs)

    # mark those we know are marine
    df["marine"] = df.FType == 445

    # find all connected parts
    tree = shapely.STRtree(df.geometry.values.data)
    pairs = pd.DataFrame(
        tree.query_bulk(df.geometry.values.data, predicate="intersects").T,
        columns=["left", "right"],
    )
    g = DirectedGraph(
        pairs.left.values.astype("int64"), pairs.right.values.astype("int64")
    )

    groups = (
        pd.DataFrame(
            {i: g for i, g in enumerate(g.components())}.items(),
            columns=["group", "index"],
        )
        .explode("index")
        .astype("uint64")
        .set_index("index")
    )

    df = df.join(groups)
    marine_groups = df.loc[df.marine].group.unique()
    # mark any that have marine in their group
    df.loc[df.group.isin(marine_groups), "marine"] = True

    df = df.loc[df.marine]

    if len(df):
        df = (
            dissolve(df, by="marine")
            .explode(ignore_index=True)
            .drop(columns=["marine"])
        )

    return df.to_crs(target_crs)

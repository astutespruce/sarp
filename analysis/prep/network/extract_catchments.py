from pathlib import Path
from time import time
import warnings

from pyogrio import read_dataframe, write_dataframe

from analysis.constants import CRS
from analysis.lib.util import append
from analysis.prep.network.lib.nhd.util import get_column_names


warnings.filterwarnings("ignore", message=".*Warning 1: organizePolygons.*")

MAX_HUC4s = 5  # max number of HUC4s to include before considering a split
# For region 17:
# MAX_HUC4s = 3


def process_gdbs(src_dir):
    merged = None

    gdbs = sorted(
        [gdb for gdb in src_dir.glob(f"{huc2}*/*.gdb")],
        key=lambda p: p.parent.name,
    )

    if len(gdbs) == 0:
        raise ValueError(
            f"No GDBs available for {huc2} within {src_dir}; did you forget to unzip them?"
        )

    for gdb in gdbs:
        print(f"\n\n------------------- Reading {gdb.name} -------------------")

        layer = "NHDPlusCatchment"
        read_cols, col_map = get_column_names(gdb, layer, ["NHDPlusID"])

        df = read_dataframe(gdb, layer=layer, columns=read_cols).rename(columns=col_map)
        print(f"Read {len(df):,} catchments")

        missing = df.NHDPlusID.isnull().sum()
        if missing:
            df = df.dropna(subset=["NHDPlusID"])

            print(f"Kept {len(df):,} catchments after dropping those without NHDPlusID")

        df.NHDPlusID = df.NHDPlusID.astype("uint64")

        df = df.to_crs(CRS)
        merged = append(merged, df)

    df = merged

    # add uniqueID
    df["catchID"] = df.index.astype("uint32") + 1

    # add string version of NHDPlusID
    df["NHDIDSTR"] = df.NHDPlusID.astype("str")

    return df


data_dir = Path("data")
huc4_dir = data_dir / "nhd/source/huc4"
huc8_dir = data_dir / "nhd/source/huc8"
tmp_dir = Path("/tmp/sarp")  # only need GIS files to provide to SARP
tmp_dir.mkdir(exist_ok=True, parents=True)


start = time()

# manually subset keys from above for processing
huc2s = [
    # "02",
    # "03",
    "04",
    # "05",
    # "06",
    # "07",
    # "08",
    # "09",
    # "10",
    # "11",
    # "12",
    # "13",
    # "14",
    # "15",
    # "16",
    # "17",
    # "18",
    # "19",
    # "21",
]

for huc2 in huc2s:
    print(f"----- {huc2} ------")

    src_dir = huc8_dir if huc2 == "19" else huc4_dir
    df = process_gdbs(src_dir)

    print(f"serializing {len(df):,} catchments")

    # convert to types allowed by GDB
    df = df.astype({"NHDPlusID": "float64", "catchID": "int32"})
    write_dataframe(df, tmp_dir / f"region{huc2}_catchments.gdb", driver="OpenFileGDB")

    del df


print(f"Done in {time() - start:.2f}s\n============================")

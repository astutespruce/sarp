"""Extract out species information

1. Read in USFWS ECOS listing of T & E species, Trout (obtained by SARP), Salmonid ESU / DPS (obtained by SARP)
2. Add in species names based on taxonomic synonyms
3. Read in aggregated species / HUC12 info
4. Fix species name issues for select species
5. Assign ECOS T & E in addition to those already present from states

Beware: Some species have incorrect spellings!  Some have many variants of common name!

"""

from pathlib import Path
from time import time

import geopandas as gp
import numpy as np
import pandas as pd
from pyogrio import read_dataframe, list_layers
import shapely

from analysis.constants import SARP_STATES
from analysis.lib.util import append


SECAS_STATES = sorted(set(SARP_STATES + ["WV", "VI"]))

start = time()
data_dir = Path("data")
bnd_dir = data_dir / "boundaries"
src_dir = data_dir / "species/source"
out_dir = data_dir / "species/derived"

gdb = src_dir / "Results_Tables_2024.gdb"
prev_gdb = src_dir / "Species_Results_Tables_2023.gdb"
trout_layer = "Trout_Filter_2022"


states = gp.read_feather(bnd_dir / "states.feather")
huc12 = gp.read_feather(bnd_dir / "huc12.feather", columns=["HUC12", "geometry"]).set_index("HUC12")
secas_huc12 = huc12.take(
    np.unique(
        shapely.STRtree(huc12.geometry.values).query(
            states.loc[states.id.isin(SECAS_STATES)].geometry.values, predicate="intersects"
        )[1]
    )
)[[]]
huc12 = pd.DataFrame(huc12[[]])


salmonid_huc12 = pd.read_feather(
    src_dir / "salmonid_esu.feather",
    columns=["HUC12", "salmonid_esu", "salmonid_esu_count"],
).set_index("HUC12")

################################################################################
### Extract USFWS official listing information
################################################################################

print("Reading T&E species list")
listed_df = pd.read_csv(
    src_dir / "ECOS_listed_species_05_03_2024.csv",
    usecols=["Scientific Name", "Federal Listing Status", "Where Listed"],
).rename(columns={"Scientific Name": "SNAME", "Federal Listing Status": "status", "Where Listed": "location"})

# only keep T&E species that are listed across their entire range
listed_df = listed_df.loc[
    listed_df.status.isin(["Endangered", "Threatened"])
    & (
        # typo is in source data
        listed_df.location.isin(["Wherever found", "U.S. Only", "U.S.A., coterminous, (lower 48 states)"])
        # ignore exemptions for experimental populations
        | (
            listed_df.location.str.lower().str.contains("except")
            & listed_df.location.str.lower().str.contains("experimental")
        )
    )
]
listed_df["official_status"] = listed_df.status.map({"Endangered": "E", "Threatened": "T"})


# Manually add in species that have had a taxanomic change (that we tripped over, NOT comprehensive)
# Ignoring experimental population exemption here
# Some are listed at the subspecies level by USFWS but the taxonomy at that level is not yet accepted
missing_spps = pd.DataFrame(
    [
        ### Endangered species
        # Acipenser oxyrinchus is listed as endangered or threatened across multiple populations / subspecies but all are listed in some way
        ["Acipenser oxyrinchus", "E"],
        ["Acipenser oxyrinchus oxyrinchus", "e"],
        ["Arcidens wheeleri", "E"],
        ["Arcidens wheeleri", "E"],
        ["Epioblasma curtisii", "E"],
        ["Epioblasma torulosa", "E"],
        # listed as Gila seminuda (=robusta), but as Gila seminuda in occurrence data
        ["Gila seminuda", "E"],
        ["Hamiota subangulata", "E"],
        ["Margaritifera monodonta", "E"],
        ["Marstonia pachyta", "E"],
        # Rhinichthys cobitis is listed as Tiaroga cobitis
        ["Rhinichthys cobitis", "E"],
        # Pristis pectinata has multiple population listings but all are endangered
        ["Pristis pectinata", "E"],
        # Venustaconcha trabalis is listed as Villosa trabalis (ignoring experimental populations)
        ["Venustaconcha trabalis", "E"],
        ### Threatened species
        ["Acipenser oxyrinchus desotoi", "T"],
        ["Hamiota altilis", "T"],
        ["Hamiota perovalis", "T"],
        ["Quadrula cylindrica", "T"],
        ["Troglichthys rosae", "T"],
        # listed at subspecies level at least at threatened level
        ["Theliderma cylindrica", "T"],
    ],
    columns=["SNAME", "official_status"],
)

listed_df = pd.concat([listed_df[["SNAME", "official_status"]], missing_spps], ignore_index=True)

# Species with a T & E listing from states that are not updated
# because they are not listed by ECOS or NatureServe Explorer as being T & E:
# Crystallaria asprella, Etheostoma olmstedi, Fundulus jenkinsi, Notropis melanostomus, Pteronotropis welaka

# Others are under review and not listed yet according to USFWS:
# Pleurobema rubellum

federal_spp = listed_df.loc[listed_df.official_status.isin(["E", "T"])].SNAME.unique()


################################################################################
### Process trout data (not necessarily T/E/SGCN, just used for filtering)
################################################################################
# NOTE: this is from an older version for the East and is joined in with HUC12s
# already set as trout below
prev_trout_huc12 = read_dataframe(
    prev_gdb,
    layer=trout_layer,
    columns=["HUC12_Code", "Common_Name", "Historical"],
    where=""" "Common_Name" != 'Trout-perch'""",
    use_arrow=True,
    read_geometry=False,
).HUC12_Code.unique()

################################################################################
### Extract occurrence table from SARP
################################################################################

status_cols = ["federal", "sgcn", "regional", "trout"]

merged = None
for layer in list_layers(gdb)[:, 0]:
    print(f"Reading species occurrence data: {layer}")

    df = read_dataframe(gdb, layer=layer, use_arrow=True, read_geometry=False).rename(
        columns={
            "HUC12_Code": "HUC12",
            "Species_Name": "SNAME",
            "Common_Name": "CNAME",
            "Federal_Status": "federal",
            "SGCN_Listing": "sgcn",
            "Regional_SGCN": "regional",
            "Historical": "historical",
            "Trout": "trout",
        }
    )

    # fix data issues (have to do before merge or it has issues with blank columns)
    for col in df.columns:
        df[col] = df[col].fillna("").str.strip().str.replace("<Null>", "").str.replace("Unknown", "")

    # TEMPORARY: prefx huc12 codes that are not 0 prefixed to 12 chars
    ix = df.HUC12.apply(len) < 12
    df.loc[ix, "HUC12"] = "0" + df.loc[ix].HUC12

    df = df.loc[(df.HUC12 != "") & (df.SNAME != "")].copy()

    if "Aquatic" in df.columns:
        df = df.loc[df.Aquatic != "No"].copy()

    # Convert status cols to bool
    df["historical"] = df.historical == "Yes"
    for col in status_cols:
        df[col] = ~df[col].isin(["No", ""])

    # fix trout-perch (not a trout)
    df.loc[(df.SNAME == "Percopsis omiscomaycus") | (df.CNAME == "Trout-perch"), "trout"] = False

    df = df[["HUC12", "SNAME", "CNAME", "historical", "federal", "sgcn", "regional", "trout"]]

    merged = append(merged, df)

df = merged

# drop duplicates, keeping the highest status per species per HUC12
df = (
    df.sort_values(by=["HUC12", "SNAME", "CNAME"], ascending=[True, True, False])
    .groupby(["HUC12", "SNAME"])
    .agg({"CNAME": "first", "historical": "min", **{c: "max" for c in status_cols}})
    .reset_index()
)

# DEBUG: use this to show the species that have mixed listing status and we don't (yet) override
# for entry in sorted(
#     df.loc[df.SNAME.isin(df.loc[df.federal].SNAME.unique()) & ~df.federal & ~df.SNAME.isin(federal_spp)].SNAME.unique()
# ):
#     print(entry)

# Update federal status based on T&E list above (helps get past some taxonomic issues)
df.loc[~df.federal & df.SNAME.isin(federal_spp), "federal"] = True


### Export species presence per HUC12 - Kat @ SARP often needs this
spp_presence = df.loc[df.federal | df.sgcn | df.regional].drop(columns=["trout"]).copy()
cols = ["historical", "federal", "sgcn", "regional"]
spp_presence[cols] = spp_presence[cols].astype("uint8")
spp_presence.to_excel(out_dir / "spp_HUC12_presence.xlsx", index=False)


### Extract counts for SECAS: exclude any entries that are historical
huc12_counts_secas = (
    secas_huc12.join(df.loc[~df.historical].groupby("HUC12")[["federal", "sgcn", "regional"]].sum())
    .fillna(0)
    .astype("uint8")
    .reset_index()
)
huc12_counts_secas.to_excel(out_dir / "SECAS_spp_HUC12_count_no_historical.xlsx", index=False)

### Extract summaries by HUC12 including salmonid ESUs
df = huc12.join(df.groupby("HUC12")[status_cols].sum()).fillna(0).astype("uint8")
# Update trout status based on previous list
df.loc[(df.trout == 0) & df.index.isin(prev_trout_huc12), "trout"] = np.uint8(1)

df = df.join(salmonid_huc12)
df["salmonid_esu_count"] = df.salmonid_esu_count.fillna(0).astype("uint8")
df["salmonid_esu"] = df.salmonid_esu.fillna("")

# drop any huc12s that don't have useful data
df = df.loc[df[status_cols + ["salmonid_esu_count"]].max(axis=1) > 0].reset_index()
df["trout"] = (df.trout > 0).astype("uint8")

df.to_feather(out_dir / "spp_HUC12.feather")
df.to_excel(out_dir / "spp_HUC12_count.xlsx", index=False)


print("All done in {:.2f}s".format(time() - start))

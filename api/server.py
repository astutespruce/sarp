import os
from io import BytesIO
from zipfile import ZipFile
import time
from datetime import date
import pandas as pd
from feather import read_dataframe
from flask import Flask, abort, request, send_file, make_response, render_template
from flask_cors import CORS

from api.calculate_tiers import calculate_tiers, SCENARIOS
from api.domains import (
    RECON_DOMAIN,
    FEASIBILITY_DOMAIN,
    PURPOSE_DOMAIN,
    CONSTRUCTION_DOMAIN,
    CONDITION_DOMAIN,
)


app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})
log = app.logger

LAYERS = ("HUC6", "HUC8", "HUC12", "State", "County", "ECO3", "ECO4")
FORMATS = ("csv",)  # TODO: "shp"

FILTER_FIELDS = [
    "Feasibility",
    "HeightClass",
    "RareSppClass",
    "StreamOrderClass",
    "GainMilesClass",
    "LandcoverClass",
    "SizeClasses",
]

filterFieldMap = {f.lower(): f for f in FILTER_FIELDS}

EXPORT_COLUMNS = [
    "lat",
    "lon",
    # ID and source info
    "SARPID",
    "NIDID",
    "Source",
    # Basic info
    "Name",
    "County",
    "State",
    "Basin",
    # Species info
    "RareSpp",
    # River info
    "River",
    "StreamOrder",
    "NHDplusVersion",
    "HasNetwork",
    # Location info
    "ProtectedLand",
    "HUC6",
    "HUC8",
    "HUC12",
    "ECO3",
    "ECO4",
    # Dam info
    "Height",
    "Year",
    "Construction",
    "Purpose",
    "Condition",
    "Recon",
    "Feasibility",
    # Metrics
    "GainMiles",
    "UpstreamMiles",
    "DownstreamMiles",
    "TotalNetworkMiles",
    "Landcover",
    "Sinuosity",
    "SizeClasses",
    # Tiers
    "NC_tier",
    "WC_tier",
    "NCWC_tier",
    "SE_NC_tier",
    "SE_WC_tier",
    "SE_NCWC_tier",
    "State_NC_tier",
    "State_WC_tier",
    "State_NCWC_tier",
]


# Read source data into memory
dams = read_dataframe("data/derived/dams.feather").set_index(["id"])

dams_with_network = dams.loc[dams.HasNetwork]

print("Data loaded")


def validate_layer(layer):
    if not layer in LAYERS:
        abort(
            400,
            "layer is not valid: {0}; must be one of {1}".format(
                layer, ", ".join(LAYERS)
            ),
        )


def validate_format(format):
    if not format in FORMATS:
        abort(400, "format is not valid; must be one of {0}".format(", ".join(FORMATS)))


# TODO: log incoming request parameters
@app.route("/api/v1/dams/rank/<layer>")
def rank(layer="HUC8"):
    """Rank a subset of dams data.

    Query parameters:
    * id: list of ids
    * filters are defined using a lowercased version of column name and a comma-delimited list of values

    Parameters
    ----------
    layer : str (default: HUC8)
        Layer to use for subsetting by ID.  One of: HUC6, HUC8, HUC12, State, ... TBD
    """

    args = request.args

    validate_layer(layer)

    if layer == "County":
        layer = "COUNTYFIPS"

    ids = request.args.get("id", "").split(",")
    if not ids:
        abort(400, "id must be non-empty")

    filters = dams_with_network[layer].isin(ids)

    filterKeys = [a for a in request.args if not a == "id"]
    # TODO: make this more efficient
    for filter in filterKeys:
        # convert all incoming to integers
        values = [int(x) for x in request.args.get(filter).split(",")]
        filters = filters & dams_with_network[filterFieldMap[filter]].isin(values)

    df = dams_with_network.loc[filters].copy()
    nrows = len(df.index)

    log.info("selected {} dams".format(nrows))

    # TODO: return a 204 instead?
    if not nrows:
        abort(
            404,
            "no dams are contained in selected ids {0}:{1}".format(
                layer, ",".join(ids)
            ),
        )

    tiers_df = calculate_tiers(df, SCENARIOS)
    df = df[["lat", "lon"]].join(tiers_df)

    for col in tiers_df.columns:
        if col.endswith("_tier"):
            df[col] = df[col].astype("int8")
        elif col.endswith("_score"):
            # Convert to a 100% scale
            df[col] = (df[col] * 100).round().astype("uint16")

    resp = make_response(
        df.to_csv(index_label="id", header=[c.lower() for c in df.columns])
    )
    resp.headers["Content-Type"] = "text/csv"
    return resp


@app.route("/api/v1/dams/query/<layer>")
def query(layer="HUC8"):
    """Filter dams and return key properties for filtering.  ONLY for those with networks.

    Query parameters:
    * id: list of ids

    Parameters
    ----------
    layer : str (default: HUC8)
        Layer to use for subsetting by ID.  One of: HUC6, HUC8, HUC12, State, ... TBD
    """

    args = request.args

    validate_layer(layer)

    if layer == "County":
        layer = "COUNTYFIPS"

    ids = request.args.get("id", "").split(",")
    if not ids:
        abort(400, "id must be non-empty")

    # TODO: validate that rows were returned for these ids
    df = dams_with_network[dams[layer].isin(ids)][FILTER_FIELDS].copy()
    nrows = len(df.index)

    log.info("selected {} dams".format(nrows))

    resp = make_response(
        df.to_csv(index_label="id", header=[c.lower() for c in df.columns])
    )

    resp.headers["Content-Type"] = "text/csv"
    return resp


# TODO: log incoming request parameters
@app.route("/api/v1/dams/<format>/<layer>")
def download_dams(layer="HUC8", format="CSV"):
    """Download subset of dams data.

    Query parameters:
    * ids: list of ids
    * filters are defined using a lowercased version of column name and a comma-delimited list of values
    * include_unranked: bool

    Parameters
    ----------
    layer : str (default: HUC8)
        Layer to use for subsetting by ID.  One of: HUC6, HUC8, HUC12, State, ... TBD
            
    format : str (default: csv)
        Format for download.  One of: csv, shp
    """

    args = request.args

    validate_layer(layer)
    validate_format(format)

    if layer == "County":
        layer = "COUNTYFIPS"

    include_unranked = args.get("include_unranked", True)
    if include_unranked:
        df = dams
    else:
        df = dams_with_network

    ids = request.args.get("id", "").split(",")
    if not ids:
        abort(400, "id must be non-empty")

    filters = df[layer].isin(ids)
    filterKeys = [a for a in request.args if not a == "id"]
    for filter in filterKeys:
        # convert all incoming to integers
        values = [int(x) for x in request.args.get(filter).split(",")]
        filters = filters & df[filterFieldMap[filter]].isin(values)

    df = df.loc[filters].copy()
    nrows = len(df.index)

    log.info("selected {} dams".format(nrows))

    tiers_df = calculate_tiers(df, SCENARIOS)

    # TODO: join type is based on include_unranked
    join_type = "left" if include_unranked else "right"
    df = df.join(tiers_df, how=join_type)

    # Fill n/a with -1 for tiers and cast columns to integers
    df[tiers_df.columns] = df[tiers_df.columns].fillna(-1)

    # drop unneeded columns
    df = df[EXPORT_COLUMNS]

    # map domain fields to values
    df.HasNetwork = df.HasNetwork.map({True: "yes", False: "no"})
    df.ProtectedLand = df.ProtectedLand.map({1: "yes", 0: "no"})
    df.Condition = df.Condition.map(CONDITION_DOMAIN)
    df.Construction = df.Construction.map(CONSTRUCTION_DOMAIN)
    df.Purpose = df.Purpose.map(PURPOSE_DOMAIN)
    df.Recon = df.Recon.map(RECON_DOMAIN)
    df.Feasibility = df.Feasibility.map(FEASIBILITY_DOMAIN)

    filename = "aquatic_barrier_ranks_{0}.{1}".format(date.today().isoformat(), format)

    # create readme
    template_values = {
        "date": date.today(),
        "url": request.host_url,
        "filename": filename,
        "layer": layer,
        "ids": ", ".join(ids),
    }

    readme = render_template("dams_readme.txt", **template_values)
    # csv_bytes = BytesIO()
    # df.to_csv(csv_bytes)

    zf_bytes = BytesIO()
    with ZipFile(zf_bytes, "w") as zf:
        zf.writestr(filename, df.to_csv(index=False))
        zf.writestr("README.txt", readme)

    resp = make_response(zf_bytes.getvalue())
    resp.headers["Content-Disposition"] = "attachment; filename={0}".format(
        filename.replace(format, "zip")
    )
    resp.headers["Content-Type"] = "application/zip"
    return resp


if __name__ == "__main__":
    app.run(debug=True)

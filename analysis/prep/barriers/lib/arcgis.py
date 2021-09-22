from math import ceil

import requests
from requests import HTTPError
import pandas as pd
import geopandas as gp


# Mapping of ESRI WKID to proj4 strings
CRS_LUT = {
    # Same as EPSG:3857
    102100: "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs",
    # same as EPSG:102003
    'PROJCS["Albers",GEOGCS["GCS_North_American_1983",DATUM["D_North_American_1983",SPHEROID["GRS_1980",6378137.0,298.257222101]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Albers"],PARAMETER["false_easting",0.0],PARAMETER["false_northing",0.0],PARAMETER["central_meridian",-96.0],PARAMETER["standard_parallel_1",29.5],PARAMETER["standard_parallel_2",45.5],PARAMETER["latitude_of_origin",37.5],UNIT["Meter",1.0]]': "+proj=aea +lat_1=29.5 +lat_2=45.5 +lat_0=37.5 +lon_0=-96 +x_0=0 +y_0=0 +datum=NAD83 +units=m +no_defs",
    102003: "+proj=aea +lat_1=29.5 +lat_2=45.5 +lat_0=37.5 +lon_0=-96 +x_0=0 +y_0=0 +datum=NAD83 +units=m +no_defs",
    # same as EPSG:5070 (CONUS albers)
    'PROJCS["NAD_1983_Albers",GEOGCS["GCS_North_American_1983",DATUM["D_North_American_1983",SPHEROID["GRS_1980",6378137.0,298.257222101]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Albers"],PARAMETER["False_Easting",0.0],PARAMETER["False_Northing",0.0],PARAMETER["central_meridian",-96.0],PARAMETER["Standard_Parallel_1",29.5],PARAMETER["Standard_Parallel_2",45.5],PARAMETER["latitude_of_origin",23.0],UNIT["Meter",1.0]]': "+proj=aea +lat_1=29.5 +lat_2=45.5 +lat_0=23.0 +lon_0=-96 +x_0=0 +y_0=0 +datum=NAD83 +units=m +no_defs",
}


def get_json(url, params=None, token=None, **kwargs):
    """Make JSON request, wrapped in exception handling

    Parameters
    ----------
    url : str
    token: str (optional)

    Raises
    ------
    HTTPError
        Raises error when returned as error by service
    """

    if params is None:
        params = {}

    if "f" not in params:
        params["f"] = "json"

    response = requests.get(url, params={**params, "token": token}, **kwargs).json()
    if "error" in response:
        raise HTTPError(
            "Error making request: {}\n{}".format(
                response["error"]["message"], response["error"]["details"]
            )
        )

    return response


def list_services(url, token=None):
    """Given a root ArcGIS server / ArcGIS Online services endpoint, return the list of services.

    Parameters
    ----------
    url : str
        services endpoint
    token : str, optional
        token, if required to access secured services

    Returns
    -------
    list
        contains {'name': <>, 'type': <>, 'url': <>} for each service
    """

    return get_json(url, params={"f": "json", "token": token})["services"]


def download_fs(url, fields=None, token=None, target_wkid=None):
    """Download an ESRI FeatureService JSON to GeoDataFrame.

    Parameters
    ----------
    fs_data : dict
        Dict created from FeatureService JSON

    """

    # Get the total count we can query
    svc_info = get_json(url, token=token)
    # batch_size = max(svc_info["maxRecordCount"], svc_info["standardMaxRecordCount"])
    batch_size = svc_info["standardMaxRecordCount"]

    query = {"where": "1=1", "resultType": "standard", "outFields": "*", "f": "geojson"}

    if target_wkid:
        query["outSR"] = target_wkid

    # ArcGIS will return an error if you request fields that are not present, so we have to
    # make sure to request only those that are present
    if fields:
        fields_present = [f["name"] for f in svc_info["fields"]]
        request_fields = set(fields).intersection(fields_present)

        missing_fields = set(fields).difference(fields_present)
        if len(missing_fields):
            print(f"Requested fields are not present: {missing_fields}")

        query["outFields"] = ",".join(request_fields)

    # Get total count we expect
    count = get_json(
        f"{url}/query", params={"where": "1=1", "returnCountOnly": "true"}, token=token,
    )["count"]

    batches = ceil(count / batch_size)
    print(
        f"Downloading {count:,} records in {batches:,} requests of up to {batch_size:,} records"
    )

    # Download and merge data frames
    merged = None
    for offset in range(0, batches * batch_size, batch_size):
        query["resultOffset"] = offset
        features = get_json(f"{url}/query", params=query, token=token)

        df = gp.GeoDataFrame.from_features(features, crs="EPSG:4326")

        if merged is None:
            merged = df
        else:
            merged = merged.append(df, ignore_index=True, sort=False)

    return merged


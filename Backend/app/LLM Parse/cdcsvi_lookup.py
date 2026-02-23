import re
import os
import requests
import pandas as pd



SVI_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cdc_data", "svi_interactive_map.csv")
TRANSCRIPT_PATH = "transcripts/transcript.txt"

if not os.path.exists(SVI_PATH):
    raise FileNotFoundError(f"SVI file not found at: {SVI_PATH}")

svi_df = pd.read_csv(SVI_PATH)

required_cols = {"COUNTY", "STATE", "F_THEME1", "F_LIMENG", "F_CROWD", "F_NOVEH", "F_GROUPQ"}
missing = required_cols - set(svi_df.columns)
if missing:
    raise ValueError(f"SVI CSV missing required columns: {sorted(missing)}")

svi_df["COUNTY_NORM"] = (
    svi_df["COUNTY"]
    .astype(str)
    .str.strip()
    .str.lower()
    .str.replace(" county", "", regex=False)
)
svi_df["STATE_NORM"] = svi_df["STATE"].astype(str).str.strip().str.lower()


def extract_zip_from_text(text: str) -> str | None:
    m = re.search(r"\b\d{5}\b", text)
    return m.group(0) if m else None


def zip_to_latlon(zip_code: str) -> tuple[float, float] | None:
    """Free ZIP -> lat/lon via Zippopotam.us (no key)."""
    if not (zip_code and zip_code.isdigit() and len(zip_code) == 5):
        return None

    url = f"https://api.zippopotam.us/us/{zip_code}"
    try:
        r = requests.get(url, timeout=8)
        r.raise_for_status()
        data = r.json()
        place = data["places"][0]
        return float(place["latitude"]), float(place["longitude"])
    except (requests.RequestException, KeyError, ValueError):
        return None


def latlon_to_county_fcc(lat: float, lon: float) -> dict | None:
    """Free lat/lon -> county + state + (often) FIPS via FCC Area API."""
    url = "https://geo.fcc.gov/api/census/area"
    params = {"lat": lat, "lon": lon, "format": "json"}

    try:
        r = requests.get(url, params=params, timeout=8)
        r.raise_for_status()
        data = r.json()

        results = data.get("results")
        if isinstance(results, list):
            if not results:
                return None
            rec = results[0]
        elif isinstance(results, dict):
            rec = results
        else:
            print("Unexpected FCC response shape:", type(results), "data keys:", list(data.keys()))
            return None

        county_name = rec.get("county_name") or rec.get("countyName") or rec.get("county")
        state_name = rec.get("state_name") or rec.get("stateName")

        state_fips = rec.get("state_fips") or rec.get("stateCode") or rec.get("state_fips_code")
        county_fips = rec.get("county_fips") or rec.get("countyFIPS") or rec.get("fips")

        # Try to build 5-digit county GEOID (STCNTY)
        stcnty = None
        if isinstance(county_fips, str) and county_fips.isdigit() and len(county_fips) == 5:
            stcnty = county_fips
        elif isinstance(state_fips, str) and isinstance(county_fips, str):
            if state_fips.isdigit() and county_fips.isdigit() and len(state_fips) == 2 and len(county_fips) == 3:
                stcnty = state_fips + county_fips

        return {
            "latitude": lat,
            "longitude": lon,
            "county_name": county_name,
            "state_name": state_name,
            "state_fips": state_fips,
            "county_fips": county_fips,
            "stcnty": stcnty,
            "full_fcc_record": rec,
        }
    except (requests.RequestException, ValueError) as e:
        print("FCC request failed:", e)
        return None


def zip_to_county(zip_code: str) -> dict | None:
    latlon = zip_to_latlon(zip_code)
    if not latlon:
        return None

    lat, lon = latlon
    return {"zip": zip_code, **(latlon_to_county_fcc(lat, lon) or {})}


def get_info_from_cdcsvi(location: str) -> dict:
    """
    location format: "County, State"
    Example: "Osceola County, Florida" or "Osceola, Florida"
    Returns: F_THEME1, F_LIMENG, F_CROWD, F_NOVEH, F_GROUPQ
    """
    try:
        county, state = [x.strip().lower() for x in location.split(",")]
    except ValueError:
        return {"error": "Location must be formatted as 'County, State'"}

    county_norm = county.replace(" county", "").strip()
    state_norm = state.strip()

    match = svi_df[(svi_df["COUNTY_NORM"] == county_norm) & (svi_df["STATE_NORM"] == state_norm)]

    if match.empty:
        return {"error": f"County/State not found in CDC SVI dataset: {county_norm}, {state_norm}"}

    def _safe_int(val) -> int:
        try:
            return int(float(val))
        except (ValueError, TypeError):
            return 0

    row = match.iloc[0]
    return {
        "F_THEME1": _safe_int(row["F_THEME1"]),
        "F_LIMENG": _safe_int(row["F_LIMENG"]),
        "F_CROWD": _safe_int(row["F_CROWD"]),
        "F_NOVEH": _safe_int(row["F_NOVEH"]),
        "F_GROUPQ": _safe_int(row["F_GROUPQ"]),
    }

if __name__ == "__main__":
    if not os.path.exists(TRANSCRIPT_PATH):
        raise FileNotFoundError(f"Transcript file not found at: {TRANSCRIPT_PATH}")

    with open(TRANSCRIPT_PATH, "r", encoding="utf-8") as f:
        transcript = f.read()

    zip_code = extract_zip_from_text(transcript)
    if not zip_code:
        print("No ZIP found in transcript.")
        raise SystemExit(0)

    info = zip_to_county(zip_code)
    if not info or not info.get("county_name") or not info.get("state_name"):
        print("Could not resolve county/state from ZIP.")
        print("Resolved info:", info)
        raise SystemExit(0)

    location = f'{info["county_name"]}, {info["state_name"]}'
    svi_info = get_info_from_cdcsvi(location)

    with open("transcripts/svi.txt", "w", encoding="utf-8") as f:
        f.write(f"ZIP: {zip_code}\n")
        f.write(f"Location: {location}\n")
        f.write(f"SVI Info: {svi_info}\n")
    print("svi_info saved to transcripts/svi.txt")
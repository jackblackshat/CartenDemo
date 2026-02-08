import json
from datetime import datetime, timezone
import pandas as pd

def normalize_inrix_response(raw: dict, point: str,radius: int) -> pd.DataFrame:
    ts = datetime.now(timezone.utc).isoformat()
    blocks = raw.get("result", []) or []

    rows = []
    for b in blocks:
        for s in (b.get("segments") or []):
            rows.append({
                "ts": ts,
                "source": "inrix",
                "query_point": point,
                "radius_m": int(radius),
                "block_id": b.get("id"),
                "block_name": b.get("name"),
                "distance_m": b.get("distance"),
                "probability": b.get("probability"),
                "segment_id": s.get("id"),
                "is_open": s.get("isOpen"),
                "spaces_total": s.get("spacesTotal"),
                "raw_json": json.dumps(raw)
            })
     
    return pd.DataFrame(rows)

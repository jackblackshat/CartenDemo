"""Temporal feature extraction: cyclic encoding, holidays, time-of-day flags.

Features 1-16 in the feature matrix.
"""

from __future__ import annotations

import math
from datetime import datetime, date

# US federal holidays (fixed dates + observed rules)
_FEDERAL_HOLIDAYS_FIXED = {
    (1, 1),   # New Year's Day
    (6, 19),  # Juneteenth
    (7, 4),   # Independence Day
    (11, 11), # Veterans Day
    (12, 25), # Christmas
}

# Holidays on Nth weekday of month: (month, weekday, nth)
# weekday: 0=Mon
_FEDERAL_HOLIDAYS_FLOATING = [
    (1, 0, 3),   # MLK Day: 3rd Monday of January
    (2, 0, 3),   # Presidents Day: 3rd Monday of February
    (5, 0, -1),  # Memorial Day: last Monday of May
    (9, 0, 1),   # Labor Day: 1st Monday of September
    (10, 0, 2),  # Columbus Day: 2nd Monday of October
    (11, 3, 4),  # Thanksgiving: 4th Thursday of November
]


def _is_federal_holiday(d: date) -> bool:
    """Check if a date is a US federal holiday."""
    if (d.month, d.day) in _FEDERAL_HOLIDAYS_FIXED:
        return True
    for month, weekday, nth in _FEDERAL_HOLIDAYS_FLOATING:
        if d.month != month or d.weekday() != weekday:
            continue
        if nth == -1:
            # Last occurrence: check if adding 7 days would go to next month
            from calendar import monthrange
            _, days_in_month = monthrange(d.year, d.month)
            if d.day + 7 > days_in_month:
                return True
        else:
            # Nth occurrence: (day - 1) // 7 + 1 == nth
            if (d.day - 1) // 7 + 1 == nth:
                return True
    return False


def compute(spot: dict, timestamp: datetime) -> dict:
    """Compute temporal features for a spot at a given time.

    Args:
        spot: dict with spot data (not used for temporal features)
        timestamp: datetime to compute features for

    Returns:
        dict with feature names → values
    """
    hour = timestamp.hour + timestamp.minute / 60.0
    dow = timestamp.weekday()  # 0=Mon .. 6=Sun
    month = timestamp.month
    minutes = timestamp.hour * 60 + timestamp.minute

    is_weekend = dow >= 5
    is_weekday = not is_weekend

    return {
        # Cyclic encodings
        "hour_sin": math.sin(2 * math.pi * hour / 24),
        "hour_cos": math.cos(2 * math.pi * hour / 24),
        "dow_sin": math.sin(2 * math.pi * dow / 7),
        "dow_cos": math.cos(2 * math.pi * dow / 7),
        "month_sin": math.sin(2 * math.pi * month / 12),
        "month_cos": math.cos(2 * math.pi * month / 12),

        # Binary flags
        "is_weekend": int(is_weekend),
        "is_rush_hour": int(
            is_weekday and ((7 <= hour < 9) or (16 <= hour < 19))
        ),
        "is_lunch": int(11.5 <= hour < 13.5),
        "is_holiday": int(_is_federal_holiday(timestamp.date())),
        "minutes_since_midnight": minutes,
        "is_evening": int(18 <= hour < 23),
        "is_overnight": int(hour >= 23 or hour < 6),
        "is_metered_hours": int(
            is_weekday and 9 <= hour < 18
            or (dow == 5 and 9 <= hour < 18)  # Saturday
        ),
        "is_sweeping_day": 0,  # Overridden by sweeping.py if applicable
        "hour_of_week": dow * 24 + timestamp.hour,
    }


# Feature names for matrix construction
FEATURE_NAMES = [
    "hour_sin", "hour_cos", "dow_sin", "dow_cos", "month_sin", "month_cos",
    "is_weekend", "is_rush_hour", "is_lunch", "is_holiday",
    "minutes_since_midnight", "is_evening", "is_overnight", "is_metered_hours",
    "is_sweeping_day", "hour_of_week",
]

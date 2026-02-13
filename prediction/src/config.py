"""YAML config loader, paths, and constants."""

from __future__ import annotations

import os
import yaml
import logging
from pathlib import Path
from functools import lru_cache

logger = logging.getLogger(__name__)

_PROJECT_ROOT = Path(__file__).resolve().parent.parent

# Load .env file if present
_env_file = _PROJECT_ROOT / ".env"
if _env_file.exists():
    with open(_env_file) as _f:
        for _line in _f:
            _line = _line.strip()
            if _line and not _line.startswith("#") and "=" in _line:
                _key, _, _val = _line.partition("=")
                os.environ.setdefault(_key.strip(), _val.strip())


@lru_cache(maxsize=1)
def get_config() -> dict:
    """Load and cache config.yaml, expanding environment variables."""
    config_path = _PROJECT_ROOT / "config.yaml"
    with open(config_path) as f:
        raw = f.read()
    # Expand ${ENV_VAR} references
    for key, val in os.environ.items():
        raw = raw.replace(f"${{{key}}}", val)
    return yaml.safe_load(raw)


def db_path() -> Path:
    """Resolve the database path (relative to project root)."""
    cfg = get_config()
    rel = cfg["database"]["path"]
    return (_PROJECT_ROOT / rel).resolve()


def models_dir() -> Path:
    """Directory for saved model artifacts."""
    cfg = get_config()
    d = _PROJECT_ROOT / cfg["model"]["artifacts_dir"]
    d.mkdir(parents=True, exist_ok=True)
    return d


def neighborhoods() -> dict:
    """Return neighborhood definitions."""
    return get_config()["neighborhoods"]


def setup_logging():
    """Configure logging from config."""
    cfg = get_config()
    log_cfg = cfg.get("logging", {})
    logging.basicConfig(
        level=getattr(logging, log_cfg.get("level", "INFO")),
        format=log_cfg.get("format", "%(asctime)s [%(levelname)s] %(name)s: %(message)s"),
    )

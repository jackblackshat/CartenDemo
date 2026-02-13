"""Plugin registry for future data sources.

Provides a DataSourcePlugin interface that allows new data sources to be
registered and automatically discovered by the feature pipeline.
XGBoost handles missing values natively, so new sources work without full retrain.
"""

from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from datetime import datetime

logger = logging.getLogger(__name__)

# Global registry of data source plugins
_registry: dict[str, "DataSourcePlugin"] = {}


class DataSourcePlugin(ABC):
    """Base class for data source plugins.

    Subclass this to add a new data source. Implement `fetch()` and `features()`.
    Register with `register_plugin()`.
    """

    @property
    @abstractmethod
    def name(self) -> str:
        """Unique name for this data source."""
        ...

    @abstractmethod
    def fetch(self, neighborhood: str, timestamp: datetime) -> dict:
        """Fetch raw data for a neighborhood at a given time.

        Returns a dict of raw data values, or empty dict if unavailable.
        """
        ...

    @abstractmethod
    def features(self, spot: dict, timestamp: datetime) -> dict:
        """Compute features for a spot at a given time.

        Args:
            spot: dict with at least 'lat', 'lng'
            timestamp: prediction time

        Returns:
            dict of feature_name → value. Use float('nan') for missing values.
        """
        ...


def register_plugin(plugin: DataSourcePlugin):
    """Register a data source plugin."""
    if plugin.name in _registry:
        logger.warning("Plugin '%s' already registered — overwriting", plugin.name)
    _registry[plugin.name] = plugin
    logger.info("Registered data source plugin: %s", plugin.name)


def unregister_plugin(name: str):
    """Remove a registered plugin."""
    _registry.pop(name, None)


def get_plugin(name: str) -> DataSourcePlugin | None:
    """Get a registered plugin by name."""
    return _registry.get(name)


def list_plugins() -> list[str]:
    """List all registered plugin names."""
    return list(_registry.keys())


def compute_all_plugin_features(spot: dict, timestamp: datetime) -> dict:
    """Compute features from all registered plugins.

    Returns merged dict of all plugin features.
    Missing/failed plugins contribute NaN values.
    """
    features = {}
    for name, plugin in _registry.items():
        try:
            plugin_features = plugin.features(spot, timestamp)
            features.update(plugin_features)
        except Exception as e:
            logger.warning("Plugin '%s' feature computation failed: %s", name, e)
    return features

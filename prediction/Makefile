.PHONY: install ingest train evaluate serve test clean retrain

PYTHON ?= python3

install:
	pip install -r requirements.txt

ingest:
	$(PYTHON) -m src.data.ingest_meters

train:
	$(PYTHON) -m src.pipeline.build_training_data
	$(PYTHON) -m src.pipeline.train

evaluate:
	$(PYTHON) -m src.pipeline.evaluate

serve:
	$(PYTHON) -m uvicorn src.serving.app:app --host 0.0.0.0 --port 8000 --reload

test:
	$(PYTHON) -m pytest tests/ -v

retrain:
	$(PYTHON) -m src.pipeline.retrain

clean:
	rm -f models/*.joblib
	rm -f training_data.parquet

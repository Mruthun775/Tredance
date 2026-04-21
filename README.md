# Tredance Workspace

## Structure

- `frontend/` - Vite + React + TypeScript UI
- `backend/` - Python training/report scripts and generated artifacts
- `.venv/` - local Python virtual environment

## Run Frontend

From workspace root:

- `npm --prefix frontend install`
- `npm --prefix frontend run dev`

Frontend URL: `http://localhost:8080`

## Run Backend

From workspace root:

- `c:/Users/Mruthun/OneDrive/Documents/Tredance/.venv/Scripts/python.exe backend/self_pruning_nn.py`

Outputs are written to:

- `backend/outputs/`

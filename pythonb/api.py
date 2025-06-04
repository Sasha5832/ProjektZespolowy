# api.py  ──────────────────────────────────────────────────────────────
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from PIL import Image
from ultralytics import YOLO
import io

# ── 1. Ładujemy nowy model YOLO11-m tylko raz przy starcie ───────────
MODEL_PATH = "yolo11m.pt"          # plik .pt leży obok api.py
model = YOLO(MODEL_PATH)            # autoload + CPU domyślnie
model.fuse()                        # niewymagane, ale przyspiesza na CPU
CLASS_NAMES = model.names           # słownik {id: "label"}

# ── 2. Konfiguracja FastAPI + CORS (dla localhost i file://) ──────────
app = FastAPI(
    title="YOLO11 Traffic-Sign API",
    version="1.0",
    description="Endpoint do wykrywania znaków drogowych (YOLO11-m)"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*", "null"],     # file:///… -> origin: null
    allow_methods=["POST"],
    allow_headers=["*"],
)

# ── 3. Endpoint /predict ──────────────────────────────────────────────
@app.post("/predict", summary="Wykryj znaki drogowe")
async def predict(file: UploadFile = File(...)):
    # 3a. Walidacja typu
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=415, detail="Plik nie jest obrazem")

    # 3b. Wczytanie obrazu
    img_bytes = await file.read()
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")

    # 3c. Inference  (size=640, conf/iou dowolnie dostrajane)
    results = model(img, imgsz=640, conf=0.25, iou=0.45)[0]   # pierwszy obraz

    # 3d. Konwersja do listy słowników
    detections: List[dict] = []
    for box, conf, cls_id in zip(results.boxes.xyxy,    # tensor Nx4
                                 results.boxes.conf,    # pewność
                                 results.boxes.cls):    # id klasy
        xmin, ymin, xmax, ymax = map(int, box.tolist())
        detections.append({
            "label":      CLASS_NAMES[int(cls_id)],
            "confidence": round(float(conf), 3),
            "bbox":       [xmin, ymin, xmax, ymax]
        })

    return {"detections": detections}

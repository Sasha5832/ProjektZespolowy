# SmartRoadSigns

Web application that recognises Polish road signs on photos using a custom YOLO v11-m model.  
The user can upload up to ten images at once; the page shows bounding boxes around detected signs and lists their names with short descriptions.

---

## Key points

* Front-end: HTML 5, CSS 3, vanilla JavaScript  
* Back-end: FastAPI, Ultralytics 8.3, custom weight file `traffic_best.pt`  
* Works fully offline on CPU; optional CUDA if available  
* Responsive 2-column gallery, dark theme, live drawing of boxes on a `<canvas>`  
* ResizeObserver keeps boxes aligned even when the grid re-flows

---

## Folder layout

.
├─ backend/
│ ├─ api.py # FastAPI application
│ └─ models/traffic_best.pt # custom YOLO v11-m weights
├─ frontend/
│ ├─ index.html
│ ├─ style.css
│ └─ script.js
└─ requirements.txt


---

## Requirements

* Python 3.10 or newer  
* XAMPP (or any local Apache) for serving static files  
* The Ultralytics package (installed via `pip`)  
* A trained weight file `traffic_best.pt` based on YOLO v11-m

---

## Installation and first run

1. **Clone the repository and create a virtual environment**

   ```bash
   git clone https://github.com/<your-nick>/SmartRoadSigns.git
   cd SmartRoadSigns
   python -m venv .venv
   .\.venv\Scripts\activate          # on Windows
   pip install -r requirements.txt   # installs ultralytics, fastapi, uvicorn, pillow
Place your model

Copy the file traffic_best.pt to backend/models/traffic_best.pt.

Start Apache

Open XAMPP Control Panel and press Start next to Apache.
The static front-end will be available under http://localhost/.

Start the FastAPI server

From the repository root (while the virtual environment is active):

bash
Копировать
Редактировать
uvicorn backend.api:app --port 8000 --reload
Open the application

arduino
Копировать
Редактировать
http://localhost/frontend/index.html
Swagger UI for manual tests:
http://localhost:8000/docs

Usage
Press Wybierz obrazy and select up to ten photographs.

Press Rozpoznaj znaki na wszystkich.

Bounding boxes and labels appear on each thumbnail.

A button bar shows Obraz n (liczba znaków) – clicking reveals the list of detected signs with Polish descriptions.

Short technical notes
The back-end endpoint /predict accepts multipart/form-data with one image file and returns JSON:

json
Копировать
Редактировать
{
  "detections": [
    {
      "label": "A-7",
      "confidence": 0.92,
      "bbox": [xmin, ymin, xmax, ymax]
    }
  ]
}
Front-end scales every image to fit a two-column CSS Grid; ResizeObserver triggers re-drawing of boxes whenever an image changes size.

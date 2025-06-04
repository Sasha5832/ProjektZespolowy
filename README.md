# SmartRoadSigns

A web application that recognises Polish road signs on photographs with a custom **YOLO v11‑m** model. Users can upload up to ten images at once; the page draws bounding boxes around every detected sign and lists each sign name together with a short description.

---

## Main components

| Layer         | Technology                                                  |
| ------------- | ----------------------------------------------------------- |
| Front‑end     | HTML 5 · CSS 3 · vanilla JavaScript                         |
| Back‑end      | FastAPI · Ultralytics 8.3 · custom weight file `yolo11m.pt` |
| Static server | XAMPP (Apache) on Windows – any local HTTP server works     |

Works fully offline on CPU; CUDA is used automatically when available.

---

## Directory structure

```
.
├─ pythonb
│  ├─ api.py          # FastAPI application
│  └─ yolo11m.pt      # trained YOLO v11‑m weights
├─ index.html         # front‑end entry
├─ style.css          # dark theme + gallery layout
├─ script.js          # upload, fetch, drawing logic
└─ requirements.txt   # ultralytics, fastapi, uvicorn, pillow
```

---

## Installation and first run

1. **Clone the repository and create a virtual environment**

   ```bash
   git clone https://github.com/Sasha5832/ProjektZespolowy.git
   cd SmartRoadSigns
   python -m venv .venv
   .\.venv\Scripts\activate        # Windows
   pip install -r requirements.txt   # installs ultralytics, fastapi, uvicorn, pillow
   ```
2. **Start Apache (XAMPP)**
   Open *XAMPP Control Panel* and press **Start** next to **Apache**.
   Static files (`index.html`, `style.css`, `script.js`) are now served at `http://localhost/`.
3. **Start the FastAPI server**

   ```bash
   cd pythonb
   uvicorn api:app --port 8000 --reload
   ```
4. **Open the application**
   `http://localhost/index.html`

   Swagger for manual testing: `http://localhost:8000/docs`

---

## Usage

1. Click **Wybierz obrazy** and choose up to ten photographs.
2. Press **Rozpoznaj znaki na wszystkich**.
3. Bounding boxes and labels appear on each thumbnail.
4. The button bar shows *Obraz n (liczba znaków)*. Clicking a button displays detected sign names and Polish descriptions.

---

## API response format

```json
{
  "detections": [
    {
      "label": "A-7",
      "confidence": 0.92,
      "bbox": [xmin, ymin, xmax, ymax]
    }
  ]
}
```

---

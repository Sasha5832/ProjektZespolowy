<!-- ----------------------------------------------------------- -->
<!--  SmartRoadSigns – README                                    -->
<!-- ----------------------------------------------------------- -->

<p align="center">
  <img src="docs/assets/logo.svg" width="120" alt="logo">
</p>

<h1 align="center">SmartRoadSigns</h1>
<p align="center">
  Web app that detects Polish road signs on photos with a custom&nbsp;<strong>YOLO v11-m</strong> model.<br>
  Upload up to ten images &nbsp;→&nbsp; see bounding boxes, labels and short descriptions.
</p>

<p align="center">
  <img src="docs/assets/demo.gif" width="700" alt="demo">
</p>

---

## ✨  Features
| Front-end | Back-end |
|-----------|----------|
| Dark theme, animated gradient | FastAPI 0.111 |
| Responsive 2-column gallery | Ultralytics 8.3 + custom `traffic_best.pt` |
| Upload ≤ 10 files at once | `/predict` endpoint returns JSON (`label`, `bbox`, `confidence`) |
| Live canvas overlays | CORS open for localhost / `file://` |
| Result panel with label → description | `model.fuse()` for faster CPU inference |

---

## 🚀  Quick start

### 1. Clone & create virtual env
```bash
git clone https://github.com/your-nick/SmartRoadSigns.git
cd SmartRoadSigns
python -m venv .venv && .\.venv\Scripts\activate
pip install -r requirements.txt        # ultralytics, fastapi, uvicorn, pillow

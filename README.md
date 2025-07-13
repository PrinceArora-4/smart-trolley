# 🛒 Smart Trolley - Self Checkout System

> A computer vision–powered smart self-checkout system that combines **YOLOv11** for real-time product detection and **Flask web interface** for a seamless, interactive billing interface — designed to revolutionize the retail experience.

---

## 🚀 Features

* 📦 **Real-time Object Detection** using YOLOv11
* 🎥 **Live Camera Integration** for scanning products
* 🧠 **Dynamic Product Recognition** (from custom-trained dataset)
* 🧾 **Flask-based Web UI** for cart, checkout, and payment simulation
* 🔍 **Product Search** with Add-to-Cart and Quantity Control
* 🌙 **Dark/Light Theme Toggle** with Tailwind CSS
* 🔊 **Audio Feedback** and Toastr notifications
* 💳 **Simulated Payment Form** with validation & UX animations

---

## 🎯 Tech Stack

| Layer      | Technologies Used                                                               |
| ---------- | -----------------------------------------------------                           |
| Frontend   | HTML, CSS, TailwindCSS, JavaScript, jQuery, Toastr.js                           |
| Backend    | Python, Flask                                                                   |
| CV & ML    | YOLOv11 (Ultralytics), OpenCV                                                   |
| Deployment | GitHub Pages (Frontend), Flask Local Server                                     |
| Tools      | Git, GitHub, Github Pages (UI Hosting) VS Code, Roboflow (for Dataset)          |

---

## 📁 Folder Structure

```bash
SmartTrolley - Self Checkout/
├── backend/
│   ├── app.py               # Main Flask app
│   ├── detector.py          # YOLO detector logic
│   └── products.json        # Product catalog with metadata
├── frontend/
│   ├── static/              # JS, CSS, audio files
│   └── templates/           # index.html, checkout.html
├── yolo/                    # YOLO training & inference scripts
├── .gitignore
├── requirements.txt
└── README.md
```

---

## 🌐 Live Demo & Hosted UI

* **🔗 GitHub Pages (Live UI):**

  * [🛒 Index (Cart Page)](https://princearora-4.github.io/smart-trolley/index.html)
  * [💳 Checkout Page](https://princearora-4.github.io/smart-trolley/checkout.html)

* 🎥 **Demo Video:** *\[Will be added after LinkedIn post is live — stay tuned!]*

---

## 🔧 Installation Guide/Run Locally

### 1. Clone the Repository

```bash
git clone https://github.com/princearora-4/smart-trolley.git
cd smart-trolley
```

### 2. Setup Virtual Environment (Optional but Recommended)

```bash
python -m venv venv
venv\Scripts\activate # On Windows
source venv/bin/activate # On Unix/Mac
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Run Flask Server

```bash
cd backend
python app.py
```

Visit: `http://127.0.0.1:5000/` in any of your browser.

---

## 📜 Requirements

Contents of `requirements.txt`:

```
flask
opencv-python
ultralytics
numpy
scikit-image
psutil
matplotlib
torch
tqdm
PyYAML
filterpy
lap
requests
scipy
```

---

## 🧠 Object Detection & Dataset

* Built with **YOLOv11** (via [Ultralytics](https://github.com/ultralytics/ultralytics))
* Custom dataset containing grocery items (Maggi, Amul Darkchocolate, Balaji Wafers, etc.)
* Annotated using Roboflow and trained using YOLO format
* best.pt weights used in `detector.py` for live detection via OpenCV

> 📂 **Dataset:** [Download Dataset (Google Drive)](https://drive.google.com/file/d/139kurgIy3QPW2zWzgIjG6AFn-lD3CGkJ/view?usp=sharing)

---

## 📌 Core Functional Files

| File            | Description                                        |
| --------------- | -------------------------------------------------- |
| `app.py`        | Main backend Flask app                             |
| `detector.py`   | Loads YOLO model and performs real-time detection  |
| `products.json` | Product metadata (name, price, description, audio) |
| `index.html`    | Shopping cart UI with camera feed and detection    |
| `checkout.html` | Billing and payment UI with form validation        |
| `script.js`     | Handles cart state, AJAX calls, search & UI events |

---

## 🚀 Deployment Strategy

* ✅ **Frontend** hosted using GitHub Pages via `frontend-pages` branch
* ⚙️ **Backend** served locally via Flask
* 🧩 Future Scope: Dockerize app, deploy via Vercel, Railway, or Render

---

## 🏆 Highlights

* ✅ Fully functional, solo-developed project
* 🎯 Combines Computer Vision, Web Development, and UX seamlessly
* 🧪 End-to-end tested and hosted using modern DevOps workflows

---

## 📬 Contact

> **Prince Arora**
> 🌐 [LinkedIn](https://www.linkedin.com/in/princearora4)
> 🔗 [GitHub](https://github.com/princearora-4)
> 📧 [princeharora4@gmail.com](mailto:princeharora4@gmail.com)

---

## 📄 License

This project is licensed under the **MIT License**.

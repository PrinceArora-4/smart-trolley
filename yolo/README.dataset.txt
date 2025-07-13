Smart Trolley - with Low Brightness, Augmentation & Blur
=====================================================

This dataset contains 10,135 product images prepared for training an object detection model for the Smart Trolley project.

Label Format:
- Originally annotated in COCO format
- Converted to YOLO format using the `coco_to_yolo.py` script included in this project

Structure:
- `train/` — Training images and YOLO labels
- `val/` — Validation images and YOLO labels
- `test/` — Testing images and YOLO labels

Image Preprocessing:
- Auto-orientation applied (EXIF strip)
- Resized to 640x640 pixels

Augmentations:
- Random Gaussian blur (0–1.5px)
- Brightness variation to simulate low-light retail environments

This dataset is intended for product detection tasks in retail/trolley scenarios.

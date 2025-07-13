Smart Trolley - with Low Brightness, Augmentation & Blur
=======================================

Dataset Annotation & Export Information
This dataset was annotated and exported using the Roboflow platform.

Export Settings:
- Format: COCO JSON
- Image Size: 640x640
- Augmentations Applied:
  - Gaussian Blur (0–1.5px)
  - Low Brightness Adjustments

After export, the dataset was converted from COCO format to YOLO format using the `coco_to_yolo.py` script included in this repository.

The YOLO-formatted dataset is used for training and inference with YOLOv5/YOLOv8 models.

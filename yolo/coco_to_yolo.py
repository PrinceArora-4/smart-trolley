import json
import os
from tqdm import tqdm # type: ignore

# 🔹 Paths (Update these if needed)
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
COCO_JSON_PATH = os.path.join(project_root, 'SmartCart - Custom Dataset', 'annotations.coco.json')
IMAGES_DIR = os.path.join(project_root, 'SmartCart - Custom Dataset', 'images')
YOLO_LABELS_DIR = os.path.join(project_root, 'SmartCart - Custom Dataset', 'labels')

# ✅ Create YOLO labels folder if it doesn’t exist
os.makedirs(YOLO_LABELS_DIR, exist_ok=True)

# 🔹 Load COCO JSON
with open(COCO_JSON_PATH, "r", encoding="utf-8") as f:
    coco_data = json.load(f)

# 🔹 Map category IDs to YOLO class indices
category_map = {cat["id"]: i for i, cat in enumerate(coco_data["categories"])}

# 🔹 Convert COCO Annotations to YOLO Format
for annotation in tqdm(coco_data["annotations"], desc="Converting COCO to YOLO"):
    image_id = annotation["image_id"]
    category_id = annotation["category_id"]
    bbox = annotation["bbox"]  # COCO format: [x, y, width, height]

    # Find corresponding image filename
    image_info = next(img for img in coco_data["images"] if img["id"] == image_id)
    image_filename = image_info["file_name"]
    image_width, image_height = image_info["width"], image_info["height"]

    # Convert COCO bbox format → YOLO format
    x, y, w, h = bbox
    x_center = (x + w / 2) / image_width
    y_center = (y + h / 2) / image_height
    w /= image_width
    h /= image_height

    # YOLO Label Format: <class_id> <x_center> <y_center> <width> <height>
    yolo_label = f"{category_map[category_id]} {x_center} {y_center} {w} {h}\n"

    # Save label file (one .txt per image)
    label_filename = os.path.join(YOLO_LABELS_DIR, image_filename.replace(".jpg", ".txt"))
    with open(label_filename, "a") as label_file:
        label_file.write(yolo_label)

print("✅ COCO to YOLO conversion completed! YOLO labels saved in:", YOLO_LABELS_DIR)

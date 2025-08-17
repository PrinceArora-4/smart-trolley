import cv2
import numpy as np
import json
import time
import os
from ultralytics import YOLO
from sort.sort import Sort

project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
model_path = os.path.join(project_root, 'yolo', 'best.pt')
# Load YOLO model and SORT tracker
model = YOLO(model_path)
tracker = Sort(max_age=20, min_hits=3, iou_threshold=0.3)

products_path = os.path.join(project_root, 'backend', 'products.json')
# Load product details from products.json
with open(products_path, "r") as f:
    product_data = json.load(f)

# Store tracked items and currently seen frame IDs
tracked_items = {}
frame_item_ids = set()

def process_frame(frame):
    global tracked_items, frame_item_ids
    frame_item_ids.clear()

    # Run YOLO prediction
    results = model.predict(frame, conf=0.5)[0]
    detections = []

    # Extract bounding boxes and scores
    for r in results.boxes.data.tolist():
        x1, y1, x2, y2, score, class_id = r
        detections.append([x1, y1, x2, y2, score])

    # Apply object tracking
    tracked_objects = tracker.update(np.array(detections))

    enhanced_items = []

    for i, (x1, y1, x2, y2, obj_id) in enumerate(tracked_objects):
        center_x = int((x1 + x2) / 2)
        center_y = int((y1 + y2) / 2)

        if i < len(results.boxes.cls):
            class_id = int(results.boxes.cls[i].item())
            class_name = results.names[class_id]
        else:
            continue  # In case tracking count mismatch

        frame_item_ids.add(obj_id)

        # Add new product if not already tracked
        if obj_id not in tracked_items:
            tracked_items[obj_id] = {
                "name": class_name.lower(),
                "time": time.time()
            }

        item_info = {
            "id": int(obj_id),
            "name": class_name.lower(),
            "bbox": [int(x1), int(y1), int(x2), int(y2)],
            "confidence": round(float(detections[i][4]), 2),
            "timestamp": tracked_items[obj_id]["time"]
        }
        enhanced_items.append(item_info)

    # Remove products that are no longer tracked
    for tid in list(tracked_items.keys()):
        if tid not in frame_item_ids:
            del tracked_items[tid]

    return enhanced_items

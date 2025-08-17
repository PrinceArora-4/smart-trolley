import os
import json
import cv2

# Path to COCO annotation file and images
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
coco_annotation_path = os.path.join(project_root, 'SmartCart - Custom Dataset', 'annotations.coco.json')
image_folder = os.path.join(project_root, 'SmartCart - Custom Dataset', 'images')

# Load COCO annotations
with open(coco_annotation_path, "r") as f:
    coco_data = json.load(f)

# Map category IDs to class names
category_mapping = {cat["id"]: cat["name"] for cat in coco_data["categories"]}

# Map image IDs to file names
image_id_to_filename = {img["id"]: img["file_name"] for img in coco_data["images"]}

# Draw bounding boxes on images
def draw_coco_boxes(image_path, annotations):
    image = cv2.imread(image_path)
    if image is None:
        print(f"Error loading {image_path}")
        return

    for ann in annotations:
        x, y, w, h = map(int, ann["bbox"])
        class_id = ann["category_id"]
        class_name = category_mapping.get(class_id, "Unknown")

        # Draw bounding box
        color = (255, 0, 0)  # Green
        cv2.rectangle(image, (x, y), (x + w, y + h), color, 2)

        # Draw label
        cv2.putText(image, class_name, (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

    cv2.imshow("COCO Bounding Boxes", image)
    cv2.waitKey(0)
    cv2.destroyAllWindows()

# Process each image
for img_id, img_filename in image_id_to_filename.items():
    img_path = os.path.join(image_folder, img_filename)
    
    # Get annotations for the current image
    img_annotations = [ann for ann in coco_data["annotations"] if ann["image_id"] == img_id]

    if img_annotations:
        draw_coco_boxes(img_path, img_annotations)
    else:
        print(f"No annotations found for {img_filename}")

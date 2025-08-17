import json
import os

# Update paths to your COCO annotation files
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
TRAIN_ANNOTATION_FILE = os.path.join(project_root, 'SmartCart - Custom Dataset', 'train', 'annotations.coco.json')
VALID_ANNOTATION_FILE = os.path.join(project_root, 'SmartCart - Custom Dataset', 'val', 'annotations.coco.json')
TEST_ANNOTATION_FILE = os.path.join(project_root, 'SmartCart - Custom Dataset', 'test', 'annotations.coco.json')

# Load all annotation files
def load_coco_json(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)

train_data = load_coco_json(TRAIN_ANNOTATION_FILE)
valid_data = load_coco_json(VALID_ANNOTATION_FILE)
test_data = load_coco_json(TEST_ANNOTATION_FILE)

# Extract class names from all three files
def extract_classes(coco_data):
    return {cat["id"]: cat["name"] for cat in coco_data["categories"]}

train_classes = extract_classes(train_data)
valid_classes = extract_classes(valid_data)
test_classes = extract_classes(test_data)

# Merge all classes
all_classes = {**train_classes, **valid_classes, **test_classes}  # Merging dictionaries

# Print the results
print(f"✅ Total Number of Classes: {len(all_classes)}")
print("📌 Class Names: ", list(all_classes.values()))

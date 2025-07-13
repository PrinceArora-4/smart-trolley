from ultralytics import YOLO
import cv2
import glob
import os
import random

# Load the trained YOLO model
model = YOLO(r"yolo\best.pt")

# Get all test images
image_paths = glob.glob(os.path.join("test", "images", "*.jpg"))  # Modify if images have different extensions

if not image_paths:
    print("❌ No Test Images Found!")
    exit()

# Define a fixed output directory
output_dir = os.path.join("runs", "detect", "predict")
os.makedirs(output_dir, exist_ok=True)

for image_path in image_paths:
    # Run inference on the selected image
    result = model.predict(source=image_path, save=True, conf=0.5, line_width=2, save_txt=True, project="runs/detect", name="predict", exist_ok=True)
    
    output_image_path = os.path.join(output_dir, os.path.basename(image_path))
    
    if not os.path.exists(output_image_path):
        print(f"⚠️ Could Not Find Processed Image: {output_image_path}")
        continue
    
    image = cv2.imread(output_image_path)
    if image is None:
        print(f"⚠️ Could Not Load Image: {output_image_path}")
        continue

    cv2.imshow("YOLO Inference Results", image)
    key = cv2.waitKey(0) & 0xFF  # Wait for key press
    
    if key == ord('e'):  # Press 'E' to exit
        break

cv2.destroyAllWindows()
print("✅ Inference Complete. Check The Output In 'runs/detect/predict'")





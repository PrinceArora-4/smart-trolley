from ultralytics import YOLO
import cv2
import os
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
model_path = os.path.join(project_root, 'yolo', 'best.pt')

# Load the trained YOLO model
model = YOLO(model_path)

# Function to run inference on a single image
def run_inference(image_path):
    if not os.path.exists(image_path):
        print("❌ Image Not Found!")
        return
    
    # Define a fixed output directory
    output_dir = os.path.join("runs", "detect", "predict1")
    os.makedirs(output_dir, exist_ok=True)

    # Run inference
    result = model.predict(source=image_path, save=True, conf=0.5, line_width=2, save_txt=True, project="runs/detect", name="predict1", exist_ok=True)
    
    output_image_path = os.path.join(output_dir, os.path.basename(image_path))
    
    if not os.path.exists(output_image_path):
        print(f"⚠️ Could Not Find Processed Image: {output_image_path}")
        return
    
    image = cv2.imread(output_image_path)
    if image is None:
        print(f"⚠️ Could Not Load Image: {output_image_path}")
        return

    # Resize the window to fit the original image dimensions
    cv2.namedWindow("YOLO Inference Results")#cv2.WINDOW_NORMAL)
    cv2.imshow("YOLO Inference Results", image)
    cv2.waitKey(0)
    cv2.destroyAllWindows()

    print("✅ Inference Complete. Check The Output In 'runs/detect/predict'")

# Example usage:
image_path = "Maggi.jpg"  
run_inference(image_path)
from ultralytics import YOLO
import torch
import os

if __name__=="__main__":
    # Check if Intel XPU is available
    device = "xpu" if torch.xpu.is_available() else "cpu"
    print(f"Using Device: {device}")
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    data_path = os.path.join(project_root, 'yolo', 'data.yaml')
    # Load YOLO model
    model = YOLO(os.path.join(project_root, 'yolo', 'yolo11n.pt'))

    # Train the model with GPU acceleration
    model.train(
        data= data_path,  # Update dataset path in data.yaml
        epochs=20,
        imgsz=640,
        device=device  # Force training on Intel XPU
    )
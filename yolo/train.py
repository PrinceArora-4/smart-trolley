from ultralytics import YOLO
import torch

if __name__=="__main__":
    # Check if Intel XPU is available
    device = "xpu" if torch.xpu.is_available() else "cpu"
    print(f"Using Device: {device}")
    # Load YOLO model
    model = YOLO("yolo11n.pt")  

    # Train the model with GPU acceleration
    model.train(
        data= r"yolo\data.yaml",  # Update dataset path in data.yaml
        epochs=20,
        imgsz=640,
        device=device  # Force training on Intel XPU
    )
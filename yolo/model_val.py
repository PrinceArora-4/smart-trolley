from ultralytics import YOLO
import os
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
model_path = os.path.join(project_root, 'yolo', 'best.pt')
data_path = os.path.join(project_root, 'yolo', 'data.yaml')
model = YOLO(model_path)
metrics = model.val(data=data_path)
print(metrics)

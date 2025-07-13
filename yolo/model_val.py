from ultralytics import YOLO
model = YOLO(r"yolo\best.pt") 
metrics = model.val(data=r"yolo\data.yaml") #Update dataset path in data.yaml
print(metrics)

from ultralytics import YOLO
import cv2
import time
import os

# Load the trained YOLO model
model = YOLO(r"yolo\best.pt")

# Create a directory to save snapshots
os.makedirs("snapshots", exist_ok=True)

# Initialize webcam (0 = default camera)
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("❌ Could Not Open Webcam.")
    exit()

print("✅ Press 'q' To Quit | 's' To Save A Snapshot")

while True:
    start_time = time.time()
    ret, frame = cap.read()
    if not ret:
        print("❌ Failed To Grab Frame.")
        break

    # Perform detection
    results = model.predict(source=frame, conf=0.5, show=False, verbose=False)

    # Annotate frame with results
    annotated_frame = results[0].plot()

    # Calculate and display FPS
    fps = 1 / (time.time() - start_time)
    cv2.putText(annotated_frame, f'FPS: {fps:.2f}', (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

    # Show the annotated frame
    cv2.imshow("Real-Time Detection", annotated_frame)

    key = cv2.waitKey(1) & 0xFF

    if key == ord('q'):
        break

    elif key == ord('s'):
        timestamp = time.strftime("%Y%m%d-%H%M%S")
        snapshot_path = f"snapshots/detection_{timestamp}.jpg"
        cv2.imwrite(snapshot_path, annotated_frame)
        print(f"📸 Snapshot Saved At {snapshot_path}")

cap.release()
cv2.destroyAllWindows()

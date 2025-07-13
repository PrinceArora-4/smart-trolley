from flask import Flask, Response, render_template, jsonify, request
import cv2
import numpy as np
from ultralytics import YOLO
import json
import time
import re
import threading
import os
try:
    import psutil
    CPU_MONITORING = True
except ImportError:
    CPU_MONITORING = False
    print("psutil not installed, CPU monitoring disabled")

template_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend/templates"))
static_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend/static"))
app = Flask(__name__, template_folder=template_dir, static_folder=static_dir)


# Load YOLOv11 model
try:
    model_path = r"C:\Users\91971\OneDrive - Navrachana University\Desktop\TechStack\Projects\SmartTrolley - Self Checkout\yolo\best.pt"
    print(f"Attempting To Load Model From: {model_path}")
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"YOLO Model Not Found At {model_path}")
    model = YOLO(model_path)
    print("YOLO Model Loaded successfully")
except Exception as e:
    print(f"Error Loading YOLO Model: {e}")
    raise

# Load products.json
try:
    base_dir = os.path.dirname(os.path.abspath(__file__))
    products_path = os.path.join(base_dir, "products.json")
    with open(products_path, "r") as f:
        products = json.load(f)
except Exception as e:
    print(f"Error Loading products.json: {e}")
    raise

# Cart state
cart = []
# Prompt queue for duplicate detections
prompt_queue = []

# Webcam capture
camera = None
def init_camera(max_retries=3, retry_delay=0.3):
    global camera
    for attempt in range(max_retries):
        try:
            if camera is not None:
                camera.release()
            camera = cv2.VideoCapture(0)  # Only try index 0
            if camera.isOpened():
                print(f"Camera Initialized successfully On Index 0, Attempt {attempt + 1}")
                return True
            raise Exception("Webcam Not Accessible")
        except Exception as e:
            print(f"Error Initializing Webcam (Attempt {attempt + 1}/{max_retries}): {e}")
            if attempt < max_retries - 1:
                time.sleep(retry_delay)
    print("Failed To Initialize Webcam After All Retries")
    camera = None
    return False

# Initialize camera on startup
init_camera()

# Camera control
camera_active = False
frame_buffer = None
buffer_lock = threading.Lock()
last_detection_time = 0
debounce_interval = 5  # seconds
frame_count = 0
frame_skip = 3  # Process every 3rd frame
processing_thread = None

# Mapping of YOLO class name prefixes to products.json keys
class_to_product_map = {
    "amul_darkchocolate": "Amul Darkchocolate",
    "balaji_aloo_sev": "Balaji Aloo Sev",
    "balaji_ratlami_sev": "Balaji Ratlami Sev",
    "balaji_wafers_chaatchaska": "Balaji Wafers Chaat Chaska",
    "balaji_wafers_masalamasti": "Balaji Wafers Masala Masti",
    "balaji_wafers_simplysalted": "Balaji Wafers Simply Salted",
    "balaji_wafers_tomatotwist": "Balaji Wafers Tomato Twist",
    "britannia_marie_gold": "Britannia Marie Gold",
    "cadbury_celebrations": "Cadbury Celebrations",
    "closeup": "Closeup",
    "colgate_strong_teeth": "Colgate Strong Teeth",
    "dark_fantasy_choco_fills": "Dark Fantasy Choco Fills",
    "dove_shampoo": "Dove Shampoo",
    "dove_soap": "Dove Soap",
    "everest_chaat_masala": "Everest Chaat Masala",
    "everest_garam_masala": "Everest Garam Masala",
    "head_and_shoulders": "Head & Shoulders Shampoo",
    "krack_jack": "Krack Jack",
    "lakme_peach_moisturiser": "Lakme Peach Moisturiser",
    "lifebuoy": "Lifebuoy",
    "liril_bodywash": "Liril Bodywash",
    "lux": "Lux",
    "maggi": "Maggi Noodles",
    "nescafe_coffee": "Nescafe Coffee",
    "patanjali_aloevera_gel": "Patanjali Aloevera Gel",
    "pears": "Pears Soap",
    "real_grape_juice": "Real Grape Fruit Juice",
    "rin_soap": "Rin Soap",
    "shreeji_dabeli_masala": "Shreeji Dabeli Masala",
    "shreeji_undhiyu_masala": "Shreeji Undhiyu Masala",
    "surf_excel": "Surf Excel",
    "tata_salt": "Tata Salt",
    "tresemme_black": "Tresemme Black Shampoo",
    "vaseline_aloe_fresh": "Vaseline Aloe Fresh",
    "veg_hakka_noodles": "Veg Hakka Noodles",
    "vicco_vajradanti": "Vicco Vajradanti",
    "vim_bar": "Vim Bar"
}

# Normalize YOLO class names to match products.json keys
def normalize_class_name(class_name):
    if class_name == "products":
        return None
    name = re.sub(r'(_back|_front|_side|_cross|_[\d.]+[gmglk]+|_[\d]+rs).*', '', class_name)
    for prefix, product_name in class_to_product_map.items():
        if name.startswith(prefix):
            if product_name in products:
                return product_name
    print(f"Misidentified Product: {class_name} (Not In products.json)")
    return None

def process_frame(frame):
    global frame_buffer, buffer_lock
    try:
        if frame is None or frame.size == 0:
            print("Invalid frame, skipping YOLO processing")
            return
        start_time = time.time()
        results = model(frame, conf=0.5, imgsz=512, batch=1, verbose=False)
        if CPU_MONITORING:
            cpu_percent = psutil.cpu_percent()
            print(f"CPU usage during inference: {cpu_percent}%")
        with buffer_lock:
            frame_buffer = (results, frame)
        detections = [(r.names[int(box.cls)], float(box.conf)) for r in results for box in r.boxes]
        print(f"YOLO results: {detections if detections else 'No detections'}, inference time: {time.time() - start_time:.2f}s")
    except Exception as e:
        print(f"YOLO inference error: {e}")
        with buffer_lock:
            frame_buffer = (None, frame)

def generate_frames():
    global camera_active, frame_buffer, camera, last_detection_time, frame_count, processing_thread
    last_detected = {}
    no_detection_start = None
    start_time = time.time()
    target_fps = 4  # Limit to 4 FPS
    frame_interval = 1.0 / target_fps

    while True:
        if not camera_active or not camera or not camera.isOpened():
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + b'' + b'\r\n')
            time.sleep(0.1)
            continue

        # Timeout check
        if time.time() - start_time > 30:
            print("Frame generation timeout, stopping")
            camera_active = False
            if camera:
                camera.release()
                camera = None
            break

        frame_start = time.time()
        try:
            success, frame = camera.read()
            if not success or frame is None:
                print("Failed to read frame from webcam. Attempting to reinitialize...")
                if init_camera():
                    continue
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + b'' + b'\r\n')
                continue
        except Exception as e:
            print(f"Camera read error: {e}")
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + b'' + b'\r\n')
            continue

        frame_count += 1
        if frame_count % frame_skip == 0:
            if processing_thread is None or not processing_thread.is_alive():
                processing_thread = threading.Thread(target=process_frame, args=(frame,))
                processing_thread.start()
            else:
                print("Previous processing thread still running, skipping inference")

        with buffer_lock:
            if frame_buffer is None:
                ret, buffer = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
                if not ret:
                    print("Failed to encode frame")
                    continue
                frame = buffer.tobytes()
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
                continue
            results, processed_frame = frame_buffer

        if results is None:
            ret, buffer = cv2.imencode('.jpg', processed_frame, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
            if not ret:
                print("Failed to encode frame")
                continue
            frame = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
            continue

        detected = False
        current_time = time.time()
        if current_time - last_detection_time < debounce_interval:
            ret, buffer = cv2.imencode('.jpg', processed_frame, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
            if not ret:
                print("Failed to encode frame")
                continue
            frame = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
            continue

        for r in results:
            boxes = r.boxes
            for box in boxes:
                cls_name = r.names[int(box.cls)]
                conf = float(box.conf)
                product_name = normalize_class_name(cls_name)
                if not product_name or product_name not in products:
                    print(f"Invalid product detected: {cls_name} (conf={conf})")
                    continue
                detected = True
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                
                label = f"{product_name} ({conf:.2f})"
                cv2.rectangle(processed_frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.putText(processed_frame, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
                
                if cls_name in last_detected and current_time - last_detected[cls_name] < 2:
                    continue
                last_detected[cls_name] = current_time
                last_detection_time = current_time
                
                for item in cart:
                    if item['name'] == product_name:
                        # Do not increment quantity here; prompt user via modal
                        prompt_queue.append({
                            "action": "prompt",
                            "item": {
                                "id": item['id'],
                                "name": product_name,
                                "price": products[product_name]['price'],
                                "description": products[product_name]['description'],
                                "quantity": item['quantity']
                            }
                        })
                        print(f"Prompting for duplicate: {product_name} (conf={conf}, current quantity={item['quantity']})")
                        break
                else:
                    new_item = {
                        "id": len(cart),
                        "name": product_name,
                        "price": products[product_name]['price'],
                        "description": products[product_name]['description'],
                        "quantity": 1
                    }
                    cart.append(new_item)
                    prompt_queue.append({
                        "action": "add",
                        "item": new_item
                    })
                    print(f"Added to cart: {product_name} (conf={conf})")

        if not detected:
            if no_detection_start is None:
                no_detection_start = current_time
            elif current_time - no_detection_start > 10:
                cv2.putText(processed_frame, "No products detected", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
        else:
            no_detection_start = None

        ret, buffer = cv2.imencode('.jpg', processed_frame, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
        if not ret:
            print("Failed to encode frame")
            continue
        frame = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

        # Control frame rate
        elapsed = time.time() - frame_start
        if elapsed < frame_interval:
            time.sleep(frame_interval - elapsed)

@app.route('/')
def index():
    print("Index requested")
    try:
        return render_template('index.html')
    except Exception as e:
        print(f"TEMPLATE LOAD ERROR: ", str(e))
        return jsonify({"success": False, "error": f"failed to render index: {str(e)}"}), 500

@app.route('/video_feed')
def video_feed():
    print("Video feed requested")
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/prompt', methods=['GET'])
def get_prompt():
    global prompt_queue
    try:
        if prompt_queue:
            prompt = prompt_queue.pop(0)
            print(f"Serving prompt: {prompt}")
            return jsonify(prompt)
        return jsonify({"action": "none"})
    except Exception as e:
        print(f"Error in get_prompt: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/cart', methods=['GET'])
def get_cart():
    print("Cart request received")
    try:
        item_count = sum(item['quantity'] for item in cart)
        response = jsonify({
            "cart": cart,
            "total": sum(item['price'] * item['quantity'] for item in cart),
            "item_count": item_count
        })
        print("Cart response:", response.get_data(as_text=True))
        return response
    except Exception as e:
        print(f"Error in get_cart: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/cart/add', methods=['POST'])
def add_item():
    print("Add item requested")
    try:
        data = request.json
        product_name = data['name']
        if product_name in products:
            for item in cart:
                if item['name'] == product_name:
                    item['quantity'] += 1
                    print(f"Incremented quantity for {product_name}")
                    return jsonify({"success": True})
            cart.append({
                "id": len(cart),
                "name": product_name,
                "price": products[product_name]['price'],
                "description": products[product_name]['description'],
                "quantity": 1
            })
            print(f"Added new item: {product_name}")
            return jsonify({"success": True})
        return jsonify({"success": False})
    except Exception as e:
        print(f"Error in add_item: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/cart/update/<int:item_id>', methods=['POST'])
def update_item(item_id):
    print(f"Update item {item_id} requested")
    try:
        data = request.json
        action = data.get('action')
        for item in cart:
            if item['id'] == item_id:
                if action == 'increment':
                    item['quantity'] += 1
                elif action == 'decrement' and item['quantity'] > 1:
                    item['quantity'] -= 1
                elif action == 'remove':
                    cart.remove(item)
                return jsonify({"success": True})
        return jsonify({"success": False})
    except Exception as e:
        print(f"Error in update_item: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/cart/remove/<int:item_id>', methods=['POST'])
def remove_item(item_id):
    print(f"Remove item {item_id} requested")
    try:
        global cart
        cart = [item for item in cart if item['id'] != item_id]
        return jsonify({"success": True})
    except Exception as e:
        print(f"Error in remove_item: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/cart/clear', methods=['POST'])
def clear_cart():
    print("Clear cart requested")
    try:
        global cart
        cart = []
        return jsonify({"success": True})
    except Exception as e:
        print(f"Error in clear_cart: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/search', methods=['GET'])
def search_products():
    print("Search requested")
    try:
        query = request.args.get('query', '').lower().strip()
        print(f"Search query received: {query}")
        if not query:
            return jsonify([])
        suggestions = [
            {"name": name, "price": details['price'], "description": details['description']}
            for name, details in products.items()
            if query in name.lower()
        ]
        print(f"Search results: {suggestions}")
        return jsonify(suggestions)
    except Exception as e:
        print(f"Error in search_products: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/checkout', methods=['GET', 'POST'])
def checkout():
    print("Checkout requested")
    try:
        if request.method == 'POST':
            global cart
            cart = []  # Clear cart after successful payment
            return jsonify({"success": True, "message": "Payment successful! Thank You For Shopping."})
        return render_template('checkout.html', cart=cart, total=sum(item['price'] * item['quantity'] for item in cart))
    except Exception as e:
        print(f"Error in checkout: {e}")
        return jsonify({"success": False, "error": f"Failed to render checkout: {str(e)}"}), 500

@app.route('/camera/start', methods=['POST'])
def start_camera():
    print("Start camera requested")
    try:
        global camera_active
        if not init_camera():
            return jsonify({"success": False, "error": "Cannot Access Webcam"})
        camera_active = True
        return jsonify({"success": True})
    except Exception as e:
        print(f"Error in start_camera: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/camera/stop', methods=['POST'])
def stop_camera():
    print("Stop camera requested")
    try:
        global camera_active, camera, processing_thread
        camera_active = False
        def release_camera():
            if camera is not None:
                camera.release()
                print("Camera released successfully")
            else:
                print("No camera to release")
            if processing_thread is not None and processing_thread.is_alive():
                print("Waiting for processing thread to terminate")
                processing_thread.join(timeout=1.0)
        threading.Thread(target=release_camera).start()
        camera = None
        processing_thread = None
        return jsonify({"success": True})
    except Exception as e:
        print(f"Error in stop_camera: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    from werkzeug.serving import run_simple
    run_simple('localhost', 5000, app, threaded=True)
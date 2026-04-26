import sys
import os
import cv2
import numpy as np
from PIL import Image

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend import image_processing

def test_styles():
    print("Testing Style Generation...")
    
    # Create a dummy image (100x100 RGB)
    img_np = np.zeros((100, 100, 3), dtype=np.uint8)
    # Add some shapes
    cv2.rectangle(img_np, (20, 20), (80, 80), (255, 0, 0), -1)
    cv2.circle(img_np, (50, 50), 20, (0, 255, 0), -1)
    
    img_pil = Image.fromarray(img_np)
    
    # Test Pencil Sketch
    try:
        print("Running create_pencil_sketch_effect...")
        sketch = image_processing.create_pencil_sketch_effect(img_pil)
        if isinstance(sketch, Image.Image) and sketch.size == (100, 100):
            print("[OK] Pencil Sketch Success")
        else:
            print("[FAIL] Pencil Sketch Failed: Invalid output")
    except Exception as e:
        print(f"[ERROR] Pencil Sketch Error: {e}")

    # Test Pencil Color
    try:
        print("Running create_pencil_color_effect...")
        # Note: cv2.pencilSketch might fail if opencv-contrib-python is not installed
        # But standard opencv-python might not have it depending on version. 
        # Usually it's in standard cv2 now.
        sketch_color = image_processing.create_pencil_color_effect(img_pil)
        if isinstance(sketch_color, Image.Image) and sketch_color.size == (100, 100):
            print("[OK] Pencil Color Success")
        else:
            print("[FAIL] Pencil Color Failed: Invalid output")
    except Exception as e:
        print(f"[ERROR] Pencil Color Error: {e}")
        print("Note: 'pencilSketch' requires opencv-contrib-python or a recent opencv-python version.")

if __name__ == "__main__":
    test_styles()

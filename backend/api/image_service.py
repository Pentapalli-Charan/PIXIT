"""
Image Processing and Stylization Engine.

This module leverages OpenCV and Pillow to apply artistic filters (such as Pencil Sketch,
Classic Cartoon, and Anime) to uploaded images. It utilizes various techniques including
bilateral filtering, adaptive thresholding, edge detection, and color quantization.
"""

import cv2
import numpy as np
from PIL import Image
from rembg import remove
import hashlib
import os

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if os.name == 'nt' and not BASE_DIR.startswith('\\\\?\\'):
    BASE_DIR = '\\\\?\\' + BASE_DIR
    
CACHE_DIR = os.path.join(BASE_DIR, "uploads", "cache")
if not os.path.exists(CACHE_DIR):
    os.makedirs(CACHE_DIR)

def get_image_hash(image, **kwargs):
    """
    Generates a unique MD5 hash based on image content and parameters.
    """
    # Use only every 10th pixel for faster hashing if needed, or just full bytes
    img_bytes = np.array(image).tobytes()
    param_str = str(sorted(kwargs.items())).encode()
    # Truncate hash to 12 chars to prevent Windows MAX_PATH errors
    return hashlib.md5(img_bytes + param_str).hexdigest()[:12]

def get_cached_result(img_hash):
    cache_path = os.path.join(CACHE_DIR, f"{img_hash}.png")
    if os.path.exists(cache_path):
        return Image.open(cache_path)
    return None

def save_to_cache(img_hash, image):
    cache_path = os.path.join(CACHE_DIR, f"{img_hash}.png")
    image.save(cache_path)

def remove_background(image):
    """
    Removes the background from a PIL image using rembg.
    Returns a PIL image with transparent background (RGBA).
    """
    if isinstance(image, Image.Image):
        # rembg works best with PIL
        return remove(image)
    else:
        # If it's a numpy array, convert to PIL first
        img_pil = Image.fromarray(image)
        return remove(img_pil)

def upscale_image(image, scale=2):
    """
    Performs basic AI-inspired upscaling using Lanczos interpolation
    and sharpening for enhanced detail before stylization.
    """
    if not isinstance(image, Image.Image):
        image = Image.fromarray(image)
    
    w, h = image.size
    upscaled = image.resize((w * scale, h * scale), Image.LANCZOS)
    
    # Apply a slight sharpening to enhance edges for later cartoonization
    # Using a 3x3 sharpening kernel via OpenCV
    img_np = np.array(upscaled)
    kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
    sharpened = cv2.filter2D(img_np, -1, kernel)
    
    return Image.fromarray(sharpened)

def apply_median_blur(image_np, kernel_size=5):
    """
    Applies median blur to reduce noise.
    Kernel size must be an odd integer.
    """
    if kernel_size % 2 == 0:
        kernel_size += 1
    return cv2.medianBlur(image_np, kernel_size)

def apply_canny(image_np, threshold1=100, threshold2=200):
    """
    Applies Canny edge detection.
    """
    return cv2.Canny(image_np, threshold1, threshold2)

def apply_adaptive_threshold(image_np, block_size=9, c=2):
    """
    Applies adaptive thresholding for edge detection.
    Block size must be an odd integer.
    """
    gray = cv2.cvtColor(image_np, cv2.COLOR_RGB2GRAY)
    if block_size % 2 == 0:
        block_size += 1
    
    # Adaptive Threshold: ADAPTIVE_THRESH_MEAN_C or ADAPTIVE_THRESH_GAUSSIAN_C
    # THRESH_BINARY or THRESH_BINARY_INV
    edges = cv2.adaptiveThreshold(
        gray, 
        255, 
        cv2.ADAPTIVE_THRESH_MEAN_C, 
        cv2.THRESH_BINARY, 
        block_size, 
        c
    )
    return edges

def detect_edges(image, method="Canny", **kwargs):
    """
    Wrapper function to apply different edge detection methods.
    Input image can be PIL Image or numpy array (RGB).
    Returns PIL Image.
    """
    if isinstance(image, Image.Image):
        image_np = np.array(image)
    else:
        image_np = image

    # Pre-processing: Median Blur if requested
    blur_k = kwargs.get("blur_kernel", 5)
    if blur_k > 0:
        image_np = apply_median_blur(image_np, blur_k)

    if method == "Canny":
        t1 = kwargs.get("threshold1", 100)
        t2 = kwargs.get("threshold2", 200)
        edges = apply_canny(image_np, t1, t2)
    elif method == "Adaptive Threshold":
        bs = kwargs.get("block_size", 9)
        c = kwargs.get("c", 2)
        edges = apply_adaptive_threshold(image_np, bs, c)
    else:
        raise ValueError(f"Unknown method: {method}")

    return Image.fromarray(edges)

def apply_bilateral_filter(image_np, d=9, sigma_color=75, sigma_space=75):
    """
    Applies bilateral filter to smooth image while preserving edges.
    """
    return cv2.bilateralFilter(image_np, d, sigma_color, sigma_space)

def apply_color_quantization(image_np, k=8):
    """
    Reduces the number of colors in the image using K-means clustering.
    """
    # Transform the image
    data = np.float32(image_np).reshape((-1, 3))

    # Define criteria = ( type, max_iter = 10 , epsilon = 1.0 )
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 1.0)
    
    # Apply K-means
    # Use PP_CENTERS for faster convergence and reduce attempts from 10 to 4
    ret, label, center = cv2.kmeans(data, k, None, criteria, 4, cv2.KMEANS_PP_CENTERS)
    
    # Convert back to uint8
    center = np.uint8(center)
    result = center[label.flatten()]
    result = result.reshape((image_np.shape))
    return result

def apply_cartoon_effect(image, **kwargs):
    """
    Applies the base cartoon effect (Smoothing + Quantization).
    Accepts PIL Image or numpy array. Returns PIL Image.
    """
    if isinstance(image, Image.Image):
        image_np = np.array(image)
    else:
        image_np = image.copy()

    # Optimization: Resize if image is too large
    max_width = 800
    h, w = image_np.shape[:2]
    if w > max_width:
        ratio = max_width / w
        new_h = int(h * ratio)
        image_np = cv2.resize(image_np, (max_width, new_h), interpolation=cv2.INTER_AREA)

    # Bilateral Filter Parameters
    d = kwargs.get("d", 9)
    sigma_color = kwargs.get("sigma_color", 75)
    sigma_space = kwargs.get("sigma_space", 75)
    
    # Quantization Parameters
    k = kwargs.get("k", 8)

    # 1. Apply Bilateral Filter
    # We might want to apply it multiple times for stronger effect
    # for _ in range(2): 
    filtered = apply_bilateral_filter(image_np, d, sigma_color, sigma_space)
    
    # 2. Apply Color Quantization
    quantized = apply_color_quantization(filtered, k)
    
    return Image.fromarray(quantized)

def create_classic_cartoon_effect(image, intensity="Medium", **kwargs):
    """
    Creates a complete classic cartoon effect by combining:
    1. Edge Detection (Adaptive Threshold)
    2. Bilateral Filtering (Smoothing)
    3. Color Quantization (K-means)
    
    Args:
        image: PIL Image or numpy array
        intensity: "Light", "Medium", "Strong" or "Custom"
        **kwargs: Overrides for blur_d, sigma_c, sigma_s, k, block_size, c, remove_bg
    """
    # 1. Check Cache
    img_hash = get_image_hash(image, intensity=intensity, **kwargs)
    cached = get_cached_result(img_hash)
    if cached:
        return cached

    # 2. Initial Pre-processing (Background Removal)
    if kwargs.get("remove_bg", False):
        image = remove_background(image)
        # Convert RGBA result (from rembg) back to RGB for OpenCV processing 
        # unless we specifically want to handle alpha later.
        if image.mode == 'RGBA':
            background = Image.new('RGB', image.size, (255, 255, 255))
            background.paste(image, mask=image.split()[3])
            image = background

    if isinstance(image, Image.Image):
        image_np = np.array(image.convert("RGB"))
    else:
        image_np = image.copy()

    # Optimization: Resize
    max_width = 800
    h, w = image_np.shape[:2]
    if w > max_width:
        ratio = max_width / w
        new_h = int(h * ratio)
        image_np = cv2.resize(image_np, (max_width, new_h), interpolation=cv2.INTER_AREA)

    # Define parameters based on intensity
    if intensity == "Light":
        # More details, lighter edges, more colors
        blur_d, sigma_c, sigma_s = 7, 50, 50
        k = 16
        block_size, c = 7, 3
    elif intensity == "Strong":
        # Abstract, thick edges, few colors
        blur_d, sigma_c, sigma_s = 15, 100, 100
        k = 4
        block_size, c = 13, 2
    elif intensity == "Custom":
        blur_d = kwargs.get("blur_d", 9)
        sigma_c = kwargs.get("sigma_c", 75)
        sigma_s = kwargs.get("sigma_s", 75)
        k = kwargs.get("k", 8)
        block_size = kwargs.get("block_size", 9)
        c = kwargs.get("c", 2)
    else: # Medium (Default)
        blur_d, sigma_c, sigma_s = 9, 75, 75
        k = 8
        block_size, c = 9, 2

    # Allow direct overrides even for presets
    blur_d = kwargs.get("blur_d", blur_d)
    sigma_c = kwargs.get("sigma_c", sigma_c)
    sigma_s = kwargs.get("sigma_s", sigma_s)
    k = kwargs.get("k", k)
    block_size = kwargs.get("block_size", block_size)
    c = kwargs.get("c", c)

    # 1. Edge Detection
    # Using Adaptive Threshold for better artistic edges
    # We use the generic wrapper but force Adaptive Threshold with specific params
    edges = apply_adaptive_threshold(image_np, block_size, c)
    # Edges are white on black, we typically want black edges on white for masking
    # But apply_adaptive_threshold returns white edges on black background usually? 
    # Let's check: cv2.adaptiveThreshold with THRESH_BINARY gives black on white or vice versa depending on type.
    # In my implementation: cv2.THRESH_BINARY gives White(255) where condition met (pixel > threshold).
    # Usually for cartoon mask: we want Edges to be Black (0) and non-edges White (255).
    # So we should probably use THRESH_BINARY (if src > thresh then maxval else 0). 
    # Wait, adaptive threshold usually produces "noisy" edges.
    # Getting generic edges: 255=edge, 0=background. 
    # To use as mask: 
    # We want to keep color where edge is 0 (background), and put black where edge is 255.
    
    # Let's refine the edge mask.
    # Dilate edges slightly for "Strong" intensity
    if intensity == "Strong" or kwargs.get("thick_edges", False):
        kernel = np.ones((2,2), np.uint8)
        edges = cv2.dilate(edges, kernel, iterations=1)

    # Invert edges for masking (Black edges, White background)
    # The current adaptive threshold returns:
    # ADAPTIVE_THRESH_MEAN_C + THRESH_BINARY:
    # If pixel > mean - c, ==> 255 (White), else 0 (Black).
    # Usually edges are darker than neighbors -> edges become 0 (Black)? 
    # No, usually we want Edges to be dark. 
    # Let's verify standard behavior:
    # If we want black edges, we usually use THRESH_BINARY and edges (darker) become 0.
    # Let's assume 'edges' variable holds: 0 for Edge, 255 for Non-Edge.
    # My previous implementation: 
    # edges = cv2.adaptiveThreshold(..., cv2.THRESH_BINARY, ...)
    # This usually results in: Background (similar to neighbors) -> 255, Edges (diff) -> 0?
    # Actually, standard adaptive thresholding often results in speckled noise.
    # Let's stick to the plan: use Median Blur preprocessing before generic edge detection if needed.
    
    # 2. Color & Smoothing
    # Apply Bilateral Filter
    color = apply_bilateral_filter(image_np, blur_d, sigma_c, sigma_s)
    
    # Apply Quantization
    color = apply_color_quantization(color, k)
    
    # 3. Combine
    # Convert edges (grayscale) to 3-channel
    edges_3c = cv2.cvtColor(edges, cv2.COLOR_GRAY2RGB)
    
    # Bitwise AND to overlay edges
    # Check if edges are inverted or not.
    # If 'edges' has 0 for lines and 255 for background:
    # color & edges_3c will keep color where edges_3c is 255, and black where it is 0.
    cartoon = cv2.bitwise_and(color, edges_3c)
    
    result = Image.fromarray(cartoon)
    save_to_cache(img_hash, result)
    return result

def create_pencil_sketch_effect(image, kernel_size=21):
    """
    Creates a black and white pencil sketch effect.
    """
    if isinstance(image, Image.Image):
        image_np = np.array(image)
    else:
        image_np = image.copy()
        
    # Convert to grayscale
    gray = cv2.cvtColor(image_np, cv2.COLOR_RGB2GRAY)
    
    # Invert
    inverted = cv2.bitwise_not(gray)
    
    # Blur
    if kernel_size % 2 == 0: kernel_size += 1
    blurred = cv2.GaussianBlur(inverted, (kernel_size, kernel_size), 0)
    
    # Invert Blur
    inverted_blurred = cv2.bitwise_not(blurred)
    
    # Create sketch by dividing gray by inverted blurred
    sketch = cv2.divide(gray, inverted_blurred, scale=256.0)
    
    return Image.fromarray(sketch)

def create_pencil_color_effect(image):
    """
    Creates a color pencil sketch effect using OpenCV's built-in function.
    """
    if isinstance(image, Image.Image):
        image_np = np.array(image)
        # Convert RGB to BGR for OpenCV
        image_cv = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)
    else:
        image_cv = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

    # Apply pencil sketch effect
    # sigma_s: Range 0-200. Large value -> smoother image.
    # sigma_r: Range 0-1. Large value -> more distinct colors.
    # shade_factor: Range 0-0.1. Intensity of the sketch.
    _, color_sketch = cv2.pencilSketch(image_cv, sigma_s=60, sigma_r=0.07, shade_factor=0.05)
    
    # Convert back to RGB
    color_sketch = cv2.cvtColor(color_sketch, cv2.COLOR_BGR2RGB)
    
    return Image.fromarray(color_sketch)

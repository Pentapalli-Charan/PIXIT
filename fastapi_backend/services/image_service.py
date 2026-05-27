import os
import uuid
import cv2
import numpy as np
from PIL import Image
from fastapi import UploadFile, Request

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class ImageService:
    @staticmethod
    async def process_image(file: UploadFile, style: str, request: Request, settings: dict = None) -> tuple[str, str]:
        """
        Reads the uploaded image, applies the requested stylization filter,
        and saves both the original and processed files.
        Returns: (original_file_url, processed_file_url)
        """
        # Read file contents
        contents = await file.read()
        
        # Save original file
        file_ext = file.filename.split(".")[-1].lower()
        if file_ext not in ["jpg", "jpeg", "png", "webp"]:
            file_ext = "jpg"
        
        original_filename = f"{uuid.uuid4()}_orig.{file_ext}"
        original_path = os.path.join(UPLOAD_DIR, original_filename)
        with open(original_path, "wb") as buffer:
            buffer.write(contents)

        # Convert to numpy array for OpenCV
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_UNCHANGED)
        
        if img is None:
            raise ValueError("Failed to decode uploaded image.")

        # Ensure correct channel format (e.g. handle transparency)
        has_alpha = False
        alpha_channel = None
        if len(img.shape) == 3 and img.shape[2] == 4:
            has_alpha = True
            alpha_channel = img[:, :, 3]
            img = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)
        elif len(img.shape) == 2:
            img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)

        # Apply image processing style
        processed_img = ImageService.apply_filter(img, style, has_alpha, alpha_channel, settings)

        # Save processed file
        processed_ext = "png" if (style == "background_removal" or has_alpha) else "jpg"
        processed_filename = f"{uuid.uuid4()}_proc.{processed_ext}"
        processed_path = os.path.join(UPLOAD_DIR, processed_filename)

        if processed_ext == "png":
            cv2.imwrite(processed_path, processed_img)
        else:
            # Save as high-quality JPG
            cv2.imwrite(processed_path, processed_img, [int(cv2.IMWRITE_JPEG_QUALITY), 95])

        # Serve static links
        base_url = str(request.base_url)
        original_url = f"{base_url}static/{original_filename}"
        processed_url = f"{base_url}static/{processed_filename}"

        return original_url, processed_url

    @staticmethod
    def apply_filter(img: np.ndarray, style: str, has_alpha: bool, alpha_channel: np.ndarray, settings: dict = None) -> np.ndarray:
        h, w = img.shape[:2]
        
        # Parse potential settings overrides
        intensity = float(settings.get("intensity", 0.5)) if settings else 0.5
        contrast = float(settings.get("contrast", 1.0)) if settings else 1.0
        brightness = int(settings.get("brightness", 0)) if settings else 0

        # Adjust brightness/contrast if specified
        if contrast != 1.0 or brightness != 0:
            img = cv2.convertScaleAbs(img, alpha=contrast, beta=brightness)

        if style == "cartoon":
            # 1. Bilateral filter for color smoothing
            color = img.copy()
            bilateral_passes = 2 + int(intensity * 4) # 2 to 6 passes
            for _ in range(bilateral_passes):
                color = cv2.bilateralFilter(color, d=9, sigmaColor=75, sigmaSpace=75)
            
            # 2. Convert to grayscale & median blur
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            gray = cv2.medianBlur(gray, 7)
            
            # 3. Adaptive thresholding for crisp borders
            edge_block_size = 9
            edges = cv2.adaptiveThreshold(
                gray, 255, 
                cv2.ADAPTIVE_THRESH_MEAN_C, 
                cv2.THRESH_BINARY, 
                edge_block_size, 2
            )
            
            # 4. Combine edges with smoothed color image
            edges_color = cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)
            processed = cv2.bitwise_and(color, edges_color)

        elif style == "anime":
            # Anime style: smooth gradients, vibrant colors, clear features
            # 1. Bilateral filter
            anime = cv2.bilateralFilter(img, d=9, sigmaColor=120, sigmaSpace=120)
            
            # 2. Boost color saturation & brightness in HSV space
            hsv = cv2.cvtColor(anime, cv2.COLOR_BGR2HSV).astype(np.float32)
            saturation_scale = 1.2 + (intensity * 0.4) # 1.2 to 1.6
            hsv[:, :, 1] = np.clip(hsv[:, :, 1] * saturation_scale, 0, 255)
            hsv[:, :, 2] = np.clip(hsv[:, :, 2] * 1.05 + 10, 0, 255)
            anime = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)
            
            # 3. Detail enhancement for illustrations
            processed = cv2.detailEnhance(anime, sigma_s=10, sigma_r=0.15)

        elif style == "pencil":
            # Classical pencil sketch formula: divide grayscale by blurred inverted grayscale
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            inverted = 255 - gray
            
            # Blur size depends on intensity setting
            blur_size = int(intensity * 30) * 2 + 1
            if blur_size < 3:
                blur_size = 15
                
            blurred = cv2.GaussianBlur(inverted, (blur_size, blur_size), 0)
            sketch = cv2.divide(gray, 255 - blurred, scale=256)
            
            # Convert back to 3 channels (BGR)
            processed = cv2.cvtColor(sketch, cv2.COLOR_GRAY2BGR)

        elif style == "watercolor":
            # Watercolor: color pooling + light edge outlines
            watercolor = img.copy()
            # Multiple passes of bilateral filtering to pool colors
            passes = 3 + int(intensity * 4)
            for _ in range(passes):
                watercolor = cv2.bilateralFilter(watercolor, d=7, sigmaColor=45, sigmaSpace=45)
            
            # Generate edge sketch
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            blurred = cv2.medianBlur(gray, 5)
            edges = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY, 9, 4)
            edges = cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)
            
            # Blend edges lightly
            processed = cv2.addWeighted(watercolor, 0.88, edges, 0.12, 0)

        elif style == "oil":
            # Fast, high-quality oil painting simulation using cv2.stylization
            processed = cv2.stylization(img, sigma_s=45 + int(intensity * 40), sigma_r=0.25 + (intensity * 0.3))

        elif style == "cyberpunk":
            # Boost purple/pink/blue tones with a bilateral blur glow
            b, g, r = cv2.split(img)
            b = cv2.add(b, int(35 * intensity))
            r = cv2.add(r, int(45 * intensity))
            g = cv2.add(g, int(5 * intensity))
            tinted = cv2.merge([b, g, r])
            processed = cv2.bilateralFilter(tinted, d=9, sigmaColor=70, sigmaSpace=70)

        elif style == "pixar":
            # Smooth clay illustration look with high vibrant color saturation
            pixar_blur = cv2.bilateralFilter(img, d=9, sigmaColor=85, sigmaSpace=85)
            hsv = cv2.cvtColor(pixar_blur, cv2.COLOR_BGR2HSV).astype(np.float32)
            hsv[:, :, 1] = np.clip(hsv[:, :, 1] * (1.15 + intensity * 0.35), 0, 255)
            hsv[:, :, 2] = np.clip(hsv[:, :, 2] + 15, 0, 255)
            pixar_color = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)
            processed = cv2.detailEnhance(pixar_color, sigma_s=8, sigma_r=0.2)

        elif style == "vintage":
            # Vintage sepia tint + vignette borders
            sepia_matrix = np.array([
                [0.272, 0.534, 0.131],
                [0.349, 0.686, 0.168],
                [0.393, 0.769, 0.189]
            ])
            sepia = cv2.transform(img, sepia_matrix)
            rows, cols = img.shape[:2]
            mask = np.zeros((rows, cols))
            for i in range(rows):
                for j in range(cols):
                    dist = np.sqrt((i - rows/2)**2 + (j - cols/2)**2)
                    max_dist = np.sqrt((rows/2)**2 + (cols/2)**2)
                    mask[i, j] = 1.0 - (dist / max_dist) * 0.45 * intensity
            processed = (sepia * mask[:, :, np.newaxis]).astype(np.uint8)

        elif style == "cinematic":
            # High dramatic contrast lut + cool teal shadows and warm highlights
            lut = np.arange(256, dtype=np.uint8)
            for i in range(256):
                val = 255 / (1 + np.exp(-0.025 * (i - 127)))
                lut[i] = np.clip(val, 0, 255)
            cinematic_contrast = cv2.LUT(img, lut)
            b, g, r = cv2.split(cinematic_contrast)
            b = cv2.add(b, int(15 * intensity))
            r = cv2.add(r, int(10 * intensity))
            processed = cv2.merge([b, g, r])

        elif style == "neon":
            # Edge finding with glowing pink/cyan overlay
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)
            edges = cv2.Canny(blurred, 30, 150)
            kernel = np.ones((3, 3), np.uint8)
            dilated = cv2.dilate(edges, kernel, iterations=1)
            glow = np.zeros_like(img)
            glow_color = [255, 0, 180] if intensity > 0.5 else [180, 255, 0]
            glow[dilated > 0] = glow_color
            glow_blur = cv2.GaussianBlur(glow, (15, 15), 0)
            processed = cv2.addWeighted(img, 0.4, glow_blur, 0.6, 0)

        elif style == "sharpen":
            # Laplacian kernel sharpening matrix
            kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
            processed = cv2.filter2D(img, -1, kernel)

        elif style == "denoise":
            # Fast bilateral-based color denoising
            processed = cv2.fastNlMeansDenoisingColored(img, None, 10, 10, 7, 21)

        elif style == "upscale":
            # 2x Image Upscale interpolation (Lanczos)
            processed = cv2.resize(img, (int(w * 2), int(h * 2)), interpolation=cv2.INTER_LANCZOS4)

        elif style == "face_enhance":
            # Skin smooth bilateral filter + lighting glow
            smooth = cv2.bilateralFilter(img, d=9, sigmaColor=35, sigmaSpace=35)
            processed = cv2.addWeighted(img, 0.35, smooth, 0.65, 0)

        elif style == "enhance":
            # Contrast Limited Adaptive Histogram Equalization (CLAHE) + Unsharp Masking
            ycrcb = cv2.cvtColor(img, cv2.COLOR_BGR2YCrCb)
            y, cr, cb = cv2.split(ycrcb)
            
            clip_limit = 1.5 + (intensity * 2.0)
            clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=(8, 8))
            y_enhanced = clahe.apply(y)
            
            ycrcb_enhanced = cv2.merge((y_enhanced, cr, cb))
            enhanced = cv2.cvtColor(ycrcb_enhanced, cv2.COLOR_YCrCb2BGR)
            
            # Unsharp mask for crispness
            gaussian = cv2.GaussianBlur(enhanced, (0, 0), 2)
            processed = cv2.addWeighted(enhanced, 1.4, gaussian, -0.4, 0)

        elif style == "background_removal":
            # Unsupervised GrabCut algorithm centered around subject
            mask = np.zeros(img.shape[:2], np.uint8)
            bgdModel = np.zeros((1, 65), np.float64)
            fgdModel = np.zeros((1, 65), np.float64)
            
            # Margin is 5% around boundaries
            margin_w = int(w * 0.05)
            margin_h = int(h * 0.05)
            rect = (margin_w, margin_h, w - 2 * margin_w, h - 2 * margin_h)
            
            # Run GrabCut segmenter (5 iterations)
            cv2.grabCut(img, mask, rect, bgdModel, fgdModel, 5, cv2.GC_INIT_WITH_RECT)
            
            # Post-process mask: 0 and 2 are background, 1 and 3 are foreground
            mask2 = np.where((mask == 2) | (mask == 0), 0, 1).astype("uint8")
            
            # Smooth mask using Gaussian Blur to prevent jagged edges
            mask_blur = cv2.GaussianBlur(mask2 * 255, (5, 5), 0)
            
            # Merge with image to add transparency
            processed = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)
            processed[:, :, 3] = mask_blur
            return processed # Returns BGRA, skip the standard merge

        else:
            # Default fallback (original)
            processed = img.copy()

        # Re-attach alpha channel if it existed originally (and was not removed by background removal)
        if has_alpha and style != "background_removal":
            processed = cv2.cvtColor(processed, cv2.COLOR_BGR2BGRA)
            processed[:, :, 3] = alpha_channel

        return processed

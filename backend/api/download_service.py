import os
import time
import datetime
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if os.name == 'nt' and not BASE_DIR.startswith('\\\\?\\'):
    BASE_DIR = '\\\\?\\' + BASE_DIR
    
DOWNLOAD_DIR = os.path.join(BASE_DIR, "uploads", "downloads")

if not os.path.exists(DOWNLOAD_DIR):
    os.makedirs(DOWNLOAD_DIR)

def prepare_download(image, user_id, original_filename, format="PNG", quality="High", is_free_preview=False):
    """
    Prepares the stylised image for download based on user preferences.
    """
    import uuid
    timestamp = int(time.time() * 1000)
    unique_id = uuid.uuid4().hex[:6]
    safe_filename = os.path.basename(original_filename)
    base_name = os.path.splitext(safe_filename)[0]
    
    # Apply watermark for free preview
    if is_free_preview:
        if image.mode != "RGBA":
            image = image.convert("RGBA")
            
        overlay = Image.new("RGBA", image.size, (255, 255, 255, 0))
        draw = ImageDraw.Draw(overlay)
        width, height = image.size
        text = "PIXIT PRO Preview"
        # Try to use a default font, fallback to standard
        try:
            # Scale font size based on image width
            font_size = max(20, int(width / 20))
            font = ImageFont.truetype("arial.ttf", font_size)
        except IOError:
            font = ImageFont.load_default()
            
        # Add subtle watermark at bottom right
        try:
            # For newer PIL versions
            text_bbox = draw.textbbox((0, 0), text, font=font)
            text_width = text_bbox[2] - text_bbox[0]
            text_height = text_bbox[3] - text_bbox[1]
        except AttributeError:
            # Fallback for older PIL
            text_width, text_height = draw.textsize(text, font=font)
        
        position = (width - text_width - 20, height - text_height - 20)
        # Add a subtle black background for visibility
        draw.rectangle([position[0]-5, position[1]-5, position[0]+text_width+5, position[1]+text_height+5], fill=(0,0,0,128))
        draw.text(position, text, fill=(255, 255, 255, 200), font=font)
        
        image = Image.alpha_composite(image, overlay)

    # Prepare file format and path
    format_ext = format.lower()
    if format_ext == "jpg":
        format_ext = "jpeg" # PIL uses jpeg
        
    # Keep filename very short to prevent Windows MAX_PATH (260 char) limit errors
    short_base = base_name[:8] if len(base_name) > 8 else base_name
    timestamp_short = int(time.time()) % 100000
    filename = f"dl_{user_id}_{timestamp_short}_{unique_id[:4]}_{short_base}.{format_ext}"
    filepath = os.path.join(DOWNLOAD_DIR, filename)

    # Convert RGBA to RGB if saving as JPEG or PDF
    if format_ext in ["jpeg", "pdf"] and image.mode in ("RGBA", "P"):
        image = image.convert("RGB")
        
    # Save with quality settings
    if format_ext == "jpeg":
        if quality == "Optimized":
            image.save(filepath, "JPEG", quality=60, optimize=True)
        else:
            image.save(filepath, "JPEG", quality=95, optimize=True)
    elif format_ext == "png":
        if quality == "Optimized":
            image.save(filepath, "PNG", optimize=True)
        else:
            image.save(filepath, "PNG")
    elif format_ext == "pdf":
        if quality == "Optimized":
            # Reduce resolution for PDF
            pdf_img = image.copy()
            pdf_img.thumbnail((image.size[0]//2, image.size[1]//2), Image.Resampling.LANCZOS)
            pdf_img.save(filepath, "PDF", resolution=100.0)
        else:
            image.save(filepath, "PDF", resolution=100.0)

    return filepath

def cleanup_old_downloads(max_age_hours=1):
    """
    Deletes files in the download directory older than max_age_hours.
    """
    now = time.time()
    for filename in os.listdir(DOWNLOAD_DIR):
        filepath = os.path.join(DOWNLOAD_DIR, filename)
        if os.path.isfile(filepath):
            file_modified_time = os.path.getmtime(filepath)
            # Check if older than max_age_hours
            if now - file_modified_time > (max_age_hours * 3600):
                try:
                    os.remove(filepath)
                    print(f"Cleaned up old download: {filename}")
                except Exception as e:
                    print(f"Error deleting file {filepath}: {e}")

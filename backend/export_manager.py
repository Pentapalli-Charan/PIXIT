import os
import zipfile
import tempfile
import uuid

def create_zip_download(image_paths, output_filename="pixit_export.zip"):
    """
    Takes a list of valid image paths and packages them into a single ZIP file.
    Returns the absolute path to the generated ZIP file.
    The ZIP file is stored in a temporary directory and should be served immediately.
    """
    if not image_paths:
        return None

    temp_dir = tempfile.gettempdir()
    zip_path = os.path.join(temp_dir, f"{uuid.uuid4().hex}_{output_filename}")

    try:
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for path in image_paths:
                if os.path.exists(path):
                    # Add file to zip archive using its basename
                    zipf.write(path, arcname=os.path.basename(path))
        return zip_path
    except Exception as e:
        print(f"Error creating zip: {e}")
        if os.path.exists(zip_path):
            os.remove(zip_path)
        return None

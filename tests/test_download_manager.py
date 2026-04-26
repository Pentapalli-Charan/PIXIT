import os
import time
import unittest
from PIL import Image
from backend import download_manager

class TestDownloadManager(unittest.TestCase):
    def setUp(self):
        # Create a dummy image
        self.image = Image.new("RGB", (100, 100), color="red")
        self.user_id = 1
        self.orig_filename = "test_image.png"

    def test_prepare_download_png(self):
        filepath = download_manager.prepare_download(
            self.image, self.user_id, self.orig_filename, format="PNG", quality="High"
        )
        self.assertTrue(os.path.exists(filepath))
        self.assertTrue(filepath.endswith(".png"))
        
        # Verify it's a valid image
        img = Image.open(filepath)
        self.assertEqual(img.format, "PNG")

    def test_prepare_download_jpg_optimized(self):
        filepath_high = download_manager.prepare_download(
            self.image, self.user_id, self.orig_filename, format="JPG", quality="High"
        )
        filepath_opt = download_manager.prepare_download(
            self.image, self.user_id, self.orig_filename, format="JPG", quality="Optimized"
        )
        self.assertTrue(os.path.exists(filepath_high))
        self.assertTrue(os.path.exists(filepath_opt))
        self.assertTrue(filepath_high.endswith(".jpg"))
        
        img = Image.open(filepath_high)
        self.assertEqual(img.format, "JPEG")

    def test_prepare_download_pdf(self):
        filepath = download_manager.prepare_download(
            self.image, self.user_id, self.orig_filename, format="PDF", quality="High"
        )
        self.assertTrue(os.path.exists(filepath))
        self.assertTrue(filepath.endswith(".pdf"))

    def test_watermark(self):
        filepath_normal = download_manager.prepare_download(
            self.image, self.user_id, self.orig_filename, format="PNG", is_free_preview=False
        )
        filepath_watermark = download_manager.prepare_download(
            self.image, self.user_id, self.orig_filename, format="PNG", is_free_preview=True
        )
        
        img_normal = Image.open(filepath_normal)
        img_wm = Image.open(filepath_watermark)
        
        # Watermarked image should have different pixels than normal
        pixels_normal = img_normal.tobytes()
        pixels_wm = img_wm.tobytes()
        self.assertFalse(pixels_normal == pixels_wm, "Watermarked image is identical to the normal image")

    def test_cleanup(self):
        filepath = download_manager.prepare_download(
            self.image, self.user_id, self.orig_filename, format="PNG"
        )
        self.assertTrue(os.path.exists(filepath))
        
        # Modify the timestamp to simulate an old file (48 hours ago)
        old_time = time.time() - (48 * 3600)
        os.utime(filepath, (old_time, old_time))
        
        # Run cleanup
        download_manager.cleanup_old_downloads(max_age_hours=24)
        
        # File should be deleted
        self.assertFalse(os.path.exists(filepath))

if __name__ == '__main__':
    unittest.main()

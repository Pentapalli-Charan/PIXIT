
import unittest
import os
import shutil
from io import BytesIO
from frontend import upload_module

class TestUploadModule(unittest.TestCase):
    def setUp(self):
        # Create a dummy uploads directory if it doesn't exist (it should be created by the module)
        if os.path.exists("uploads_test"):
            shutil.rmtree("uploads_test")
        # Monkey patch the upload directory in the module if possible, or just check the default 'uploads'
        # The module uses hardcoded "uploads". We will check if it creates it.
        # But to avoid messing with real uploads, we might want to check logic primarily.
        pass

    def test_unique_filename(self):
        filename = "test.jpg"
        unique_name = upload_module.get_unique_filename(filename)
        self.assertNotEqual(filename, unique_name)
        self.assertTrue(unique_name.endswith(".jpg"))

    def test_validate_image_size(self):
        # Create a mock file object
        class MockFile:
            def __init__(self, size, name, type):
                self.size = size
                self.name = name
                self.type = type

        # 11MB file
        large_file = MockFile(11 * 1024 * 1024, "large.jpg", "image/jpeg")
        valid, msg = upload_module.validate_image(large_file)
        self.assertFalse(valid)
        self.assertIn("File size exceeds", msg)

        # 1MB file
        small_file = MockFile(1 * 1024 * 1024, "small.jpg", "image/jpeg")
        valid, msg = upload_module.validate_image(small_file)
        self.assertTrue(valid)

    def test_validate_image_type(self):
        class MockFile:
            def __init__(self, size, name, type):
                self.size = size
                self.name = name
                self.type = type

        # Text file
        txt_file = MockFile(1024, "test.txt", "text/plain")
        valid, msg = upload_module.validate_image(txt_file)
        self.assertFalse(valid)
        self.assertIn("Unsupported file format", msg)

        # PNG file
        png_file = MockFile(1024, "test.png", "image/png")
        valid, msg = upload_module.validate_image(png_file)
        self.assertTrue(valid)

if __name__ == '__main__':
    unittest.main()

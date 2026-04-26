
import unittest
import numpy as np
from PIL import Image
from backend import image_processing

class TestImageProcessing(unittest.TestCase):
    def setUp(self):
        # Create a simple generic image (100x100 RGB)
        self.img_np = np.zeros((100, 100, 3), dtype=np.uint8)
        # Add a white square in the middle to create edges
        self.img_np[25:75, 25:75] = [255, 255, 255]
        self.img_pil = Image.fromarray(self.img_np)

    def test_median_blur(self):
        # Just test it runs and returns array of same shape
        blurred = image_processing.apply_median_blur(self.img_np, kernel_size=3)
        self.assertEqual(blurred.shape, self.img_np.shape)

    def test_canny_edge_detection(self):
        edges = image_processing.detect_edges(
            self.img_pil, 
            method="Canny", 
            threshold1=50, 
            threshold2=150
        )
        self.assertIsInstance(edges, Image.Image)
        self.assertEqual(edges.size, self.img_pil.size)
        # Canny returns single channel image (mode "L" usually, or just checking array shape if converted)
        edges_np = np.array(edges)
        # Should detect edges of the square
        self.assertTrue(np.max(edges_np) > 0)

    def test_adaptive_threshold(self):
        edges = image_processing.detect_edges(
            self.img_pil, 
            method="Adaptive Threshold", 
            block_size=11, 
            c=2
        )
        self.assertIsInstance(edges, Image.Image)
        self.assertEqual(edges.size, self.img_pil.size)

    def test_invalid_method(self):
        with self.assertRaises(ValueError):
            image_processing.detect_edges(self.img_pil, method="InvalidMethod")

    def test_bilateral_filter(self):
        filtered = image_processing.apply_bilateral_filter(self.img_np, d=5, sigma_color=50, sigma_space=50)
        self.assertEqual(filtered.shape, self.img_np.shape)

    def test_color_quantization(self):
        # Quantize to 2 colors
        k = 2
        quantized = image_processing.apply_color_quantization(self.img_np, k=k)
        self.assertEqual(quantized.shape, self.img_np.shape)
        
        # Check unique colors count
        pixels = quantized.reshape(-1, 3)
        unique_colors = np.unique(pixels, axis=0)
        self.assertLessEqual(len(unique_colors), k)

    def test_cartoon_effect_base(self):
         # Create a small image for speed
        cartoon = image_processing.apply_cartoon_effect(self.img_pil, k=4)
        self.assertIsInstance(cartoon, Image.Image)
        self.assertEqual(cartoon.size, self.img_pil.size)

    def test_create_classic_cartoon_effect(self):
        # Test different intensities
        for intensity in ["Light", "Medium", "Strong"]:
            cartoon = image_processing.create_classic_cartoon_effect(self.img_pil, intensity=intensity)
            self.assertIsInstance(cartoon, Image.Image)
            # The result should be same size (or max width logic applies, but here img is small so same size)
            self.assertEqual(cartoon.size, self.img_pil.size)
            
            # Check if it's not empty/black
            cartoon_np = np.array(cartoon)
            self.assertTrue(np.max(cartoon_np) > 0)

if __name__ == '__main__':
    unittest.main()

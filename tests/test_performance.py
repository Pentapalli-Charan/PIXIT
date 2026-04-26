import time
import tracemalloc
import threading
import os
import sys
import tempfile

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend import image_processing
from PIL import Image

def test_image_processing_performance():
    # create dummy image
    img = Image.new('RGB', (1024, 1024), color = 'blue')
    
    styles = ["Pencil Sketch", "Classic Cartoon", "Anime"]
    results = {}
    
    tracemalloc.start()
    for style in styles:
        start = time.time()
        # process
        processed = image_processing.process_image(img, style)
        end = time.time()
        
        current, peak = tracemalloc.get_traced_memory()
        
        results[style] = {
            "time_sec": end - start,
            "peak_mem_mb": peak / 10**6
        }
    tracemalloc.stop()
    return results

def simulate_concurrent_users(num_users=10):
    from backend import database
    
    # ensure db exists
    database.create_tables()
    
    threads = []
    
    def user_action(uid):
        for _ in range(5):
            database.add_user(f"perf_user_{time.time()}_{uid}_{_}", f"perf_{time.time()}_{uid}_{_}@test.com", "pass")
            
    start = time.time()
    for i in range(num_users):
        t = threading.Thread(target=user_action, args=(i,))
        threads.append(t)
        t.start()
        
    for t in threads:
        t.join()
        
    return time.time() - start

if __name__ == "__main__":
    print("--- Performance Tests ---")
    print("1. Image Processing:")
    try:
        res = test_image_processing_performance()
        for style, d in res.items():
            print(f"  {style}: {d['time_sec']:.3f}s, Peak Mem: {d['peak_mem_mb']:.2f} MB")
    except Exception as e:
        print(f"Processing test failed: {e}")
        
    print("\n2. DB Concurrency:")
    try:
        time_taken = simulate_concurrent_users(20)
        print(f"  20 concurrent users (100 inserts) took {time_taken:.3f}s")
    except Exception as e:
        print(f"Concurrency test failed: {e}")
    
    print("\nPerformance tests completed.")

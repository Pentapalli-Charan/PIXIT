import unittest
import os
import sys

# Add the project root to the python path so imports work correctly
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import sqlite3
import datetime
from backend import database, auth, export_manager

class TestProfileSystem(unittest.TestCase):
    def setUp(self):
        # Create a test DB in memory or temp
        database.DB_NAME = "test_profile_db.sqlite"
        database.create_tables()
        self.conn = database.get_db_connection()
        self.cursor = self.conn.cursor()
        
        # Add test user
        self.user_id, _ = database.add_user("testuser_prof", "test_prof@example.com", "hashedpass")
        self.assertIsNotNone(self.user_id)
        
    def tearDown(self):
        self.conn.close()
        if os.path.exists(database.DB_NAME):
            os.remove(database.DB_NAME)
            
    def test_database_stats(self):
        # Mock some transactions and image history
        t_id = database.add_transaction(self.user_id, 10.0, "Completed", "Stripe")
        database.add_image_history(self.user_id, "orig.jpg", "proc.jpg", "Pencil Sketch", True, t_id)
        database.add_image_history(self.user_id, "orig2.jpg", "proc2.jpg", "Classic Cartoon", False, None)
        database.add_image_history(self.user_id, "orig3.jpg", "proc3.jpg", "Pencil Sketch", False, None)
        
        stats = database.get_user_stats(self.user_id)
        self.assertEqual(stats["image_count"], 3)
        self.assertEqual(stats["transaction_count"], 1)
        self.assertEqual(stats["total_spent"], 10.0)
        self.assertEqual(stats["favorite_style"], "Pencil Sketch")
        
    def test_update_profile(self):
        success, msg = database.update_user_profile(
            self.user_id, 
            new_email="new_test@example.com", 
            auto_delete_days=30
        )
        self.assertTrue(success)
        
        # Verify in DB
        self.cursor.execute("SELECT email, auto_delete_days FROM Users WHERE user_id = ?", (self.user_id,))
        row = self.cursor.fetchone()
        self.assertEqual(row['email'], "new_test@example.com")
        self.assertEqual(row['auto_delete_days'], 30)

    def test_delete_history(self):
        # Create dummy file to test deletion loop logic in app
        # Actually database just returns files to delete
        img_id = database.add_image_history(self.user_id, "del_orig.jpg", "del_proc.jpg", "Style", False)
        
        to_delete = database.delete_processing_history(self.user_id, img_id)
        self.assertEqual(len(to_delete), 1)
        self.assertEqual(to_delete[0]['original_image_path'], "del_orig.jpg")
        
        # Verify gone from DB
        hist = database.get_all_processing_history(self.user_id)
        self.assertEqual(len(hist), 0)

if __name__ == '__main__':
    unittest.main()

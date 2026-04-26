# Database Architecture and Schema details

This project utilizes `SQLite3` for lightweight, file-based relational data management. The database is initialized and managed through `backend/database.py`.

## Entity-Relationship Overview

The database uses a standard normalized structure to track users, their purchases, and their stylized image histories.

### 1. `Users` Table
Stores authentication and profile preferences.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `user_id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | Unique identifier. |
| `username` | TEXT | UNIQUE, NOT NULL | Login handle. |
| `email` | TEXT | UNIQUE, NOT NULL | Contact email. |
| `password_hash` | TEXT | NOT NULL | bcrypt encoded password. |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Account creation timestamp. |
| `last_login` | TIMESTAMP | | Last login date. |
| `failed_login_attempts` | INTEGER | DEFAULT 0 | Counter for brute-force protection. |
| `lockout_until` | TIMESTAMP | | Expiration for locked accounts. |
| `auto_delete_days` | INTEGER | DEFAULT 0 | Privacy setting for history cleanup. |

### 2. `Transactions` Table
Logs all payment attempts managed by Razorpay.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `transaction_id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | Internal reference. |
| `user_id` | INTEGER | NOT NULL, FOREIGN KEY (`Users.user_id`) ON DELETE CASCADE | Customer reference. |
| `amount` | REAL | NOT NULL | Payment value in INR. |
| `payment_status` | TEXT | NOT NULL | e.g. 'Completed', 'Failed', 'Pending'. |
| `transaction_date`| TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Date of transaction. |
| `payment_method` | TEXT | | (Mocked) Razorpay/Card. |
| `razorpay_order_id`| TEXT | | Gateway external order reference. |
| `razorpay_payment_id`| TEXT| | Gateway external payment reference. |
| `razorpay_signature`| TEXT| | Validated webhook payload signature. |

### 3. `ImageHistory` Table
Audits every image passed through the OpenCV engine.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `image_id` | INTEGER | PRIMARY KEY | Unique image generation ID. |
| `user_id` | INTEGER | NOT NULL, FOREIGN KEY (`Users.user_id`) ON DELETE CASCADE | Associated user ID. |
| `original_image_path` | TEXT | NOT NULL | Base filepath to user upload. |
| `processed_image_path` | TEXT | NOT NULL | Generated OpenCV result filepath. |
| `style_applied` | TEXT | NOT NULL | e.g. 'Pencil Sketch', 'Anime'. |
| `processing_date` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Inference completion date. |
| `is_premium` | BOOLEAN | DEFAULT FALSE | Flag indicating if watermark was removed. |
| `transaction_id` | INTEGER | FOREIGN KEY (`Transactions.transaction_id`) ON DELETE SET NULL | Associated payment record if premium. |

## Sample Queries

### Get User Dashboard Statistics
```sql
-- Retrieve all-time spent amount by user
SELECT SUM(amount) as total 
FROM Transactions 
WHERE user_id = ? AND payment_status = 'Completed';

-- Retrieve favorite style
SELECT style_applied, COUNT(*) as count 
FROM ImageHistory 
WHERE user_id = ? 
GROUP BY style_applied 
ORDER BY count DESC 
LIMIT 1;
```

### Cascading Deletes
Thanks to `PRAGMA foreign_keys = ON;`, deleting a user completely scrubs their history natively:
```sql
DELETE FROM Users WHERE user_id = ?;
-- SQLite automatically deletes matching `Transactions` and `ImageHistory` records via CASCADE.
```

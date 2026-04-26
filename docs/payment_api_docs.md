# Payment API Integration Documentation

The AI-Powered Image Stylization platform utilizes **Razorpay** as its payment gateway to process premium image downloads (watermark removal). The logic is encapsulated entirely within `backend/payment_handler.py`.

## Architecture Overview

1. **Authentication:** The backend initializes the Razorpay client using two environment variables stored in `.env`: `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.
2. **Order Creation:** Before a user downloads an image, an order payload is generated backend-side and relayed to the Streamlit frontend.
3. **Checkout UI:** The frontend leverages `streamlit.components.v1.html` to inject a dynamic JavaScript checkout overlay tied to the Order ID.
4. **Verification:** Upon successful JS callback, the payload signature is sent back to Python for server-side cryptographical verification against the underlying secret.

## 1. Environment Loading
The `payment_handler.py` module imports `load_dotenv` natively to secure secrets without hardcoding parameters.

```python
import os
import razorpay
from dotenv import load_dotenv

load_dotenv()
RAZORPAY_KEY_ID = os.getenv('RAZORPAY_KEY_ID')
RAZORPAY_KEY_SECRET = os.getenv('RAZORPAY_KEY_SECRET')
```

## 2. Order Creation Process
The function `create_payment_order(amount, currency="INR")` transforms standard unit amounts (e.g. `₹100`) into their lowest denominator (`10000 paise`) as expected by Razorpay.

**Response Structure (Python Dict):**
```json
{
  "id": "order_EKwxwSAx9Jq...",
  "entity": "order",
  "amount": 10000,
  "currency": "INR",
  "receipt": "receipt_1",
  "status": "created",
  "attempts": 0,
  "created_at": 1582628071
}
```

## 3. Signature Validation
To prevent fraudulent requests from simply injecting a `"status": "success"` into the Streamlit session state, the function `verify_payment_signature` recalculates the HMAC hex digest signature using `hmac_sha256`.

```python
def verify_payment_signature(razorpay_order_id, razorpay_payment_id, razorpay_signature):
    try:
        data = {
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature
        }
        client.utility.verify_payment_signature(data)
        return True
    except razorpay.errors.SignatureVerificationError:
        return False
```
If `verify_payment_signature` raises a `SignatureVerificationError`, the session state rejects the download and logs a failed transaction in SQLite.

## Mock Configuration Limitations
Currently, Streamlit does not elegantly support bi-directional long-polling Webhooks without a dedicated API framework (like FastAPI). Thus, the application mocks the final webhook by verifying signatures synchronously upon checkout close. In production, a dedicated `/webhook` endpoint must be configured in a secondary WSGI server.

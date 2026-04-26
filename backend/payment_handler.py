"""
Payment Gateway Integration Module (Razorpay).

This module handles the creation and verification of payment orders using the Razorpay API.
It securely loads API keys from environment variables and provides utilities
to generate order IDs and validate webhook signatures to confirm transactions.
"""

import os
import razorpay
from dotenv import load_dotenv

load_dotenv()

RAZORPAY_KEY_ID = os.getenv('RAZORPAY_KEY_ID')
RAZORPAY_KEY_SECRET = os.getenv('RAZORPAY_KEY_SECRET')

# Initialize Razorpay client only if keys are available
if RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET:
    client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
else:
    client = None
    print("WARNING: Razorpay keys not found in environment variables.")

def create_payment_order(amount, currency="INR", receipt_id=None):
    """
    Creates a new Razorpay order. Amount should be in rupees (it will be converted to paise).
    """
    if not client:
        raise Exception("Razorpay client is not initialized. Please check your API keys.")
    
    # Razorpay expects amount in paise (1 INR = 100 paise)
    amount_in_paise = int(amount * 100)
    
    data = {
        "amount": amount_in_paise,
        "currency": currency,
        "payment_capture": "1" # Automatically capture payment
    }
    
    if receipt_id:
        data["receipt"] = str(receipt_id)
        
    order = client.order.create(data=data)
    return order

def verify_payment_signature(razorpay_order_id, razorpay_payment_id, razorpay_signature):
    """
    Verifies the Razorpay payment signature to ensure authenticity.
    Returns True if valid, False otherwise.
    """
    if not client:
        raise Exception("Razorpay client is not initialized.")
        
    try:
        data = {
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature
        }
        # verify_payment_signature returns None on success, raises error on failure
        client.utility.verify_payment_signature(data)
        return True
    except razorpay.errors.SignatureVerificationError:
        return False
    except Exception as e:
        print(f"Error validating payment signature: {e}")
        return False

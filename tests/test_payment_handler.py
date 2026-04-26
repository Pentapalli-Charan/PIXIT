import unittest
from unittest.mock import patch, MagicMock
from backend import payment_handler
from backend.payment_handler import create_payment_order, verify_payment_signature
import razorpay

class TestPaymentHandler(unittest.TestCase):
    
    @patch('backend.payment_handler.client')
    def test_create_payment_order(self, mock_client):
        # Setup mock behavior
        mock_order_response = {"id": "order_mock123", "amount": 5000, "currency": "INR"}
        mock_client.order.create.return_value = mock_order_response
        
        # Call function
        order = create_payment_order(50.00, receipt_id="test_receipt")
        
        # Verify
        mock_client.order.create.assert_called_once_with(data={
            "amount": 5000,
            "currency": "INR",
            "payment_capture": "1",
            "receipt": "test_receipt"
        })
        self.assertEqual(order["id"], "order_mock123")
        self.assertEqual(order["amount"], 5000)

    @patch('backend.payment_handler.client')
    def test_verify_payment_signature_success(self, mock_client):
        # Setup mock behavior - verify_payment_signature returns None on success
        mock_client.utility.verify_payment_signature.return_value = None
        
        # Call function
        result = verify_payment_signature("order_id", "payment_id", "signature")
        
        # Verify
        self.assertTrue(result)
        mock_client.utility.verify_payment_signature.assert_called_once_with({
            'razorpay_order_id': "order_id",
            'razorpay_payment_id': "payment_id",
            'razorpay_signature': "signature"
        })

    @patch('backend.payment_handler.client')
    def test_verify_payment_signature_failure(self, mock_client):
        # Setup mock behavior to raise SignatureVerificationError
        mock_client.utility.verify_payment_signature.side_effect = razorpay.errors.SignatureVerificationError(
            "Invalid signature", ""
        )
        
        # Call function
        result = verify_payment_signature("order_id", "payment_id", "invalid_signature")
        
        # Verify
        self.assertFalse(result)

if __name__ == '__main__':
    unittest.main()

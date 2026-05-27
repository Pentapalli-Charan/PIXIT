from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
import os
import datetime
from api.dependencies import get_current_user
from core.database import get_db, User, Subscription, BillingHistory

router = APIRouter()

# Try loading Stripe SDK (sandboxed optional)
try:
    import stripe
except ImportError:
    stripe = None

@router.get("/subscription")
def get_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sub = db.query(Subscription).filter(Subscription.user_id == current_user.id).first()
    
    if not sub:
        # Default Free subscription
        sub_data = {
            "plan_name": "Free",
            "status": "active",
            "billing_cycle": "monthly",
            "current_period_end": None,
            "stripe_subscription_id": None
        }
    else:
        sub_data = {
            "plan_name": sub.plan_name,
            "status": sub.status,
            "billing_cycle": sub.billing_cycle,
            "current_period_end": sub.current_period_end.isoformat() if sub.current_period_end else None,
            "stripe_subscription_id": sub.stripe_subscription_id
        }
        
    history = db.query(BillingHistory).filter(BillingHistory.user_id == current_user.id).order_by(BillingHistory.created_at.desc()).all()
    history_data = []
    for item in history:
        history_data.append({
            "id": item.id,
            "amount": item.amount,
            "currency": item.currency,
            "status": item.status,
            "plan_name": item.plan_name,
            "billing_cycle": item.billing_cycle,
            "created_at": item.created_at.isoformat()
        })
        
    return {
        "subscription": sub_data,
        "billing_history": history_data
    }

@router.post("/checkout-session")
def create_checkout_session(
    plan_name: str = Body(..., embed=True),
    billing_cycle: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    stripe_key = os.environ.get("STRIPE_SECRET_KEY")
    
    # SaaS Plans pricing tier definition
    prices = {
        "Pro": {"monthly": 1500, "yearly": 12000},
        "Enterprise": {"monthly": 4900, "yearly": 39900}
    }
    
    if plan_name not in prices or billing_cycle not in ["monthly", "yearly"]:
        raise HTTPException(status_code=400, detail="Invalid plan name or billing cycle")
        
    amount = prices[plan_name][billing_cycle]
    
    # If stripe_key is available, use real Stripe checkout session in Test Mode
    if stripe_key and stripe:
        stripe.api_key = stripe_key
        try:
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': f"PIXIT {plan_name} Plan ({billing_cycle.capitalize()})",
                            'description': f"Unlimited AI Filters, maximum image resolution, ultra-speed processing, and secure cloud storage.",
                        },
                        'unit_amount': amount,
                        'recurring': {
                            'interval': 'month' if billing_cycle == 'monthly' else 'year',
                        }
                    },
                    'quantity': 1,
                }],
                mode='subscription',
                success_url="http://localhost:30001/payment-success?session_id={CHECKOUT_SESSION_ID}&plan=" + plan_name + "&cycle=" + billing_cycle,
                cancel_url="http://localhost:30001/payment-failed",
                client_reference_id=str(current_user.id),
                customer_email=current_user.email
            )
            return {"url": session.url, "is_mock": False}
        except Exception as e:
            # Safe fallback if Stripe API fails
            print(f"Stripe Error: {e}, falling back to mock")
            
    # Mock checkout flow url
    return {
        "url": f"/checkout?plan={plan_name}&cycle={billing_cycle}",
        "is_mock": true
    }

@router.post("/verify")
def verify_payment(
    session_id: str = Body(..., embed=True),
    plan_name: str = Body(..., embed=True),
    billing_cycle: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    stripe_key = os.environ.get("STRIPE_SECRET_KEY")
    
    prices = {
        "Pro": {"monthly": 1500, "yearly": 12000},
        "Enterprise": {"monthly": 4900, "yearly": 39900}
    }
    amount = prices.get(plan_name, {}).get(billing_cycle, 0)
    
    sub = db.query(Subscription).filter(Subscription.user_id == current_user.id).first()
    if not sub:
        sub = Subscription(user_id=current_user.id)
        db.add(sub)
        
    sub.plan_name = plan_name
    sub.billing_cycle = billing_cycle
    sub.status = "active"
    
    days = 30 if billing_cycle == "monthly" else 365
    sub.current_period_end = datetime.datetime.now() + datetime.timedelta(days=days)
    
    if stripe_key and stripe and session_id.startswith("cs_"):
        stripe.api_key = stripe_key
        try:
            session = stripe.checkout.Session.retrieve(session_id)
            sub.stripe_subscription_id = session.subscription
            sub.stripe_customer_id = session.customer
        except Exception as e:
            print(f"Stripe verification failure: {e}")
    else:
        sub.stripe_subscription_id = f"sub_mock_{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}"
        sub.stripe_customer_id = f"cus_mock_{current_user.id}"
        
    # Register billing transaction receipt
    history = BillingHistory(
        user_id=current_user.id,
        amount=amount,
        currency="usd",
        status="paid",
        plan_name=plan_name,
        billing_cycle=billing_cycle,
        stripe_invoice_id=f"in_mock_{datetime.datetime.now().strftime('%s')}" if not session_id.startswith("cs_") else f"in_stripe_{session_id[-8:]}"
    )
    db.add(history)
    db.commit()
    db.refresh(sub)
    
    return {
        "status": "success",
        "plan_name": sub.plan_name,
        "current_period_end": sub.current_period_end.isoformat()
    }

@router.post("/cancel")
def cancel_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sub = db.query(Subscription).filter(Subscription.user_id == current_user.id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="No active subscription found")
        
    stripe_key = os.environ.get("STRIPE_SECRET_KEY")
    if stripe_key and stripe and sub.stripe_subscription_id and not sub.stripe_subscription_id.startswith("sub_mock_"):
        stripe.api_key = stripe_key
        try:
            stripe.Subscription.modify(
                sub.stripe_subscription_id,
                cancel_at_period_end=True
            )
            sub.status = "canceled"
        except Exception as e:
            print(f"Stripe subscription cancellation error: {e}")
            sub.status = "canceled"
    else:
        sub.status = "canceled"
        
    db.commit()
    db.refresh(sub)
    return {"status": "success", "message": "Subscription cancelled successfully."}

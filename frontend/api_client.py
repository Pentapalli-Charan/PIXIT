import json
from backend.services import auth_service, user_service

class AuthAPI:
    @staticmethod
    def login(payload: dict) -> dict:
        user, msg = auth_service.login_user(payload.get("identifier"), payload.get("password"))
        if user:
            return {"success": True, "data": user, "error": None}
        return {"success": False, "data": None, "error": msg}

    @staticmethod
    def register(payload: dict) -> dict:
        success, msg = auth_service.register_user(
            payload.get("username"), 
            payload.get("email"), 
            payload.get("password")
        )
        if success:
            return {"success": True, "data": {"message": msg}, "error": None}
        return {"success": False, "data": None, "error": msg}

    @staticmethod
    def check_username(username: str) -> dict:
        user = user_service.get_user_by_username(username)
        if user:
            return {"success": True, "data": {"exists": True}, "error": None}
        return {"success": True, "data": {"exists": False}, "error": None}
        
    @staticmethod
    def check_email(email: str) -> dict:
        user = user_service.get_user_by_email(email)
        if user:
            return {"success": True, "data": {"exists": True}, "error": None}
        return {"success": True, "data": {"exists": False}, "error": None}

class APIClient:
    auth = AuthAPI()

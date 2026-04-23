def success_response(data, message: str = "Success") -> dict:
    return {
        "success": True,
        "message": message,
        "data": data,
    }

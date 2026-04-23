from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


class AppException(Exception):
    def __init__(self, detail: str, status_code: int, error_type: str):
        self.detail = detail
        self.status_code = status_code
        self.error_type = error_type


def _error_response(detail: str, status_code: int, error_type: str) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "detail": detail,
            "status_code": status_code,
            "type": error_type,
        },
    )


async def app_exception_handler(_: Request, exc: AppException) -> JSONResponse:
    return _error_response(exc.detail, exc.status_code, exc.error_type)


async def http_exception_handler(_: Request, exc: HTTPException) -> JSONResponse:
    error_type = "forbidden" if exc.status_code == status.HTTP_403_FORBIDDEN else "http_error"
    return _error_response(str(exc.detail), exc.status_code, error_type)


async def validation_exception_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    return _error_response(str(exc.errors()), status.HTTP_422_UNPROCESSABLE_ENTITY, "validation_error")


async def unhandled_exception_handler(_: Request, exc: Exception) -> JSONResponse:
    return _error_response(str(exc), status.HTTP_500_INTERNAL_SERVER_ERROR, "server_error")


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(AppException, app_exception_handler)
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)

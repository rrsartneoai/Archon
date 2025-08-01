from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.openapi.utils import get_openapi
import time
import logging

from app.core.config import settings
from app.api.v1.endpoints import kancelarie, klienci, sprawy

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=settings.DESCRIPTION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Wystąpił błąd wewnętrzny serwera",
            "error_type": type(exc).__name__
        }
    )


# Health check endpoint
@app.get("/health")
async def health_check():
    """
    Endpoint sprawdzający stan aplikacji.
    """
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT
    }


# Root endpoint
@app.get("/")
async def root():
    """
    Główny endpoint API.
    """
    return {
        "message": "API Kancelarii Prawnej",
        "version": settings.VERSION,
        "docs_url": "/docs",
        "redoc_url": "/redoc",
        "openapi_url": f"{settings.API_V1_STR}/openapi.json"
    }


# Include API routers
app.include_router(
    kancelarie.router,
    prefix=f"{settings.API_V1_STR}/kancelarie",
    tags=["Kancelarie"],
    responses={404: {"description": "Nie znaleziono"}}
)

app.include_router(
    klienci.router,
    prefix=f"{settings.API_V1_STR}/klienci",
    tags=["Klienci"],
    responses={404: {"description": "Nie znaleziono"}}
)

app.include_router(
    sprawy.router,
    prefix=f"{settings.API_V1_STR}/sprawy",
    tags=["Sprawy"],
    responses={404: {"description": "Nie znaleziono"}}
)


# Custom OpenAPI schema
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description=settings.DESCRIPTION,
        routes=app.routes,
    )
    
    # Add custom info
    openapi_schema["info"]["contact"] = {
        "name": "Zespół Deweloperski",
        "email": "dev@kancelaria-api.pl"
    }
    
    openapi_schema["info"]["license"] = {
        "name": "MIT License",
        "url": "https://opensource.org/licenses/MIT"
    }
    
    # Add servers
    openapi_schema["servers"] = [
        {
            "url": "http://localhost:8000",
            "description": "Serwer deweloperski"
        },
        {
            "url": "https://api.kancelaria.pl",
            "description": "Serwer produkcyjny"
        }
    ]
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info"
    )
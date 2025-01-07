from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import kaiji, mar, micchi

app = FastAPI(docs_url="/docs", openapi_url="/openapi.json")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,   
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/")
def helloworld():
    return {"Hello": "FastAPI is running :)"}

# app.include_router(test.router)
app.include_router(kaiji.router)
app.include_router(mar.router)
app.include_router(micchi.router)
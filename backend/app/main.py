from fastapi import FastAPI

app = FastAPI(title="Setlist")

@app.get("/")
def read_root():
    return {"message": "Welcome to SetList API"}

@app.get("/health")
def health_check(): 
    return{"status": "healthy"}

import os, tempfile, shutil
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel
import uvicorn

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

print("Caricamento Whisper base...", flush=True)
model = WhisperModel("base", device="cpu", compute_type="int8")
print("Pronto!", flush=True)

@app.get("/")
def health(): return {"status":"ok","model":"whisper-base"}

@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
        shutil.copyfileobj(file.file, tmp); tmp_path = tmp.name
    try:
        segments, info = model.transcribe(tmp_path, language="it", beam_size=5, word_timestamps=True, vad_filter=True)
        segs, words = [], []
        for s in segments:
            segs.append({"start":round(s.start,3),"end":round(s.end,3),"text":s.text.strip()})
            if s.words:
                for w in s.words: words.append({"word":w.word.strip(),"start":round(w.start,3),"end":round(w.end,3)})
        return {"language":info.language,"duration":round(info.duration,3),"segments":segs,"words":words,"full_text":" ".join([x["text"] for x in segs])}
    except Exception as e: raise HTTPException(500, str(e))
    finally: os.unlink(tmp_path)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT",8000)))

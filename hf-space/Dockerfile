FROM python:3.10-slim

WORKDIR /code

RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# easyocr 한국어+영어 모델 미리 다운로드 (빌드 시간에 처리)
RUN python -c "import easyocr; easyocr.Reader(['ko', 'en'])"

COPY . .

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]

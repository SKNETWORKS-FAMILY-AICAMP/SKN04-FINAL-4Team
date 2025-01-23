FROM python:3.10

RUN mkdir /app

WORKDIR /app

ENV PYTHONDONOTWRITEBYTECODE 1
ENV PYTHONBUFFERED 1
COPY requirements.txt ./
RUN pip install --upgrade pip
RUN pip install -r requirements.txt
COPY . ./
# gunicorn 실행
# CMD ["gunicorn", "--bind", "0.0.0.0:8000", "sllm_poject.wsgi:application"]
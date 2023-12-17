FROM python:3.11-alpine3.18 as builder

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

RUN apk update \
 && apk add --no-cache python3 py3-pip \
 && apk add --no-cache bash gcc musl-dev python3-dev libffi-dev openssl-dev cargo

RUN pip install --upgrade pip

COPY ./requirements.txt /app/requirements.txt
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels -r requirements.txt


FROM python:3.11-alpine3.18

ENV PYTHONUNBUFFERED 1

COPY --from=builder /app/wheels /wheels
COPY --from=builder /app/requirements.txt .
RUN pip install --no-cache /wheels/*

COPY server server

CMD ["uvicorn", "server.main:app", "--host", "0.0.0.0", "--root-path", "/api"]

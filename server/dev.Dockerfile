FROM python:3.11-alpine3.18

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

RUN apk update && apk add python3-dev bash postgresql-dev musl-dev
RUN pip install --upgrade pip

COPY requirements.txt /app/requirements.txt
RUN pip install -r requirements.txt

ENTRYPOINT ["bash", "./entrypoint.sh"]

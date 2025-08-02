FROM bsidessfctf/base:latest

RUN apt-get update -y && \
    apt-get install -y python3-pip python3-dev

COPY . /app

WORKDIR /app

RUN pip install -r requirements.txt

EXPOSE 8000

ENTRYPOINT [ "python3" ]

CMD [ "server.py" ]

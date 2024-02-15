FROM ghcr.io/baosystems/postgis:16-3.4

RUN apt-get update && \
    apt-get install -y git make gcc postgresql-server-dev-all

RUN git clone https://github.com/eulerto/wal2json.git && \
    cd wal2json && \
    USE_PGXS=1 make && \
    USE_PGXS=1 make install

RUN git clone https://github.com/fboulnois/pg_uuidv7.git && \
    cd pg_uuidv7 && \
    USE_PGXS=1 make && \
    USE_PGXS=1 make install

RUN apt-get remove -y git make gcc && \
    apt-get autoremove -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /wal2json /pg_uuidv7

COPY ./postgresql.conf /etc/postgresql/postgresql.conf
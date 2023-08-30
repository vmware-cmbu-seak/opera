FROM postgres:latest
COPY opera.sql /opera.sql
COPY guacamole.sql /guacamole.sql
COPY opera.sh /docker-entrypoint-initdb.d/
RUN chmod 755 /docker-entrypoint-initdb.d/opera.sh
ENV POSTGRES_PASSWORD="Opera1!"
ENV USERNAME="opera"
ENV SERVICE_MODULE="psql"
#!/bin/bash
set -e

# Init Opera Portal Environment
psql -v ON_ERROR_STOP=1 --username postgres <<-EOSQL
	CREATE USER $USERNAME PASSWORD '$POSTGRES_PASSWORD' SUPERUSER;
	CREATE DATABASE opera OWNER $USERNAME;
	CREATE DATABASE guacamole OWNER $USERNAME;
	COMMIT;
EOSQL

# Init Opera Database
psql -v ON_ERROR_STOP=1 --username postgres --dbname opera -f /opera.sql

# Init Guacamole Database
psql -v ON_ERROR_STOP=1 --username postgres --dbname guacamole -f /guacamole.sql

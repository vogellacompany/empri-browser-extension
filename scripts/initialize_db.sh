#!/usr/bin/env bash

if ! [ -x "$(command -v psql)" ]; then
  sudo apt-get install -yq postgresql postgresql-contrib
fi


sudo -u postgres /usr/bin/env bash << 'EOF'
USERNAME='empri'
DATABASES=('empri-study-backend')
if ! [ "$(psql -tAc "SELECT 1 FROM pg_user WHERE usename = '$USERNAME'")" = '1' ]; then
  echo "CREATING POSTGRESQL USER $USERNAME"
  createuser $USERNAME --pwprompt
fi
for DB_NAME in $DATABASES; do
  if ! [ "$(psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'")" = '1' ]; then
    createdb -O $USERNAME $DB_NAME
  fi
done
EOF


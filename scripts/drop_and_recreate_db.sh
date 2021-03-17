#!/usr/bin/env bash

# !!! CAUTION: THIS WILL DELETE THE DATABASE AND RECREATE IT IN AN EMPTY STATE !!!

sudo -u postgres /bin/bash << EOF
dropdb 'empri-study-backend'
createdb -O empri empri-study-backend
EOF


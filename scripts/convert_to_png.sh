#!/usr/bin/env bash

SIZES="16 32 48 96 128 19 38"

for SIZE in $SIZES
do
  inkscape -w $SIZE -h $SIZE $1.svg --export-png $1-$SIZE.png
done

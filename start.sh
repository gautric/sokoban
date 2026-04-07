#!/bin/bash
URL="http://localhost:8080"
pgrep -x firefox > /dev/null || firefox "$URL" &
python3 -m http.server 8080

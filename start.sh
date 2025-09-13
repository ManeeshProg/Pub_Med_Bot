#!/bin/bash

# Start Python servers
python -m uvicorn chatbot_api:app --host 0.0.0.0 --port 8002 &
python -m uvicorn pubmed_advanced_api_only:app --host 0.0.0.0 --port 8000 &


# Start Node server
node server.js &

# Start Vite dev server
npm run dev -- --host

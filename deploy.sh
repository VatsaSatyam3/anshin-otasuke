#!/bin/bash

# Cloud Run Deployment Script for Hackathon
# Automatically retrieves active GCP project and deploys to Tokyo region

SERVICE_NAME="anshin-otasuke-agent"
REGION="asia-northeast1" # Tokyo region

# Retrieve active GCP project
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)

if [ -z "$PROJECT_ID" ]; then
  echo "Error: No active GCP project configured. Run 'gcloud config set project <PROJECT_ID>' first."
  exit 1
fi

echo "=========================================================="
echo "Project ID : $PROJECT_ID"
echo "Service    : $SERVICE_NAME"
echo "Region     : $REGION"
echo "=========================================================="

echo "Building container image using Google Cloud Build..."
gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME

echo "Deploying container to Google Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --set-env-vars GEMINI_API_KEY=$GEMINI_API_KEY,LINE_CHANNEL_SECRET=$LINE_CHANNEL_SECRET,LINE_CHANNEL_ACCESS_TOKEN=$LINE_CHANNEL_ACCESS_TOKEN

echo "=========================================================="
echo "Deployment Complete!"
echo "=========================================================="

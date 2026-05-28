#!/usr/bin/env bash
set -euo pipefail

ACR_NAME="${ACR_NAME:-kavim}"
ACR_LOGIN_SERVER="${ACR_LOGIN_SERVER:-kavim.azurecr.io}"
AKS_RESOURCE_GROUP="${AKS_RESOURCE_GROUP:-kavim}"
AKS_CLUSTER="${AKS_CLUSTER:-kavimCluster}"
NAMESPACE="${NAMESPACE:-kavim}"

BACKEND_IMAGE="${ACR_LOGIN_SERVER}/flone-backend:latest"
FRONTEND_IMAGE="${ACR_LOGIN_SERVER}/kavim-frontend:latest"

function echo_header() {
  echo
  echo "=============================="
  echo " $1"
  echo "=============================="
}

function usage() {
  cat <<EOF
Usage: ./deploy.sh [--skip-build] [--skip-push] [--deploy-aci]

This script builds and pushes the backend and frontend Docker images, then
applies the Kubernetes manifests to AKS.

Environment variables:
  ACR_NAME            Azure Container Registry name (default: kavim)
  ACR_LOGIN_SERVER    ACR login server (default: kavim.azurecr.io)
  AKS_RESOURCE_GROUP  AKS resource group (default: kavim)
  AKS_CLUSTER         AKS cluster name (default: kavimCluster)
  NAMESPACE           Kubernetes namespace (default: kavim)
  ACR_USERNAME        ACR username (for ACI deployment)
  ACR_PASSWORD        ACR password (for ACI deployment)

Options:
  --skip-build        Skip Docker image builds.
  --skip-push         Skip pushing images to ACR.
  --deploy-aci        Deploy frontend to Azure Container Instances.
  --help              Show this message.
EOF
}

SKIP_BUILD=false
SKIP_PUSH=false
DEPLOY_ACI=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-build)
      SKIP_BUILD=true
      shift
      ;;
    --skip-push)
      SKIP_PUSH=true
      shift
      ;;
    --deploy-aci)
      DEPLOY_ACI=true
      shift
      ;;
    --help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      usage
      exit 1
      ;;
  esac
done

if [[ "$SKIP_BUILD" = false ]]; then
  echo_header "Logging into Azure Container Registry"
  az acr login --name "$ACR_NAME"

  echo_header "Building backend image"
  docker build --platform linux/amd64 -t "$BACKEND_IMAGE" ./flone-backend

  echo_header "Building frontend image"
  docker build --platform linux/amd64 -t "$FRONTEND_IMAGE" ./kavim-frontend
fi

if [[ "$SKIP_PUSH" = false ]]; then
  echo_header "Pushing backend image to ACR"
  docker push "$BACKEND_IMAGE"

  echo_header "Pushing frontend image to ACR"
  docker push "$FRONTEND_IMAGE"
fi

echo_header "Fetching AKS credentials"
az aks get-credentials --name "$AKS_CLUSTER" --resource-group "$AKS_RESOURCE_GROUP" --overwrite-existing

echo_header "Applying Kubernetes manifests"
kubectl apply -f k8s/

echo_header "Restarting backend deployment"
kubectl rollout restart deployment/flone-backend -n "$NAMESPACE"

echo_header "Restarting frontend deployment(s)"
set +e
kubectl rollout restart deployment/kavim-frontend -n "$NAMESPACE"
kubectl rollout restart deployment/flone-frontend -n "$NAMESPACE"
set -e

echo_header "Deployment complete"
kubectl get svc -n "$NAMESPACE"
kubectl get deployment -n "$NAMESPACE"

if [[ "$DEPLOY_ACI" = true ]]; then
  ACR_USERNAME="${ACR_USERNAME:-kavim}"
  ACR_PASSWORD="${ACR_PASSWORD:-}"

  if [[ -z "$ACR_PASSWORD" ]]; then
    echo_header "Fetching ACR credentials"
    ACR_PASSWORD=$(az acr credential show --resource-group "$AKS_RESOURCE_GROUP" --name "$ACR_NAME" --query "passwords[0].value" -o tsv)
  fi

  echo_header "Deploying frontend to Azure Container Instances"
  az container create \
    --resource-group "$AKS_RESOURCE_GROUP" \
    --name kavim-frontend-aci \
    --image "$FRONTEND_IMAGE" \
    --registry-login-server "$ACR_LOGIN_SERVER" \
    --registry-username "$ACR_USERNAME" \
    --registry-password "$ACR_PASSWORD" \
    --os-type Linux \
    --cpu 1 \
    --memory 1 \
    --ports 80 \
    --dns-name-label kavim-frontend \
    --environment-variables REACT_APP_API_URL=/api

  echo_header "ACI deployment complete"
  az container show --resource-group "$AKS_RESOURCE_GROUP" --name kavim-frontend-aci --query ipAddress.fqdn -o tsv
fi

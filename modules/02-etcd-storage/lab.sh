#!/usr/bin/env bash
# Module 2 — etcd & the Storage Layer lab setup
# Idempotent: safe to run multiple times.
set -euo pipefail

CLUSTER_NAME="etcd-lab"
ENV_FILE="/tmp/etcd-lab-env.sh"
ETCD_IMAGE="registry.k8s.io/etcd:3.5.12-0"

# ── Prerequisites check ────────────────────────────────────────────────────────
for cmd in kind kubectl docker etcdctl; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "ERROR: '$cmd' not found. Install it before running this script."
    case "$cmd" in
      kind)     echo "  brew install kind  # or https://kind.sigs.k8s.io/docs/user/quick-start/" ;;
      etcdctl)  echo "  brew install etcd  # installs etcdctl" ;;
    esac
    exit 1
  fi
done

echo "==> All prerequisites found."

# ── Create kind cluster ────────────────────────────────────────────────────────
if kind get clusters 2>/dev/null | grep -q "^${CLUSTER_NAME}$"; then
  echo "==> Cluster '${CLUSTER_NAME}' already exists, skipping creation."
else
  echo "==> Creating kind cluster '${CLUSTER_NAME}'..."
  cat <<EOF | kind create cluster --name "${CLUSTER_NAME}" --config=-
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
  - role: control-plane
    kubeadmConfigPatches:
      - |
        kind: ClusterConfiguration
        etcd:
          local:
            extraArgs:
              # Lower snapshot-count for easier lab observation
              snapshot-count: "100"
              # Enable debug logging for etcd events
              log-level: "info"
EOF
  echo "==> Cluster created."
fi

kubectl cluster-info --context "kind-${CLUSTER_NAME}" >/dev/null

# ── Extract etcd TLS credentials from the control-plane node ──────────────────
echo "==> Extracting etcd credentials..."

CONTROL_PLANE_CONTAINER="${CLUSTER_NAME}-control-plane"

# Copy certs to a temp directory
TMP_CERTS="/tmp/etcd-lab-certs"
mkdir -p "$TMP_CERTS"

docker cp "${CONTROL_PLANE_CONTAINER}:/etc/kubernetes/pki/etcd/ca.crt"     "${TMP_CERTS}/ca.crt"
docker cp "${CONTROL_PLANE_CONTAINER}:/etc/kubernetes/pki/etcd/server.crt" "${TMP_CERTS}/server.crt"
docker cp "${CONTROL_PLANE_CONTAINER}:/etc/kubernetes/pki/etcd/server.key" "${TMP_CERTS}/server.key"

# Get the etcd endpoint (the node's IP inside Docker network)
ETCD_IP=$(docker inspect "${CONTROL_PLANE_CONTAINER}" \
  --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' \
  | head -1)

ETCD_ENDPOINT="https://${ETCD_IP}:2379"

echo "==> etcd endpoint: ${ETCD_ENDPOINT}"

# ── Write env file ─────────────────────────────────────────────────────────────
cat > "${ENV_FILE}" <<EOF
# Source this file: source ${ENV_FILE}
export ETCDCTL_API=3
export ETCDCTL_ENDPOINTS="${ETCD_ENDPOINT}"
export ETCDCTL_CACERT="${TMP_CERTS}/ca.crt"
export ETCDCTL_CERT="${TMP_CERTS}/server.crt"
export ETCDCTL_KEY="${TMP_CERTS}/server.key"
export KUBECONFIG="\$(kind get kubeconfig --name ${CLUSTER_NAME} 2>/dev/null | head -1)"
EOF

# Also export for this shell session
export ETCDCTL_API=3
export ETCDCTL_ENDPOINTS="${ETCD_ENDPOINT}"
export ETCDCTL_CACERT="${TMP_CERTS}/ca.crt"
export ETCDCTL_CERT="${TMP_CERTS}/server.crt"
export ETCDCTL_KEY="${TMP_CERTS}/server.key"

# ── Verify etcd connectivity ───────────────────────────────────────────────────
echo "==> Verifying etcd connectivity..."
etcdctl endpoint status --write-out=table

echo ""
echo "======================================================================"
echo "  Setup complete!"
echo ""
echo "  Source the environment file to get etcdctl credentials:"
echo "    source ${ENV_FILE}"
echo ""
echo "  Quick sanity check:"
echo "    etcdctl endpoint health"
echo "    etcdctl get /registry/pods --prefix --keys-only | head -5"
echo ""
echo "  Cluster context: kind-${CLUSTER_NAME}"
echo "======================================================================"

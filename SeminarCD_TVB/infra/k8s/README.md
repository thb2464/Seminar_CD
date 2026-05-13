# Kubernetes Manifests

Base Kubernetes manifests for the Travel TVB microservices live in `base/`.

```bash
kubectl kustomize infra/k8s/base
```

The base keeps service traffic behind Kong:

- `api-gateway` is the only public Ingress target.
- Downstream services are `ClusterIP` Services.
- Catalog and AI Chatbot include HPAs in the base because they are the planned independently scalable read/AI paths.
- Service Deployments reference placeholder Secret names documented in `base/runtime-secrets.example.yaml`.

Environment namespaces and real secret management are intentionally left for D5.

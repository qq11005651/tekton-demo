# nginx-demo · GitOps 发布仓库

Git 是唯一事实来源：CI 只做构建 + 回填镜像，CD 由 ArgoCD 从 Git 同步。

## 目录结构

```
.
├── tekton/                  # CI：自包含 Task + Pipeline + PipelineRun + Webhook
│   ├── 00-rbac.yaml
│   ├── 01-tasks.yaml
│   ├── 02-pipeline.yaml
│   ├── 03-pipelinerun.yaml
│   └── 04-trigger.yaml
├── k8s/                     # CD：ArgoCD 同步目录
│   ├── services.yaml        # nginx-demo-stable / nginx-demo-canary
│   ├── rollout.yaml         # Argo Rollouts 金丝雀
│   ├── istio-gateway.yaml   # Istio Gateway（nginx-demo.demo.local）
│   ├── virtualservice.yaml
│   └── destinationrule.yaml
├── argocd/application.yaml  # ArgoCD Application（path=k8s）
├── Dockerfile               # FROM nginx:1.15.2
└── index.html
```

## 5 步上线

```bash
# 1) 建仓并推送
git init && git add . && git commit -m "init gitops" && git remote add origin https://github.com/qq11005651/tekton-demo.git && git push -u origin master

# 2) 配置 ArgoCD（Application 指向 Git 的 k8s/ 目录，auto-sync）
kubectl apply -f argocd/application.yaml

# 3) 配置 Tekton（可先在集群安装 tekton-pipelines）
kubectl apply -f tekton/00-rbac.yaml
kubectl apply -f tekton/01-tasks.yaml
kubectl apply -f tekton/02-pipeline.yaml
# Webhook 触发（可选）：暴露 EventListener 后在 GitHub 配置 push webhook
kubectl apply -f tekton/04-trigger.yaml

# 4) 首次部署：触发一次构建（构建 → 推送 → 回填 k8s/rollout.yaml 镜像 → git push）
kubectl create -f tekton/03-pipelinerun.yaml -n default
# ArgoCD 检测到 Git 变更后自动同步，Rollout 开始渐进式发布

# 5) 验证
kubectl -n default get rollout nginx-demo -w
kubectl -n default get virtualservice nginx-demo-vs
curl -H "Host: nginx-demo.demo.local" http://<istio-ingressgateway-ip>/
```

## 镜像仓库凭据

构建推送目标为 `hub.podcc.com/test/nginx:1.15.2`，需提前创建 dockerconfigjson 类型的 Secret：

```bash
kubectl -n default create secret generic registry-auth \
  --type=kubernetes.io/dockerconfigjson \
  --from-file=.dockerconfigjson=$HOME/.docker/config.json
```

## Git 回填凭据（CI 更新清单后 push）

`update-manifest` 任务会把新镜像写回 `k8s/rollout.yaml` 并 git push。
PipelineRun 会从可选 Secret `git-credentials`（key: `token`）注入 token：

```bash
kubectl -n default create secret generic git-credentials --from-literal=token=<GIT_TOKEN>
```

未提供时回退为集群默认凭据（匿名 push 通常会被拒绝）。

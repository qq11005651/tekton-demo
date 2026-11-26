# nodejs-demo · GitOps 发布仓库（Tekton CI + ArgoCD CD + Argo Rollouts）

Git 是唯一事实来源：CI 只做测试 → 构建 → Cosign 签名 → 回写镜像 tag，CD 由 ArgoCD 从 Git 同步。

## 流程

```
[Git Push 代码] ──▶ [Tekton EventListener] ──▶ [CI Pipeline: 测试 → 构建 → Cosign 签名 → 推送]
                                                                    │
[Prometheus 监控] ◀── [Argo Rollouts 金丝雀切流] ◀── [ArgoCD 同步] ◀── [自动提交新 Tag 至 GitOps 仓库]
```

## 命名空间

| 版本 | 命名空间 | 角色 |
|---|---|---|
| v1 | srseo1369340781408857 | 主命名空间（承接线上流量） |
| v2 | srseo8162672730379150 | 重构命名空间（与 v1 二选一切流） |
| v3 | srseo2311761993048152 | 重构命名空间（与 v1 二选一切流） |

金丝雀只允许 v1↔v2 或 v1↔v3，同一时刻只有一个重构命名空间权重非零。

## 目录

```
app/                  Node.js 源码 + Dockerfile
gitops/base/          Rollout / Service / AnalysisTemplate
gitops/overlays/<ns>/ kustomization + ingress（主 / 金丝雀）
tekton/               RBAC / Tasks / Pipeline / Trigger
argocd/               ApplicationSet
```

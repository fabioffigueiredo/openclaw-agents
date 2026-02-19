---
name: mlops-pipeline
description: Boas práticas de MLOps — treinamento, versionamento de modelos, deploy de ML, monitoramento de drift, pipelines de dados e feature stores.
triggers:
  - mlops
  - machine learning
  - modelo
  - treinamento
  - training
  - deploy de modelo
  - model serving
  - feature store
  - data pipeline
  - drift
  - experiment tracking
  - mlflow
  - wandb
  - kubeflow
  - bentoml
  - rag
  - fine-tuning
  - embeddings
  - vetor
  - vector database
---

# MLOps Pipeline

## Objetivo
Implementar e gerenciar pipelines de Machine Learning em produção, cobrindo todo o ciclo: dados → treinamento → avaliação → deploy → monitoramento → retraining.

## Contexto necessário
- Tipo de modelo (classificação, NLP, visão, LLM, recomendação)
- Framework (PyTorch, TensorFlow, scikit-learn, HuggingFace)
- Infraestrutura (local, cloud, GPU)
- Estágio atual (exploração, staging, produção)

## Fluxo (inspect → plan → consent → apply → verify → audit)

1. **INSPECT**: Analisar pipeline existente, dados, modelos e infra
2. **PLAN**: Propor arquitetura MLOps com componentes necessários
3. **CONSENT**: Confirmar custos de compute e storage
4. **APPLY**: Implementar/modificar pipeline
5. **VERIFY**: Validar métricas, latência, throughput
6. **AUDIT**: Registrar experimentos, versões e decisões

## Capacidades

### 📊 Experiment Tracking
- MLflow: experiments, runs, parâmetros, métricas, artefatos
- Weights & Biases (W&B): tracking, sweeps, reports
- Comparação entre runs e reprodutibilidade

### 📦 Versionamento de Modelos e Dados
- DVC: versionamento de datasets grandes
- MLflow Model Registry: staging → production
- Git LFS para artefatos pesados
- Hashes de datasets para reprodutibilidade

### 🔄 Pipelines de Treinamento
- Orquestração: Airflow, Prefect, Kubeflow Pipelines
- Feature engineering automatizado
- Validação de dados (Great Expectations, Pandera)
- Hyperparameter tuning (Optuna, Ray Tune)

### 🚀 Model Serving
- APIs REST/gRPC: FastAPI + ONNX, TorchServe, TF Serving
- BentoML: empacotamento e deploy de modelos
- Serverless: AWS Lambda + SageMaker, GCP Cloud Functions
- Edge: ONNX Runtime, TensorFlow Lite

### 🔍 Monitoramento em Produção
- Data drift detection (Evidently, NannyML)
- Model performance monitoring (accuracy decay)
- Latência e throughput (P50, P95, P99)
- Alertas para retraining automático

### 🧠 LLM Ops (RAG, Fine-tuning, Agents)
- RAG pipelines: embeddings → vector DB → retrieval → generation
- Vector databases: Qdrant, ChromaDB, Pinecone, Weaviate
- Fine-tuning: LoRA, QLoRA, em GPUs de consumo
- Avaliação de LLMs: BLEU, ROUGE, human eval, LLM-as-judge
- Guardrails: content filtering, prompt injection detection

## Checklists

### Antes de treinar
- [ ] Dados validados (schema, distribuição, missing values)
- [ ] Split reprodutível (train/val/test com seed fixa)
- [ ] Baseline definido (modelo simples para comparação)
- [ ] Métricas de avaliação escolhidas e documentadas
- [ ] Experiment tracking configurado

### Antes de deploy
- [ ] Modelo versionado com metadados (hash, métricas, dataset)
- [ ] Testes de integração (input → output esperado)
- [ ] Benchmark de latência e throughput
- [ ] Fallback definido (modelo anterior ou regra heurística)
- [ ] Monitoramento de drift configurado

### Em produção
- [ ] Alertas para degradação de performance
- [ ] Pipeline de retraining automatizado ou semi-automático
- [ ] A/B testing ou shadow mode para novos modelos
- [ ] Logs de predições para auditoria e debugging
- [ ] Custo de compute monitorado

## Regras de segurança
- ✅ Dados sensíveis devem ser anonimizados/mascarados antes de treinar
- ✅ Modelos devem ser escaneados para bias antes de deploy
- ✅ API keys de provedores de LLM devem usar secret management
- ❌ Nunca expor endpoints de model serving sem autenticação
- ❌ Nunca treinar com dados de produção sem aprovação de compliance

# Federated Small Language Models for Personalized and Interpretable Women's Health Support

🌐 **Project website:** https://malithi-gif.github.io/Federated_SLM_Women_Health/
📄 **Paper:** [docs/paper.pdf](docs/paper.pdf) (preprint, under review)

This repository accompanies the paper *"Federated Small Language Models for Personalized and Interpretable Women's Health Support."*

We fine-tune two small language models (SLMs), **Qwen2.5-3B-Instruct** and **Phi-3-mini-Instruct**, with **federated LoRA**. The models predict the menstrual cycle phase (menstrual, follicular, fertility or luteal) and generate short, personalized natural-language feedback grounded in each record's features. Each participant is treated as a client. Only the lightweight LoRA adapters are exchanged and averaged (FedAvg), and raw health records stay local during training.

---

## How it works

The pipeline has five stages:

1. **Client partitioning.** Each participant is one federated client. 15 clients are split at the subject level into 10 for training, 2 for validation and 3 for testing, so all of a participant's records fall into one split.
2. **Feature-to-text.** Each record (hormones LH, estrogen and PdG, flow, symptoms, lifestyle) is written as a short `key: value` text summary. The phase label and client ID are removed from the input.
3. **Chat-style prompt.** Every example becomes a *system / user / assistant* conversation. The assistant turn is the training target:
   ```
   Predicted Phase: <Menstrual | Follicular | Fertility | Luteal>
   Feedback: <2 to 4 sentences grounded in the reported features>
   ```
   A real example is in [`Qwen2_5-3B-Instruct/sample_train_records.json`](Qwen2_5-3B-Instruct/sample_train_records.json).
4. **Federated LoRA fine-tuning.** The base model stays frozen. A LoRA adapter (rank 16, alpha 32, dropout 0.05, on the `q/k/v/o/gate/up/down` projection layers) is trained on each client. The server averages the adapters, weighted by each client's number of samples (FedAvg). The best adapter by validation loss is saved.
5. **Inference.** The saved adapter is attached to the base model. For each test record the model generates the phase and the feedback, and both are parsed from the output.

## Repository contents

| Path | What it contains |
|---|---|
| `Qwen2_5-3B-Instruct/best_adapter/` | Trained LoRA adapter for Qwen2.5-3B (config, weights, tokenizer, chat template) |
| `Qwen2_5-3B-Instruct/metrics.csv`, `classification_report.txt`, `confusion_matrix.csv` | Test-set evaluation for Qwen2.5-3B |
| `Qwen2_5-3B-Instruct/training_history.csv` | Training and validation loss per round |
| `Qwen2_5-3B-Instruct/test_predictions.csv` | Per-record predicted phase and generated feedback |
| `phi35mini_federated_outputs/` | Predictions, metrics, feedback and plots for the Phi-mini model |
| `confusion_matix.ipynb` | Notebook that draws the confusion-matrix figure |
| `docs/` | Project website, served by GitHub Pages |

The adapter weights (`*.safetensors`) are stored with **Git LFS**. Install it before cloning so you get the real files rather than small pointer files:

```bash
git lfs install
git clone https://github.com/Malithi-gif/Federated_SLM_Women_Health.git
```

## Requirements

- **Python 3.10**
- **An NVIDIA GPU** is recommended. The paper's experiments ran on a workstation with 90 GB RAM, and inference used about 6–7.5 GB of GPU memory.

| Library | Used for |
|---|---|
| `torch` | Model training and inference |
| `transformers` | Qwen2.5 / Phi-3 models and tokenizers |
| `peft` (0.19.0) | LoRA adapters |
| `accelerate` | Device placement (`device_map="auto"`) |
| `safetensors` | Loading adapter weights |
| `pandas`, `numpy` | Data handling |
| `scikit-learn` | Accuracy, macro F1 and weighted F1, confusion matrix |
| `matplotlib` | Figures |
| `psutil` | CPU and RAM measurements during inference |
| `jupyter` | Running the notebook |

Install everything with:

```bash
pip install -r requirements.txt
```

## Quick start: run the trained Qwen adapter

```python
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel

BASE = "Qwen/Qwen2.5-3B-Instruct"
ADAPTER = "Qwen2_5-3B-Instruct/best_adapter"

tokenizer = AutoTokenizer.from_pretrained(ADAPTER)
model = AutoModelForCausalLM.from_pretrained(BASE, torch_dtype=torch.bfloat16, device_map="auto")
model = PeftModel.from_pretrained(model, ADAPTER)
model.eval()

system = (
    "You are a women's health assistant. Given the reported features, predict the most likely "
    "menstrual cycle phase and provide brief supportive feedback. Choose exactly one phase from: "
    "Menstrual, Follicular, Fertility, Luteal. Output exactly in this format:\n"
    "Predicted Phase: <one phase>\nFeedback: <2 to 4 sentences>"
)
user = (
    "Health features:\n"
    "lh: 2.300\nestrogen: 164.400\npdg: 16.400\n"
    "flow volume: not_reported\nflow color: not_reported\n"
    "cramps: not_reported\nsorebreasts: Moderate\nbloating: Low\n"
    "fatigue: not_reported\nsleepissue: not_reported\nmoodswing: Low\n"
    "\nPredict the phase and provide feedback."
)

messages = [{"role": "system", "content": system}, {"role": "user", "content": user}]
inputs = tokenizer.apply_chat_template(messages, add_generation_prompt=True, return_tensors="pt").to(model.device)

with torch.no_grad():
    output = model.generate(inputs, max_new_tokens=120, do_sample=False)

print(tokenizer.decode(output[0][inputs.shape[-1]:], skip_special_tokens=True))
```

The symptom values above are illustrative. The training records use the full feature list shown in `sample_train_records.json`, and inputs work best when they follow that format.

## Results reported in the paper

| Metric | Qwen2.5-3B-Instruct | Phi-3-mini-Instruct |
|---|---|---|
| Accuracy | **0.8394** | 0.8251 |
| Macro F1 | **0.8179** | 0.8032 |
| Weighted F1 | **0.8349** | 0.8210 |
| CPU usage (%) | 97.9 ± 1.3 | 95.1 ± 1.8 |
| Process RAM (GB) | 1.56 ± 0.05 | **1.46 ± 0.00** |
| System RAM (%) | **65.8 ± 0.5** | 71.5 ± 6.6 |

On a workstation, phase prediction takes about 1–2 s per record and feedback generation about 5–8.5 s.

## Data access

The [mcPHASES](https://doi.org/10.13026/zx6a-2c81) dataset (5,659 records from 42 participants) is available on PhysioNet under restricted access. Access requires registration and agreement to the dataset's data-use terms.

## Code availability

The full federated training code will be released upon acceptance.

## Citation

```bibtex
@article{fedslm_womenshealth_2026,
  title   = {Federated small language models for personalized and
             interpretable women's health support},
  author  = {Anonymous},
  journal = {Preprint, under review},
  year    = {2026}
}
```

Please also cite the dataset:

> Lin, B., Li, J. Y., Kalani, K., Truong, K., & Mariakakis, A. (2025). *mcPHASES: A Dataset of Physiological, Hormonal, and Self-reported Events and Symptoms for Menstrual Health Tracking with Wearables* (v1.0.0). PhysioNet. https://doi.org/10.13026/zx6a-2c81

## Disclaimer

This is research software. The generated feedback is not medical advice and is not a substitute for a clinician.

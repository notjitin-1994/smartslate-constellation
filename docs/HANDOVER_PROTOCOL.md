# 🛰️ Polaris-to-Constellation Handover Protocol (PCHP)

## 1. Protocol Objective
The PCHP defines the high-fidelity data bridge between **Polaris (Strategy)** and **Constellation (Architecture)**. It ensures that strategic intent is translated into a machine-executable **Universal Learning Schema (ULS)** without loss of pedagogical nuance.

## 2. Data Transmission Specification
*   **Primary Source:** `supabase.public.blueprint_generator`
*   **Key Payload:** `blueprint_json`
*   **Trigger:** Status transition from `completed` (Polaris) to `architecting` (Constellation).

## 3. Semantic Mapping & Translation
Constellation MUST map Polaris data points to the following ULS internal structures:

| Polaris Data Point (`blueprint_json`) | Constellation ULS Target | Pedagogical Translation |
| :--- | :--- | :--- |
| `learning_objectives.objectives` | `NeuralNodes.objectives` | Bloom's Level → Cognitive Load Weighting |
| `content_outline.modules` | `NeuralNodes.sequence` | Strategic Modules → Sequential Architecture Nodes |
| `instructional_strategy.modalities` | `ExecutionSchema.modalityMap` | Descriptive strategy → Multi-modal build orders |
| `target_audience.demographics` | `ContextGuardrails.persona` | Roles/Experience → Complexity Scaffolding Level |

## 4. The Universal Learning Schema (ULS) Structure
The ULS is a machine-readable JSON object produced by Constellation for **Nova** consumption:

```json
{
  "uls_version": "1.0-GLA",
  "meta": {
    "polaris_id": "UUID",
    "strategy_alignment": "HIGH"
  },
  "pedagogical_model": "Merrill_First_Principles",
  "architecture_nodes": [
    {
      "node_id": "NODE_01",
      "mode": "ACTIVATION",
      "cognitive_verb": "ANALYZE",
      "scaffolding": "MEDIUM",
      "instructional_script": {
        "visual_treatment": "SPLIT_SCREEN_SIM",
        "narration": "...",
        "on_screen_text": "..."
      },
      "asset_grounding": ["SOP_REF_01", "MANUAL_CHUNK_04"]
    }
  ],
  "guardrails": {
    "max_cognitive_load": 7,
    "reading_level": "Technical_Professional"
  }
}
```

## 5. Error & Integrity Protocol
1.  **Validation Check:** If `blueprint_json` is missing `content_outline`, Constellation must trigger "Emergency Strategy Synthesis."
2.  **Schema Enforcement:** Constellation will not commit the handover if the **Cognitive Load Guardrail (CLG)** score exceeds 8.5/10 for a single node.
3.  **Gap Flagging:** If `blueprint_json` contains objectives with NO corresponding ingested assets, the ULS must flag these as "Synthetic Content Generation Required."

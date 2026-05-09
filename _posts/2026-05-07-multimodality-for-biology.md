---
lang: en
layout: post
title: Multimodality for Biology
date: 2026-05-07
author: Chunzhuo Zhang; Claude Code (rephrasing)
description: Three approaches — bottom-up, parallel, and uniform — for fusing biological modalities, and where I think the field should go.
tags: ["machine learning", "biology", "multimodality", "single-cell", "foundation-models"]
categories: research-notes
thumbnail: assets/img/posts/multimodality-for-biology/image9.png
featured: false
---

In single-cell and broader computational biology, "multimodality" comes in many flavors — DNA sequence, RNA expression, chromatin accessibility, protein levels, perturbation responses, knowledge graphs, text. The hard part is rarely listing the modalities; it is choosing how to fuse them.

These are notes from a recent talk where I tried to organize the landscape into three approaches: **bottom-up**, **parallel**, and **uniform**. Each makes a different bet about where biological structure lives and where modalities should meet inside the model.

## Multimodality tasks

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/posts/multimodality-for-biology/image1.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>

Before fixing on an architecture it helps to be explicit about the tasks we want a multimodal biological model to do — cross-modal prediction, perturbation response, cell-state inference, sequence-to-function, and so on. Different tasks pull architecture in different directions, and the rest of this post only makes sense relative to what we are asking the model to predict.

## Bottom-up approach

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/posts/multimodality-for-biology/image2.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/posts/multimodality-for-biology/image3.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>

The bottom-up approach builds representations along the natural hierarchy of biology: **molecular → cellular → multicellular**. UCE-style models learn cell embeddings from gene-level tokens; models like PULSAR push further toward tissue- and multicellular-level structure. Each tier is trained on what is plentiful at that scale, and the next tier inherits its substrate from below.

The advantage is that each level is interpretable on its own terms and can be pretrained independently. The cost is that errors and biases compound as you climb the hierarchy.

### From sequence to perturbation

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/posts/multimodality-for-biology/image4.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>

A concrete instance of the bottom-up program: start from genomic sequence and train representations that transfer downstream to perturbation prediction. The chain is *sequence → expression → response*, and the architectural question is at which level multimodal signals should enter.

## Parallel approach

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/posts/multimodality-for-biology/image5.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>

The parallel approach treats modalities as roughly co-equal and combines per-modality embeddings at the input. A canonical case: take a DNA sequence and seven epigenetic tracks, embed each independently, and **directly sum the eight embeddings**. Everything downstream sees a single fused vector.

This is cheap, easy to scale modality-by-modality, and trivial to extend with a new track. The price is that direct summation assumes all modalities live in the same metric space — which is rarely true biologically.

### Separate encoder per modality

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/posts/multimodality-for-biology/image6.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>

A more careful variant: keep one encoder per modality and fuse later. Each encoder can use whatever tokenization and inductive bias suits its data type, and fusion happens through concatenation, cross-attention, or gating — no longer at the input.

### Different knowledge sources

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/posts/multimodality-for-biology/image7.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>

Beyond raw signals, multimodal can mean fusing different *kinds* of knowledge: an LLM for textual context, a knowledge graph for curated relations, tabular features for engineered priors. Two pooling strategies show up repeatedly:

- **Global pooling** — a weighted average of source embeddings.
- **Attention-based pooling** — let the query decide which source matters.

The latter usually wins when the relevance of each source varies across examples.

## Uniform approach

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/posts/multimodality-for-biology/image8.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>

The uniform approach goes the other direction from per-modality encoders: serialize multiple sequences into a single stream and let one model digest them all. Sequence-related tasks (DNA, RNA, protein) are a natural fit — they already share a token-stream shape.

The simplicity is appealing — one model, one loss, no fusion module. The hard part is teaching a single model to respect the very different statistics of, say, codon usage versus regulatory motifs.

## Relational transformer for biology

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/posts/multimodality-for-biology/image9.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>

The architecture I am most interested in is a **relational transformer**: instead of forcing modalities through a single fusion bottleneck, represent biological entities (genes, cells, regions) as nodes and let attention range over typed relations between them.

### Details

Two attention patterns carry most of the weight:

- **Relational attention** — for *complementary* modalities, where each modality contributes information the others do not. Attention selects across modalities at each layer.
- **Hierarchical attention** — for *hierarchical* modalities, where the structure itself is nested (region → gene → cell → tissue). Attention is constrained by that hierarchy.

Two open problems I keep running into:

- **Memory constraint.** Cross-modality attention is quadratic in token count, and biological inputs are long.
- **Coupling-data constraint.** Training relational attention requires examples where modalities are observed together, and truly paired multimodal datasets at scale are still rare.

These are the bottlenecks I think the next round of work — mine and others' — needs to address.

## References

1. {% reference liang2024foundations --file multimodality_for_biology %}
2. {% reference rosen2023uce --file multimodality_for_biology %}
3. {% reference pang2025pulsar --file multimodality_for_biology %}
4. {% reference fu2026strand --file multimodality_for_biology %}
5. {% reference yang2024multimodal --file multimodality_for_biology %}
6. {% reference yang2023genecompass --file multimodality_for_biology %}
7. {% reference littman2025presage --file multimodality_for_biology %}
8. {% reference golkar2026mimic --file multimodality_for_biology %}
9. {% reference ranjan2025relational --file multimodality_for_biology %}

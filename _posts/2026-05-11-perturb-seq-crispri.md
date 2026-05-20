---
lang: en
layout: post
title: "Single-cell Perturb-seq CRISPRi"
date: 2026-05-11
post_author: Chunzhuo Zhang
description: "An interactive visual explanation of how CRISPRi perturbations are linked to single-cell transcriptomes."
tags: ["biology", "single-cell", "CRISPRi", "Perturb-seq", "functional-genomics"]
categories: research-notes
permalink: /blog/2026/perturb-seq-crispri/
featured: false
_styles: |
  .perturbseq-crispri-viewer {
    --ps-blue: #2f6fbd;
    --ps-cyan: #2daecb;
    --ps-green: #3b9467;
    --ps-gold: #d39b2c;
    --ps-red: #c85c5c;
    --ps-purple: #7d62b8;
    --ps-ink: var(--global-text-color);
    --ps-muted: var(--global-text-color-light);
    --ps-border: var(--global-divider-color);
    background: var(--global-bg-color);
    border: 1px solid var(--ps-border);
    border-radius: 8px;
    margin: 1.5rem 0 2rem;
    overflow: hidden;
  }

  .perturbseq-toolbar {
    align-items: center;
    border-bottom: 1px solid var(--ps-border);
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: space-between;
    padding: 0.75rem;
  }

  .perturbseq-focus-buttons,
  .perturbseq-zoom-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  .perturbseq-crispri-viewer button {
    background: transparent;
    border: 1px solid var(--ps-border);
    border-radius: 6px;
    color: var(--ps-ink);
    cursor: pointer;
    font-size: 0.82rem;
    line-height: 1;
    min-height: 2rem;
    padding: 0.45rem 0.65rem;
  }

  .perturbseq-crispri-viewer button:hover,
  .perturbseq-crispri-viewer button.is-active {
    border-color: var(--global-theme-color);
    color: var(--global-theme-color);
  }

  .perturbseq-zoom-status {
    color: var(--ps-muted);
    font-size: 0.82rem;
    min-width: 3rem;
    text-align: center;
  }

  .perturbseq-canvas-wrap {
    background:
      radial-gradient(circle at 28% 22%, color-mix(in srgb, var(--ps-cyan) 10%, transparent), transparent 30%),
      linear-gradient(90deg, color-mix(in srgb, var(--ps-border) 38%, transparent) 1px, transparent 1px),
      linear-gradient(color-mix(in srgb, var(--ps-border) 38%, transparent) 1px, transparent 1px);
    background-size: auto, 44px 44px, 44px 44px;
  }

  .perturbseq-svg {
    cursor: grab;
    display: block;
    height: min(72vh, 680px);
    min-height: 460px;
    touch-action: none;
    width: 100%;
  }

  .perturbseq-crispri-viewer.is-dragging .perturbseq-svg {
    cursor: grabbing;
  }

  .perturbseq-three-stage {
    cursor: grab;
    height: min(72vh, 680px);
    min-height: 460px;
    position: relative;
    touch-action: none;
    width: 100%;
  }

  .perturbseq-crispri-viewer.is-dragging .perturbseq-three-stage {
    cursor: grabbing;
  }

  .perturbseq-three-canvas {
    display: block;
    height: 100%;
    width: 100%;
  }

  .perturbseq-three-hint {
    bottom: 0.75rem;
    color: var(--ps-muted);
    font-size: 0.78rem;
    left: 0.85rem;
    pointer-events: none;
    position: absolute;
  }

  .perturbseq-svg {
    display: none;
  }

  .perturbseq-title {
    fill: var(--ps-ink);
    font-size: 22px;
    font-weight: 700;
  }

  .perturbseq-label {
    fill: var(--ps-ink);
    font-size: 14px;
    font-weight: 600;
  }

  .perturbseq-small {
    fill: var(--ps-muted);
    font-size: 11px;
  }

  .perturbseq-cell-body {
    fill: color-mix(in srgb, var(--ps-cyan) 14%, var(--global-bg-color));
    stroke: var(--ps-cyan);
    stroke-width: 4;
  }

  .perturbseq-cytoplasm-texture {
    fill: none;
    opacity: 0.22;
    stroke: var(--ps-cyan);
    stroke-linecap: round;
    stroke-width: 2;
  }

  .perturbseq-nucleus {
    fill: color-mix(in srgb, var(--ps-blue) 13%, var(--global-bg-color));
    stroke: var(--ps-blue);
    stroke-width: 3;
  }

  .perturbseq-nucleolus {
    fill: color-mix(in srgb, var(--ps-purple) 18%, var(--global-bg-color));
    stroke: var(--ps-purple);
    stroke-width: 2;
  }

  .perturbseq-organelle {
    fill: color-mix(in srgb, var(--global-bg-color) 86%, var(--ps-gold));
    stroke: color-mix(in srgb, var(--ps-gold) 75%, #000);
    stroke-width: 2;
  }

  .perturbseq-mito {
    fill: color-mix(in srgb, var(--ps-red) 14%, var(--global-bg-color));
    stroke: var(--ps-red);
    stroke-width: 2;
  }

  .perturbseq-er {
    fill: none;
    stroke: var(--ps-green);
    stroke-linecap: round;
    stroke-width: 5;
  }

  .perturbseq-dna {
    fill: none;
    stroke: var(--ps-blue);
    stroke-linecap: round;
    stroke-width: 7;
  }

  .perturbseq-sgrna {
    fill: none;
    stroke: var(--ps-green);
    stroke-linecap: round;
    stroke-width: 4;
  }

  .perturbseq-cas9 {
    fill: var(--ps-blue);
    opacity: 0.92;
    stroke: color-mix(in srgb, var(--ps-blue) 65%, #000);
    stroke-width: 2;
  }

  .perturbseq-krab {
    fill: var(--ps-purple);
    stroke: color-mix(in srgb, var(--ps-purple) 65%, #000);
    stroke-width: 2;
  }

  .perturbseq-rnap {
    fill: var(--ps-gold);
    stroke: color-mix(in srgb, var(--ps-gold) 65%, #000);
    stroke-width: 2;
  }

  .perturbseq-transcript {
    fill: none;
    stroke: var(--ps-muted);
    stroke-linecap: round;
    stroke-width: 4;
  }

  .perturbseq-target-transcript {
    opacity: 0.35;
    stroke: var(--ps-red);
  }

  .perturbseq-guide-dot {
    animation: perturbseq-drift 6s ease-in-out infinite;
    fill: var(--ps-green);
  }

  .perturbseq-pulse {
    animation: perturbseq-pulse 2.4s ease-in-out infinite;
    transform-box: fill-box;
    transform-origin: center;
  }

  .perturbseq-detail-medium,
  .perturbseq-detail-high {
    opacity: 0;
    pointer-events: none;
    transition: opacity 180ms ease;
  }

  .perturbseq-crispri-viewer[data-zoom="inside"] .perturbseq-detail-medium,
  .perturbseq-crispri-viewer[data-zoom="deep"] .perturbseq-detail-medium,
  .perturbseq-crispri-viewer[data-zoom="deep"] .perturbseq-detail-high {
    opacity: 1;
  }

  .perturbseq-callout {
    fill: color-mix(in srgb, var(--global-bg-color) 90%, var(--ps-blue));
    stroke: var(--ps-border);
    stroke-width: 1.5;
  }

  .perturbseq-info {
    border-top: 1px solid var(--ps-border);
    padding: 0.85rem 1rem 1rem;
  }

  .perturbseq-focus-label {
    color: var(--global-theme-color);
    font-weight: 700;
    margin-bottom: 0.25rem;
  }

  .perturbseq-focus-text {
    color: var(--ps-muted);
    margin: 0;
  }

  @keyframes perturbseq-pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }

  @keyframes perturbseq-drift {
    0%, 100% { transform: translate(0, 0); }
    50% { transform: translate(8px, -5px); }
  }

  @media (max-width: 640px) {
    .perturbseq-svg {
      height: 560px;
      min-height: 560px;
    }

    .perturbseq-three-stage {
      height: 560px;
      min-height: 560px;
    }

    .perturbseq-toolbar {
      align-items: stretch;
      flex-direction: column;
    }
  }
---

CRISPRi is a useful perturbation because it behaves like a dimmer switch: the guide RNA brings a catalytically inactive Cas9 repressor to a regulatory region, and transcription drops without making a DNA double-strand break. Perturb-seq adds a pooled single-cell readout, so each cell carries both a perturbation identity and a transcriptome.

The interactive view below uses chromatin organization as the biological context for target accessibility. It follows one chromatin region from a semi-transparent nucleus into a chromosome territory, then lets the same loop resolve into a beads-on-a-string nucleosome fiber, connected nucleosomes with continuous double-helix linker DNA, the CRISPRi complex bound to a target DNA segment, and finally the RNA readout observed after repression.

<div class="perturbseq-crispri-viewer" data-zoom="whole">
  <div class="perturbseq-toolbar" aria-label="Chromatin organization controls">
    <div class="perturbseq-focus-buttons">
      <button type="button" data-focus-target="nucleus">Nucleus</button>
      <button type="button" data-focus-target="territory">Territory</button>
      <button type="button" data-focus-target="loops">Loops</button>
      <button type="button" data-focus-target="fiber">Fiber</button>
      <button type="button" data-focus-target="nucleosome">Nucleosome</button>
      <button type="button" data-focus-target="crispri">CRISPRi</button>
      <button type="button" data-focus-target="readout">RNA readout</button>
    </div>
    <div class="perturbseq-zoom-controls">
      <button type="button" data-zoom-action="out">-</button>
      <button type="button" data-zoom-action="in">+</button>
      <button type="button" data-zoom-action="reset">Reset view</button>
      <span class="perturbseq-zoom-status">100%</span>
    </div>
  </div>

  <div class="perturbseq-canvas-wrap">
    <div class="perturbseq-three-stage" role="img" aria-label="Rotatable 3D scientific animation of eukaryotic chromatin organization from nucleus to CRISPRi and RNA readout">
      <canvas class="perturbseq-three-canvas"></canvas>
      <div class="perturbseq-three-hint">Drag to rotate · Scroll to zoom</div>
    </div>
  </div>

  <div class="perturbseq-info">
    <div class="perturbseq-focus-label">Semi-transparent nucleus</div>
    <p class="perturbseq-focus-text">A transparent eukaryotic nucleus contains diffuse chromosome territories rather than condensed X-shaped chromosomes.</p>
  </div>
</div>

<script src="{{ '/assets/js/perturbseq-crispri.js' | relative_url | bust_file_cache }}"></script>

## What the experiment measures

The key output is not only whether a target gene went down. The useful object is a table where every row is a single cell, every cell has a guide assignment, and every column is a measured gene. That lets us ask whether perturbing one regulator shifts cells toward another state, suppresses a pathway, changes response to stimulation, or creates a subtle expression program that would be invisible in a bulk assay.

## Why CRISPRi fits this readout

CRISPRi is especially useful when complete knockout is too harsh or when multiple perturbations would create too many DNA breaks. Because it represses transcription through dCas9-KRAB rather than cutting DNA, it can be paired with pooled single-cell screens where the phenotype is a transcriptome, not just growth.

## Minimal protocol logic

1. Build or obtain a cell line expressing CRISPRi machinery.
2. Introduce a pooled sgRNA library at controlled multiplicity.
3. Select and culture cells long enough for repression.
4. Capture single cells and prepare transcriptome plus guide libraries.
5. Sequence, assign guides to cells, and quantify expression.
6. Compare each perturbation against controls and visualize response programs.

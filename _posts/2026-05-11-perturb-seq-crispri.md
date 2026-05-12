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

  .perturbseq-target-window {
    fill: color-mix(in srgb, var(--ps-gold) 18%, transparent);
    stroke: var(--ps-gold);
    stroke-dasharray: 7 5;
    stroke-width: 2;
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

The interactive view below is one continuous 3D cell, not a sequence of separate plots. Drag the cell to rotate it, scroll to zoom, or use the focus buttons to inspect the open sgRNA target sequence and the transcript/guide readout.

<div class="perturbseq-crispri-viewer" data-zoom="whole">
  <div class="perturbseq-toolbar" aria-label="Perturb-seq CRISPRi controls">
    <div class="perturbseq-focus-buttons">
      <button type="button" data-focus-target="cell">Whole cell</button>
      <button type="button" data-focus-target="binding">Open target</button>
      <button type="button" data-focus-target="readout">Readout</button>
    </div>
    <div class="perturbseq-zoom-controls">
      <button type="button" data-zoom-action="out">-</button>
      <button type="button" data-zoom-action="in">+</button>
      <button type="button" data-zoom-action="reset">Reset view</button>
      <span class="perturbseq-zoom-status">100%</span>
    </div>
  </div>

  <div class="perturbseq-canvas-wrap">
    <div class="perturbseq-three-stage" role="img" aria-label="Rotatable 3D cell view of Perturb-seq CRISPRi with organelles and sgRNA target binding">
      <canvas class="perturbseq-three-canvas"></canvas>
      <div class="perturbseq-three-hint">Drag to rotate · Scroll to zoom</div>
    </div>
    <svg class="perturbseq-svg" viewBox="0 0 1000 700" role="img" aria-label="Zoomable whole-cell view of Perturb-seq CRISPRi with organelles and sgRNA target binding">
      <defs>
        <marker id="perturbseq-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor"></path>
        </marker>
      </defs>

      <g class="perturbseq-viewport">
        <text class="perturbseq-title" x="34" y="44">Single-cell Perturb-seq CRISPRi</text>
        <text class="perturbseq-small" x="34" y="66">A single perturbed cell with zoomable organelles, CRISPRi target binding, transcripts, and guide identity.</text>

        <path class="perturbseq-cell-body" d="M135 348 C132 212 232 120 378 96 C560 65 775 126 857 266 C935 399 867 556 707 618 C554 678 329 636 219 531 C162 476 136 420 135 348 Z"></path>
        <path class="perturbseq-cytoplasm-texture" d="M222 236 C312 198 380 194 468 218 M678 182 C756 226 796 290 796 360 M232 520 C325 564 464 580 592 558 M716 508 C774 472 814 418 816 348"></path>

        <g aria-label="nucleus">
          <ellipse class="perturbseq-nucleus perturbseq-pulse" cx="455" cy="315" rx="205" ry="150"></ellipse>
          <ellipse class="perturbseq-nucleolus" cx="374" cy="360" rx="48" ry="35"></ellipse>
          <path class="perturbseq-dna" d="M306 292 C356 238 430 334 482 283 S596 256 625 323"></path>
          <path class="perturbseq-dna" d="M302 335 C366 386 421 283 488 346 S590 394 636 338" opacity="0.72"></path>
          <rect class="perturbseq-target-window perturbseq-pulse" x="430" y="244" width="142" height="72" rx="10"></rect>
          <text class="perturbseq-label" x="356" y="187">nucleus</text>
          <text class="perturbseq-small perturbseq-detail-medium" x="315" y="405">nucleolus</text>
        </g>

        <g aria-label="CRISPRi binding site">
          <path class="perturbseq-dna perturbseq-detail-high" d="M442 278 C468 259 493 302 520 279 S552 268 567 287"></path>
          <circle class="perturbseq-cas9 perturbseq-pulse" cx="492" cy="282" r="18"></circle>
          <rect class="perturbseq-krab perturbseq-pulse" x="504" y="252" width="42" height="24" rx="8"></rect>
          <path class="perturbseq-sgrna perturbseq-pulse" d="M461 294 C474 319 506 320 519 297"></path>
          <path class="perturbseq-sgrna perturbseq-detail-high" d="M467 309 q8 12 16 0 q8 -12 16 0 q8 12 16 0"></path>
          <rect class="perturbseq-rnap" x="558" y="305" width="62" height="30" rx="15"></rect>
          <path class="perturbseq-transcript perturbseq-target-transcript" d="M620 321 C648 322 674 332 698 352"></path>
          <path class="perturbseq-transcript perturbseq-detail-high" d="M621 321 q10 -10 20 0 q10 10 20 0 q10 -10 20 0"></path>
          <text class="perturbseq-label perturbseq-detail-medium" x="518" y="238">dCas9-KRAB</text>
          <text class="perturbseq-small perturbseq-detail-high" x="425" y="333">sgRNA pairs with target sequence</text>
          <text class="perturbseq-small perturbseq-detail-high" x="586" y="354">reduced nascent transcript</text>
        </g>

        <g aria-label="endoplasmic reticulum">
          <path class="perturbseq-er" d="M614 262 C705 246 766 278 775 346 C784 415 724 450 646 430"></path>
          <path class="perturbseq-er" d="M622 298 C695 291 734 316 736 358 C738 400 699 413 648 398" opacity="0.7"></path>
          <text class="perturbseq-small perturbseq-detail-medium" x="720" y="248">ER</text>
        </g>

        <g aria-label="mitochondria">
          <ellipse class="perturbseq-mito" cx="255" cy="270" rx="62" ry="28" transform="rotate(-22 255 270)"></ellipse>
          <path class="perturbseq-detail-medium" d="M214 278 C238 248 258 294 296 260" fill="none" stroke="var(--ps-red)" stroke-linecap="round" stroke-width="2"></path>
          <ellipse class="perturbseq-mito" cx="730" cy="486" rx="68" ry="30" transform="rotate(18 730 486)"></ellipse>
          <path class="perturbseq-detail-medium" d="M684 478 C713 513 737 456 779 496" fill="none" stroke="var(--ps-red)" stroke-linecap="round" stroke-width="2"></path>
          <text class="perturbseq-small perturbseq-detail-medium" x="198" y="224">mitochondrion</text>
        </g>

        <g aria-label="golgi and vesicles">
          <path class="perturbseq-organelle" d="M286 472 C340 438 392 448 431 488 C380 480 336 488 286 472 Z"></path>
          <path class="perturbseq-organelle" d="M296 502 C344 482 389 489 422 518 C372 516 332 519 296 502 Z" opacity="0.75"></path>
          <circle class="perturbseq-organelle" cx="452" cy="517" r="13"></circle>
          <circle class="perturbseq-organelle" cx="478" cy="496" r="9"></circle>
          <text class="perturbseq-small perturbseq-detail-medium" x="320" y="548">Golgi / vesicles</text>
        </g>

        <g aria-label="transcripts and guide molecules">
          <path class="perturbseq-transcript" d="M610 464 C655 445 680 471 715 455"></path>
          <path class="perturbseq-transcript" d="M535 518 C578 500 622 535 660 509"></path>
          <path class="perturbseq-transcript perturbseq-target-transcript" d="M608 390 C636 405 660 396 682 418"></path>
          <circle class="perturbseq-guide-dot" cx="592" cy="494" r="9"></circle>
          <circle class="perturbseq-guide-dot" cx="629" cy="536" r="7" style="animation-delay: -1.2s;"></circle>
          <text class="perturbseq-small perturbseq-detail-medium" x="612" y="576">guide identity + transcriptome stay linked to this cell</text>
        </g>

        <g aria-label="single-cell capture barcode">
          <rect class="perturbseq-callout" x="715" y="84" width="220" height="88" rx="8"></rect>
          <text class="perturbseq-label" x="734" y="114">Perturb-seq readout</text>
          <text class="perturbseq-small" x="734" y="138">cell barcode + UMI</text>
          <text class="perturbseq-small" x="734" y="156">mRNA reads + guide tag</text>
          <path d="M720 174 C690 235 684 326 680 416" fill="none" stroke="var(--ps-muted)" stroke-dasharray="7 7" stroke-linecap="round" stroke-width="2" marker-end="url(#perturbseq-arrow)"></path>
        </g>

        <g class="perturbseq-detail-high" aria-label="zoom labels">
          <rect class="perturbseq-callout" x="334" y="116" width="230" height="56" rx="8"></rect>
          <text class="perturbseq-small" x="350" y="140">Zoom depth reveals the molecular site:</text>
          <text class="perturbseq-small" x="350" y="158">sgRNA-dCas9-KRAB at target DNA/TSS</text>
        </g>
      </g>
    </svg>

  </div>

  <div class="perturbseq-info">
    <div class="perturbseq-focus-label">Whole cell</div>
    <p class="perturbseq-focus-text">One perturbed cell remains in view: membrane, nucleus, organelles, sgRNA cargo, mRNA molecules, and capture barcode are all part of the same scene.</p>
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

---
lang: en
layout: post
title: "Tonsil Human Atlas"
date: 2026-05-29
post_author: Chunzhuo Zhang
description: "Notes on antigen-presenting cells, follicular dendritic cells, and CD4 T follicular helper cell specification in a tonsil human atlas."
tags: ["biology", "tonsil", "human-atlas", "single-cell", "immunology"]
categories: research-notes
thumbnail: assets/img/posts/tonsil-human-atlas/apc-fdc-antigen.png
permalink: /blog/2026/tonsil-human-atlas/
featured: false
---

## Definitions

<mark style="background:#ffd54f">Note: italic words indicate genes; uppercase words with + or - indicate surface protein.</mark>

### 1. Antigen presenting cells (APC) <---- antigen ---> Follicular Dendritic Cell (FDC)

<div class="row mt-3">
  <div class="col-sm mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/posts/tonsil-human-atlas/apc-fdc-antigen.png" class="img-fluid rounded z-depth-1" zoomable=true %}
  </div>
</div>

### 2. CD4 T follicular and non-follicular cell fate decision

CD4 T follicular helper cell (Tfh) differentiation:

- BCL6 is the master transcription factor.
- PRDM1 is absent.

### Tfh specification

1. Beginning: naive CD4 T cells are activated by antigen-presenting DCs.
   Naive CD4 T cell markers: *LEF1*, *CCR7*, CD62L+, CD45RA+.
2. CD4 T cells differentiate into central memory (CM) CD4 T cells.
   This state has decreased CCR7 expression and is CD45RO+, CD127+.

Central memory CD4 T cells split into two subpopulations:

- CM pre-Tfh cells: increased follicular marker genes.
- CM pre-non-Tfh cells: increased *ANXA1*, *S100A4*, and *ITGB1* (CM markers).

Activation by DCs upregulates BCL6, which induces CXCR5 (chemokine receptor), represses CCR7, and supports migration of pre-Tfh cells to the border of B cell follicles.

Tfh-lightzone-GC (Tfh-LZ-GC) upregulates IL21, an inducer for early GC Tfh differentiation.

<div class="row mt-3">
  <div class="col-sm mt-3 mt-md-0">
    {% include figure.liquid loading="lazy" path="assets/img/posts/tonsil-human-atlas/tfh-specification.png" class="img-fluid rounded z-depth-1" zoomable=true %}
  </div>
</div>

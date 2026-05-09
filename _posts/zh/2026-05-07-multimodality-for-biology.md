---
lang: zh
layout: post
title: 生物学中的多模态融合
date: 2026-05-07
author: Chunzhuo Zhang; Claude Code (rephrasing)
description: 三种生物模态融合方法：自底向上、并行、统一，以及我对该领域走向的思考。
tags: ["machine learning", "biology", "multimodality", "single-cell", "foundation-models"]
categories: research-notes
thumbnail: assets/img/posts/multimodality-for-biology/image9.png
featured: false
---

在单细胞和更广义的计算生物学中，“多模态”可以指很多类型的数据：DNA 序列、RNA 表达、染色质可及性、蛋白质水平、扰动响应、知识图谱、文本等。真正困难的地方通常不是列出有哪些模态，而是决定如何把它们融合起来。

这篇文章整理自最近一次报告的笔记。我尝试把相关方法概括为三类：**自底向上**、**并行**和**统一**。三类方法对“生物结构在哪里体现”以及“不同模态应该在模型的哪个位置相遇”给出了不同答案。

## 多模态任务

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/posts/multimodality-for-biology/image1.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>

在确定模型架构之前，首先要明确我们希望多模态生物模型完成什么任务，例如跨模态预测、扰动响应预测、细胞状态推断、序列到功能预测等。不同任务会把模型架构推向不同方向。本文后面的讨论，只有放在具体预测目标的背景下才有意义。

## 自底向上方法

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/posts/multimodality-for-biology/image2.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/posts/multimodality-for-biology/image3.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>

自底向上的方法沿着生物学的自然层级构建表示：**分子 -> 细胞 -> 多细胞系统**。类似 UCE 的模型从基因级 token 中学习细胞嵌入；PULSAR 等模型进一步走向组织和多细胞层面的结构。每一层都在该尺度上最丰富的数据上训练，下一层则继承来自下层的表示基础。

这种方法的优势是每个层级都有相对清晰的生物学解释，并且可以独立预训练。代价是，随着层级向上推进，误差和偏差也可能逐层累积。

### 从序列到扰动

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/posts/multimodality-for-biology/image4.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>

自底向上路线的一个具体例子是：从基因组序列出发，训练可以迁移到扰动预测任务的表示。这个链条可以概括为 *序列 -> 表达 -> 响应*。架构上的关键问题是：多模态信号应该在哪一个层级进入模型。

## 并行方法

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/posts/multimodality-for-biology/image5.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>

并行方法把不同模态视为大致平等的输入，并在输入阶段组合每个模态的嵌入。一个典型例子是：给定一段 DNA 序列和七条表观遗传轨迹，分别对每个模态做嵌入，然后**直接把八个嵌入相加**。后续模型看到的是一个已经融合好的向量。

这种方法成本低、容易按模态扩展，也很容易加入新的轨迹。问题在于，直接相加默认所有模态都处在同一个度量空间中，而这在生物学上往往并不成立。

### 每个模态使用独立编码器

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/posts/multimodality-for-biology/image6.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>

一种更谨慎的变体是：为每个模态保留独立编码器，并在更后面的阶段进行融合。每个编码器可以采用适合自身数据类型的 tokenization 和归纳偏置，融合则通过拼接、交叉注意力或门控机制完成，而不是在输入端直接相加。

### 不同知识来源

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/posts/multimodality-for-biology/image7.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>

除了原始信号，多模态也可以表示不同*类型*的知识融合：用 LLM 提供文本上下文，用知识图谱提供人工整理的关系，用表格特征提供工程化先验。两种 pooling 策略反复出现：

- **全局 pooling**：对不同来源的嵌入做加权平均。
- **基于注意力的 pooling**：让 query 决定哪些来源更重要。

当每个来源的重要性会随样本变化时，后者通常更有效。

## 统一方法

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/posts/multimodality-for-biology/image8.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>

统一方法走的是与“每个模态一个编码器”相反的方向：把多个序列串联成一个统一的 token 流，然后交给同一个模型处理。与序列相关的任务，例如 DNA、RNA、蛋白质，天然适合这种形式，因为它们本来就共享 token 序列的形态。

这种简洁性很有吸引力：一个模型、一个损失函数、不需要额外的融合模块。困难在于，单个模型必须同时理解非常不同的统计规律，例如密码子使用偏好和调控 motif 的差异。

## 面向生物学的关系 Transformer

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/posts/multimodality-for-biology/image9.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>

我目前最感兴趣的架构是**关系 Transformer**：不再把所有模态强行压进单一的融合瓶颈，而是把生物实体（基因、细胞、区域等）表示为节点，并让注意力在带类型的关系上进行计算。

### 细节

其中有两类注意力模式最关键：

- **关系注意力**：用于*互补*模态，即每个模态都提供其他模态没有的信息。模型在每一层跨模态选择信息。
- **层级注意力**：用于*层级化*模态，即结构本身是嵌套的，例如区域 -> 基因 -> 细胞 -> 组织。注意力受到该层级结构约束。

我反复遇到的两个开放问题是：

- **内存约束。** 跨模态注意力随 token 数量呈二次增长，而生物学输入通常很长。
- **配对数据约束。** 训练关系注意力需要多个模态同时被观测到的样本，而真正大规模配对的多模态数据仍然稀缺。

这些瓶颈是我认为下一阶段工作，无论是我自己的还是整个领域的，都需要重点解决的问题。

## 参考文献

1. {% reference liang2024foundations --file multimodality_for_biology %}
2. {% reference rosen2023uce --file multimodality_for_biology %}
3. {% reference pang2025pulsar --file multimodality_for_biology %}
4. {% reference fu2026strand --file multimodality_for_biology %}
5. {% reference yang2024multimodal --file multimodality_for_biology %}
6. {% reference yang2023genecompass --file multimodality_for_biology %}
7. {% reference littman2025presage --file multimodality_for_biology %}
8. {% reference golkar2026mimic --file multimodality_for_biology %}
9. {% reference ranjan2025relational --file multimodality_for_biology %}

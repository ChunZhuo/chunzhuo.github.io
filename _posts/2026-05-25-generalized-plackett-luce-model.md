---
lang: en
layout: post
title: "Generalized Plackett-Luce Model"
date: 2026-05-25
post_author: Chunzhuo Zhang
description: "A concise note on how the generalized Plackett-Luce model extends ranking models beyond complete ordered lists."
tags: ["statistics", "ranking", "choice-models", "machine-learning"]
categories: research-notes
permalink: /blog/2026/generalized-plackett-luce-model/
featured: false
---

The Plackett-Luce model is a probability model for ranked choices. It is useful when the observed data are not just labels, but ordered preferences: candidate A is preferred to candidate B, item 3 is selected before item 7, or one algorithm is ranked above another by a judge.

The core idea is simple. Each item has a positive worth parameter. At each rank position, the next item is selected with probability proportional to its worth among the remaining available items.

Suppose there are items $$1,\ldots,n$$, and item $$i$$ has worth $$w_i > 0$$. For a full ranking

$$
\pi = (\pi_1, \pi_2, \ldots, \pi_n),
$$

the standard Plackett-Luce probability is

$$
P(\pi) =
\prod_{r=1}^{n}
\frac{w_{\pi_r}}{\sum_{s=r}^{n} w_{\pi_s}}.
$$

This says: first choose the top-ranked item from all items, then choose the second-ranked item from the remaining items, and so on.

## Why generalize it?

Real ranking data are rarely clean full rankings. In practice, we often see:

- top-k rankings, where only the first few choices are observed;
- partial rankings, where some items are unranked;
- ties, where multiple items share the same rank;
- grouped choices, where a set is preferred over another set;
- repeated rankings from different users, judges, cells, or contexts;
- covariates that change item worth across samples.

A generalized Plackett-Luce model keeps the sequential choice idea, but relaxes what counts as an observation and how item worth is parameterized.

## Partial rankings

If only the top $$k$$ items are observed, the likelihood stops after rank $$k$$:

$$
P(\pi_1,\ldots,\pi_k) =
\prod_{r=1}^{k}
\frac{w_{\pi_r}}{\sum_{j \in R_r} w_j},
$$

where $$R_r$$ is the set of items still available at step $$r$$.

This is useful because an unranked item is not necessarily worse than every ranked item. It may simply be unobserved.

## Ties and grouped rankings

A common extension allows a rank position to contain a group of tied items. Instead of choosing one item at a time, the model assigns probability to selecting a subset from the remaining items. Different generalized Plackett-Luce formulations handle this differently, but the principle is the same: the model compares the total support for the selected group against the support for alternatives still available.

This is important for data such as surveys, competitions, and biological screens where multiple outcomes may be indistinguishable at the observed resolution.

## Covariate-dependent worth

The item worth can also depend on features:

$$
w_i(x) = \exp(\beta_i^\top x).
$$

Here, the same item can become more or less likely to be chosen depending on context $$x$$. This turns the model from a static ranking model into a conditional ranking model.

For example, if items are genes, perturbations, models, or treatments, their ranking may depend on cell type, condition, dose, or experimental batch.

## Interpretation

The worth parameter $$w_i$$ is not an absolute score. It is relative. Multiplying all worth parameters by the same constant does not change the ranking probabilities. Usually one parameter is fixed or a normalization constraint is used for identifiability.

A larger $$w_i$$ means item $$i$$ is more likely to appear earlier in a ranking, all else equal.

## Summary

The generalized Plackett-Luce model is best thought of as a flexible framework for ranking and choice data. It starts from a sequential selection process and extends it to the messy observations that appear in real applications: incomplete lists, ties, grouped preferences, repeated judges, and context-dependent item worth.

That makes it useful whenever the data answer not only "what happened?" but "what was preferred, selected, or prioritized before what?"

---
layout: page
title: 生活
lang: zh
permalink: /off-hours/
description: 实验室之外的生活。
nav: true
nav_order: 3
display_categories: [hobbies, travel]
horizontal: false
---

<!-- TODO 翻译: 翻译下方介绍段落。卡片内容来自 _projects/ 数据，需要单独翻译。 -->

<div class="row align-items-center mb-4">
  <div class="col-md-7">
    <p>Outside the lab, I play basketball, swim, lift, and pick up the occasional figurine on the way. This page collects short clips and notes from those off-hours.</p>
  </div>
  <div class="col-md-5">
    {% include figure.liquid loading="eager" path="assets/img/off-hours-hero.png" class="img-fluid rounded z-depth-1" zoomable=true %}
  </div>
</div>

<div class="projects">
{% if site.enable_project_categories and page.display_categories %}
  <!-- Display categorized projects -->
  {% for category in page.display_categories %}
  <a id="{{ category }}" href=".#{{ category }}">
    <h2 class="category">{{ category }}</h2>
  </a>
  {% assign categorized_projects = site.projects | where: "category", category %}
  {% assign sorted_projects = categorized_projects | sort: "importance" %}
  <!-- Generate cards for each project -->
  {% if page.horizontal %}
  <div class="container">
    <div class="row row-cols-1 row-cols-md-2">
    {% for project in sorted_projects %}
      {% include projects_horizontal.liquid %}
    {% endfor %}
    </div>
  </div>
  {% else %}
  <div class="row row-cols-1 row-cols-md-3">
    {% for project in sorted_projects %}
      {% include projects.liquid %}
    {% endfor %}
  </div>
  {% endif %}
  {% endfor %}

{% else %}

<!-- Display projects without categories -->

{% assign sorted_projects = site.projects | sort: "importance" %}

  <!-- Generate cards for each project -->

{% if page.horizontal %}

  <div class="container">
    <div class="row row-cols-1 row-cols-md-2">
    {% for project in sorted_projects %}
      {% include projects_horizontal.liquid %}
    {% endfor %}
    </div>
  </div>
  {% else %}
  <div class="row row-cols-1 row-cols-md-3">
    {% for project in sorted_projects %}
      {% include projects.liquid %}
    {% endfor %}
  </div>
  {% endif %}
{% endif %}
</div>

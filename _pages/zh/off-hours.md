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

<div class="row align-items-center mb-4">
  <div class="col-md-7">
    <p>实验室之外，我喜欢打篮球、游泳、健身，也会偶尔收集一些手办。这个页面记录一些工作之外的片段和随笔。</p>
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
    <h2 class="category">
      {% if category == "hobbies" %}兴趣{% elsif category == "travel" %}旅行{% else %}{{ category }}{% endif %}
    </h2>
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

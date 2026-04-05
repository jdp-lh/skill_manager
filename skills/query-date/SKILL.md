---
name: query-date
description: |
  输出指定格式的当前日期或时间字符串。Use when 需要获取当前日期或格式化时间。
  Trigger with "查询日期"、"当前日期"、"格式化日期"。
version: 1.0.0
---

# Query Date

## Overview

输出指定格式的当前日期或时间字符串，方便在其他agent中作为变量引用。

## Inputs

- date — 目标日期，支持 today（当天）、yesterday、具体日期 YYYY-MM-DD，留空默认 today
- format — 输出格式，支持 YYYY MM DD HH mm ss weekday unix iso，留空默认 YYYY-MM-DD

## Steps

- Step 1: 解析 date，将相对日期（today、yesterday）转换为实际日期
- Step 2: 解析 format，按占位符替换规则生成最终字符串
- Step 3: 验证输入格式合法性，非法时返回错误提示

## Output

输出格式化后的日期字符串。

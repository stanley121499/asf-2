#!/usr/bin/env python3
"""Generate Storefront Curated Seed product migration SQL (Agents 03-14)."""

from __future__ import annotations

import json
import os
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
MIGRATIONS = REPO_ROOT / "supabase" / "migrations"
MIGRATIONS_MIRROR = REPO_ROOT / "asf-2-next" / "supabase" / "migrations"
MANIFEST_PATH = Path(__file__).resolve().parent / "manifest.json"

UUID_SUFFIX = "24a8-4f00-8000-0000000000"

BRANDS = {
    "模力": "a3400001-24a8-4f00-8000-000000000001",
    "ASF 工作室": "a3400001-24a8-4f00-8000-000000000002",
    "球场线": "a3400001-24a8-4f00-8000-000000000003",
    "越野型": "a3400001-24a8-4f00-8000-000000000004",
    "柔步": "a3400001-24a8-4f00-8000-000000000005",
    "北径": "a3400001-24a8-4f00-8000-000000000006",
}

TAXONOMY: dict[int, tuple[str, str, str, str, int]] = {
    1: ("a3100001-24a8-4f00-8000-000000000001", "a3200001-24a8-4f00-8000-000000000001", "a3300001-24a8-4f00-8000-000000000001", "跑鞋", 8),
    2: ("a3100001-24a8-4f00-8000-000000000001", "a3200001-24a8-4f00-8000-000000000001", "a3300001-24a8-4f00-8000-000000000002", "板鞋球场", 8),
    3: ("a3100001-24a8-4f00-8000-000000000001", "a3200001-24a8-4f00-8000-000000000002", "a3300001-24a8-4f00-8000-000000000003", "正装皮鞋", 8),
    4: ("a3100001-24a8-4f00-8000-000000000001", "a3200001-24a8-4f00-8000-000000000002", "a3300001-24a8-4f00-8000-000000000004", "男靴", 8),
    5: ("a3100001-24a8-4f00-8000-000000000002", "a3200001-24a8-4f00-8000-000000000003", "a3300001-24a8-4f00-8000-000000000005", "一脚蹬", 8),
    6: ("a3100001-24a8-4f00-8000-000000000002", "a3200001-24a8-4f00-8000-000000000003", "a3300001-24a8-4f00-8000-000000000006", "休闲运动鞋", 8),
    7: ("a3100001-24a8-4f00-8000-000000000002", "a3200001-24a8-4f00-8000-000000000004", "a3300001-24a8-4f00-8000-000000000007", "短靴", 8),
    8: ("a3100001-24a8-4f00-8000-000000000002", "a3200001-24a8-4f00-8000-000000000004", "a3300001-24a8-4f00-8000-000000000008", "时尚高帮", 8),
    9: ("a3100001-24a8-4f00-8000-000000000003", "a3200001-24a8-4f00-8000-000000000005", "a3300001-24a8-4f00-8000-000000000009", "包袋", 4),
    10: ("a3100001-24a8-4f00-8000-000000000003", "a3200001-24a8-4f00-8000-000000000005", "a3300001-24a8-4f00-8000-000000000010", "帽袜", 4),
    11: ("a3100001-24a8-4f00-8000-000000000003", "a3200001-24a8-4f00-8000-000000000006", "a3300001-24a8-4f00-8000-000000000011", "护理套装", 4),
    12: ("a3100001-24a8-4f00-8000-000000000003", "a3200001-24a8-4f00-8000-000000000006", "a3300001-24a8-4f00-8000-000000000012", "腰带与小物", 4),
}

# Removed duplicate CAT02_TAXONOMY — cat_key maps 1:1 to plan category index

HERO_RANK = {
    "dddd0101": 0,
    "dddd0102": 1,
    "dddd0201": 2,
    "dddd0501": 3,
    "dddd0601": 4,
    "dddd0701": 5,
    "dddd0801": 6,
}

CATALOG: dict[int, list[dict]] = {
    1: [
        {"slot": 1, "zh": "云感缓震跑鞋", "brand": "模力", "price": 279, "colors": ["#F5F5F5", "#111111", "#4A6670"]},
        {"slot": 2, "zh": "轻量训练跑鞋", "brand": "ASF 工作室", "price": 259, "colors": ["#111111", "#DC2626", "#FFFFFF"]},
        {"slot": 3, "zh": "公路竞速跑鞋", "brand": "北径", "price": 329, "colors": ["#CAFF00", "#111111", "#FFFFFF"]},
        {"slot": 4, "zh": "日常慢跑鞋", "brand": "柔步", "price": 239, "colors": ["#F5F0E8", "#9CA3AF", "#1E3A5F"]},
        {"slot": 5, "zh": "稳定支撑跑鞋", "brand": "越野型", "price": 299, "colors": ["#365314", "#111111", "#EA580C"]},
        {"slot": 6, "zh": "透气网面跑鞋", "brand": "模力", "price": 249, "colors": ["#FFFFFF", "#99F6E4", "#111111"]},
        {"slot": 7, "zh": "厚底缓震跑鞋", "brand": "ASF 工作室", "price": 289, "colors": ["#6B7280", "#7C3AED", "#FFFFFF"]},
        {"slot": 8, "zh": "城市夜跑反光跑鞋", "brand": "北径", "price": 269, "colors": ["#111111", "#C0C0C0", "#0284C7"]},
    ],
    2: [
        {"slot": 1, "zh": "经典白网球鞋", "brand": "球场线", "price": 199, "colors": ["#FFFFFF", "#111111", "#1E3A5F"]},
        {"slot": 2, "zh": "复古低帮板鞋", "brand": "模力", "price": 219, "colors": ["#FFFFFF", "#111111", "#F5F0E8"]},
        {"slot": 3, "zh": "高帮街头板鞋", "brand": "ASF 工作室", "price": 249, "colors": ["#111111", "#FFFFFF", "#7F1D1D"]},
        {"slot": 4, "zh": "麂皮球场鞋", "brand": "球场线", "price": 269, "colors": ["#92400E", "#FFFFFF", "#6B7280"]},
        {"slot": 5, "zh": "厚底老爹板鞋", "brand": "模力", "price": 259, "colors": ["#E5E7EB", "#111111", "#F472B6"]},
        {"slot": 6, "zh": "帆布低帮经典", "brand": "柔步", "price": 149, "colors": ["#FFFFFF", "#1E3A5F", "#D6C6A8"]},
        {"slot": 7, "zh": "联名涂鸦板鞋", "brand": "ASF 工作室", "price": 279, "colors": ["#FFFFFF", "#111111", "#EA580C"]},
        {"slot": 8, "zh": "轻量滑板鞋", "brand": "北径", "price": 229, "colors": ["#111111", "#FFFFFF", "#15803D"]},
    ],
    3: [
        {"slot": 1, "zh": "极简德比皮鞋", "brand": "球场线", "price": 349, "colors": ["#78350F", "#111111", "#A8A29E"]},
        {"slot": 2, "zh": "牛津正装鞋", "brand": "模力", "price": 379, "colors": ["#111111", "#451A03", "#7F1D1D"]},
        {"slot": 3, "zh": "孟克搭扣皮鞋", "brand": "ASF 工作室", "price": 359, "colors": ["#92400E", "#111111", "#D6C6A8"]},
        {"slot": 4, "zh": "便士乐福鞋", "brand": "球场线", "price": 279, "colors": ["#111111", "#78350F", "#14532D"]},
        {"slot": 5, "zh": "布洛克雕花皮鞋", "brand": "模力", "price": 399, "colors": ["#78350F", "#111111", "#CA8A04"]},
        {"slot": 6, "zh": "漆皮晚宴鞋", "brand": "ASF 工作室", "price": 429, "colors": ["#111111", "#7F1D1D", "#FFFFFF"]},
        {"slot": 7, "zh": "软底通勤皮鞋", "brand": "柔步", "price": 319, "colors": ["#111111", "#6B7280", "#78350F"]},
        {"slot": 8, "zh": "双扣孟克鞋", "brand": "北径", "price": 369, "colors": ["#92400E", "#111111", "#4D7C0F"]},
    ],
    4: [
        {"slot": 1, "zh": "切尔西靴", "brand": "越野型", "price": 399, "colors": ["#111111", "#78350F", "#D6C6A8"]},
        {"slot": 2, "zh": "工装马丁靴", "brand": "北径", "price": 379, "colors": ["#111111", "#78350F", "#D4A574"]},
        {"slot": 3, "zh": "沙漠靴", "brand": "模力", "price": 329, "colors": ["#D6C6A8", "#92400E", "#6B7280"]},
        {"slot": 4, "zh": "登山中帮靴", "brand": "越野型", "price": 359, "colors": ["#365314", "#6B7280", "#92400E"]},
        {"slot": 5, "zh": "侧拉链靴", "brand": "ASF 工作室", "price": 389, "colors": ["#111111", "#CA8A04", "#6B7280"]},
        {"slot": 6, "zh": "防水通勤靴", "brand": "北径", "price": 369, "colors": ["#111111", "#14532D", "#78350F"]},
        {"slot": 7, "zh": "绒面 chukka 靴", "brand": "球场线", "price": 339, "colors": ["#92400E", "#6B7280", "#1E3A5F"]},
        {"slot": 8, "zh": "厚底机能靴", "brand": "模力", "price": 349, "colors": ["#111111", "#FFFFFF", "#4D7C0F"]},
    ],
    5: [
        {"slot": 1, "zh": "针织一脚蹬", "brand": "柔步", "price": 179, "colors": ["#FBCFE8", "#9CA3AF", "#111111"]},
        {"slot": 2, "zh": "皮革懒人鞋", "brand": "模力", "price": 219, "colors": ["#111111", "#78350F", "#FFFFFF"]},
        {"slot": 3, "zh": "蝴蝶结平底一脚蹬", "brand": "ASF 工作室", "price": 199, "colors": ["#F5F0E8", "#111111", "#FECDD3"]},
        {"slot": 4, "zh": "乐福式一脚蹬", "brand": "球场线", "price": 249, "colors": ["#111111", "#78350F", "#7F1D1D"]},
        {"slot": 5, "zh": "编织透气一脚蹬", "brand": "柔步", "price": 169, "colors": ["#FFFFFF", "#93C5FD", "#9CA3AF"]},
        {"slot": 6, "zh": "厚底一脚蹬", "brand": "模力", "price": 229, "colors": ["#FFFFFF", "#111111", "#D6C6A8"]},
        {"slot": 7, "zh": "麂皮一脚蹬", "brand": "ASF 工作室", "price": 239, "colors": ["#6B7280", "#92400E", "#14532D"]},
        {"slot": 8, "zh": "极简套脚便鞋", "brand": "北径", "price": 189, "colors": ["#111111", "#FFFFFF", "#D6C6A8"]},
    ],
    6: [
        {"slot": 1, "zh": "厚底老爹鞋", "brand": "模力", "price": 249, "colors": ["#FFFFFF", "#9CA3AF", "#F472B6"]},
        {"slot": 2, "zh": "袜套跑鞋", "brand": "ASF 工作室", "price": 199, "colors": ["#111111", "#FFFFFF", "#7C3AED"]},
        {"slot": 3, "zh": "复古跑鞋", "brand": "柔步", "price": 219, "colors": ["#F5F0E8", "#DC2626", "#2563EB"]},
        {"slot": 4, "zh": "轻量网面休闲鞋", "brand": "北径", "price": 209, "colors": ["#FFFFFF", "#15803D", "#9CA3AF"]},
        {"slot": 5, "zh": "平台休闲鞋", "brand": "模力", "price": 239, "colors": ["#FFFFFF", "#111111", "#D6C6A8"]},
        {"slot": 6, "zh": "拼色休闲鞋", "brand": "ASF 工作室", "price": 229, "colors": ["#FFFFFF", "#111111", "#2563EB"]},
        {"slot": 7, "zh": "缓震步行鞋", "brand": "柔步", "price": 199, "colors": ["#9CA3AF", "#F472B6", "#1E3A5F"]},
        {"slot": 8, "zh": "城市通勤运动鞋", "brand": "球场线", "price": 259, "colors": ["#FFFFFF", "#111111", "#78350F"]},
    ],
    7: [
        {"slot": 1, "zh": "麂皮短靴", "brand": "越野型", "price": 369, "colors": ["#92400E", "#111111", "#6B7280"]},
        {"slot": 2, "zh": "切尔西女靴", "brand": "模力", "price": 349, "colors": ["#111111", "#78350F", "#D6C6A8"]},
        {"slot": 3, "zh": "粗跟短靴", "brand": "ASF 工作室", "price": 329, "colors": ["#111111", "#7F1D1D", "#D6C6A8"]},
        {"slot": 4, "zh": "马丁风短靴", "brand": "北径", "price": 359, "colors": ["#111111", "#78350F", "#FFFFFF"]},
        {"slot": 5, "zh": "方头短靴", "brand": "模力", "price": 339, "colors": ["#111111", "#FFFFFF", "#78350F"]},
        {"slot": 6, "zh": "拉链侧开短靴", "brand": "球场线", "price": 319, "colors": ["#111111", "#6B7280", "#14532D"]},
        {"slot": 7, "zh": "防水短靴", "brand": "越野型", "price": 379, "colors": ["#111111", "#14532D", "#78350F"]},
        {"slot": 8, "zh": "绒里保暖短靴", "brand": "柔步", "price": 299, "colors": ["#92400E", "#111111", "#D6C6A8"]},
    ],
    8: [
        {"slot": 1, "zh": "夜色街头高帮", "brand": "模力", "price": 299, "colors": ["#111111", "#7C3AED", "#FFFFFF"]},
        {"slot": 2, "zh": "帆布高帮", "brand": "ASF 工作室", "price": 189, "colors": ["#FFFFFF", "#111111", "#DC2626"]},
        {"slot": 3, "zh": "厚底高帮", "brand": "模力", "price": 269, "colors": ["#FFFFFF", "#F472B6", "#111111"]},
        {"slot": 4, "zh": "皮革高帮", "brand": "球场线", "price": 289, "colors": ["#111111", "#78350F", "#FFFFFF"]},
        {"slot": 5, "zh": "绑带高帮", "brand": "北径", "price": 249, "colors": ["#6B7280", "#111111", "#15803D"]},
        {"slot": 6, "zh": "平台高帮", "brand": "ASF 工作室", "price": 279, "colors": ["#FFFFFF", "#111111", "#C0C0C0"]},
        {"slot": 7, "zh": "复古篮球高帮", "brand": "模力", "price": 259, "colors": ["#FFFFFF", "#111111", "#2563EB"]},
        {"slot": 8, "zh": "轻量高帮休闲", "brand": "柔步", "price": 219, "colors": ["#F5F0E8", "#9CA3AF", "#1E3A5F"]},
    ],
    9: [
        {"slot": 1, "zh": "迷你斜挎包", "brand": "柔步", "price": 129, "colors": ["#111111", "#78350F"]},
        {"slot": 2, "zh": "托特购物袋", "brand": "模力", "price": 99, "colors": ["#F5F0E8", "#111111"]},
        {"slot": 3, "zh": "双肩通勤包", "brand": "ASF 工作室", "price": 189, "colors": ["#111111", "#1E3A5F"]},
        {"slot": 4, "zh": "皮质手拿包", "brand": "模力", "price": 149, "colors": ["#78350F", "#111111"]},
    ],
    10: [
        {"slot": 1, "zh": "品牌棒球帽", "brand": "模力", "price": 79, "colors": ["#111111", "#F5F0E8", "#1E3A5F"]},
        {"slot": 2, "zh": "船员袜三双装", "brand": "柔步", "price": 39, "colors": ["#FFFFFF", "#9CA3AF", "#111111"]},
        {"slot": 3, "zh": "运动短袜三双装", "brand": "ASF 工作室", "price": 45, "colors": ["#FFFFFF", "#111111", "#2563EB"]},
        {"slot": 4, "zh": "针织冷帽", "brand": "ASF 工作室", "price": 69, "colors": ["#111111", "#6B7280", "#7F1D1D"]},
    ],
    11: [
        {"slot": 1, "zh": "鞋类护理四件套", "brand": "球场线", "price": 59, "colors": ["#FFFFFF"]},
        {"slot": 2, "zh": "麂皮护理套装", "brand": "越野型", "price": 69, "colors": ["#FFFFFF"]},
        {"slot": 3, "zh": "皮革清洁套装", "brand": "模力", "price": 49, "colors": ["#FFFFFF"]},
        {"slot": 4, "zh": "小白鞋清洁套装", "brand": "ASF 工作室", "price": 55, "colors": ["#FFFFFF"]},
    ],
    12: [
        {"slot": 1, "zh": "真皮腰带", "brand": "柔步", "price": 89, "colors": ["#111111", "#78350F"]},
        {"slot": 2, "zh": "编织休闲腰带", "brand": "模力", "price": 79, "colors": ["#1E3A5F", "#78350F"]},
        {"slot": 3, "zh": "鞋拔金属款", "brand": "球场线", "price": 35, "colors": ["#C0C0C0", "#111111"]},
        {"slot": 4, "zh": "鞋带三双装", "brand": "柔步", "price": 29, "colors": ["#FFFFFF", "#111111", "#9CA3AF"]},
    ],
}

# Agent 03 = cat01 … Agent 14 = cat12
def product_uuid(cat_idx: int, slot: int) -> str:
    return f"dddd{cat_idx:02d}{slot:02d}-{UUID_SUFFIX}{slot:02d}"


def product_code(cat_idx: int, slot: int) -> str:
    return f"dddd{cat_idx:02d}{slot:02d}"


def color_uuid(cat_idx: int, slot: int, color_num: int) -> str:
    code = f"{cat_idx:02d}{slot:02d}"
    return f"a350{code}-{UUID_SUFFIX}{color_num:02d}"


def media_uuid(cat_idx: int, slot: int, media_num: int) -> str:
    code = f"{cat_idx:02d}{slot:02d}"
    return f"a360{code}-{UUID_SUFFIX}{media_num:02d}"


def stock_uuid(cat_idx: int, slot: int) -> str:
    code = f"{cat_idx:02d}{slot:02d}"
    return f"a355{code}-{UUID_SUFFIX}01"


def pc_uuid(cat_idx: int, slot: int) -> str:
    code = f"{cat_idx:02d}{slot:02d}"
    return f"a354{code}-{UUID_SUFFIX}01"


def created_at_offset(cat_idx: int, slot: int) -> str:
    code = product_code(cat_idx, slot)
    if code in HERO_RANK:
        hours = HERO_RANK[code]
    else:
        hours = 100 + cat_idx * 10 + (9 - slot)
    return f"NOW() - INTERVAL '{hours} hours'"


def en_name(zh: str, cat_name: str) -> str:
    mapping = {
        "云感缓震跑鞋": "Cloud Cushion Runner",
        "轻量训练跑鞋": "Lightweight Training Runner",
        "公路竞速跑鞋": "Road Racing Runner",
        "日常慢跑鞋": "Daily Jogger",
        "稳定支撑跑鞋": "Stability Support Runner",
        "透气网面跑鞋": "Breathable Mesh Runner",
        "厚底缓震跑鞋": "Max Cushion Runner",
        "城市夜跑反光跑鞋": "City Night Reflective Runner",
        "经典白网球鞋": "Classic White Court Sneaker",
        "复古低帮板鞋": "Retro Low Court Sneaker",
        "高帮街头板鞋": "High-Top Street Sneaker",
        "麂皮球场鞋": "Suede Court Sneaker",
        "厚底老爹板鞋": "Chunky Dad Court Sneaker",
        "帆布低帮经典": "Canvas Low Classic",
        "联名涂鸦板鞋": "Collab Graffiti Sneaker",
        "轻量滑板鞋": "Lightweight Skate Shoe",
        "极简德比皮鞋": "Minimal Derby Dress Shoe",
        "牛津正装鞋": "Oxford Dress Shoe",
        "孟克搭扣皮鞋": "Monk Strap Dress Shoe",
        "便士乐福鞋": "Penny Loafer",
        "布洛克雕花皮鞋": "Brogue Dress Shoe",
        "漆皮晚宴鞋": "Patent Evening Shoe",
        "软底通勤皮鞋": "Soft-Sole Commuter Loafer",
        "双扣孟克鞋": "Double Monk Shoe",
        "切尔西靴": "Chelsea Boot",
        "工装马丁靴": "Utility Combat Boot",
        "沙漠靴": "Desert Boot",
        "登山中帮靴": "Mid Hiking Boot",
        "侧拉链靴": "Side-Zip Boot",
        "防水通勤靴": "Waterproof Commuter Boot",
        "绒面 chukka 靴": "Suede Chukka Boot",
        "厚底机能靴": "Chunky Utility Boot",
        "针织一脚蹬": "Knit Slip-On",
        "皮革懒人鞋": "Leather Loafer Slip-On",
        "蝴蝶结平底一脚蹬": "Bow Flat Slip-On",
        "乐福式一脚蹬": "Penny Slip-On",
        "编织透气一脚蹬": "Woven Breathable Slip-On",
        "厚底一脚蹬": "Platform Slip-On",
        "麂皮一脚蹬": "Suede Slip-On",
        "极简套脚便鞋": "Minimal Easy Slip-On",
        "厚底老爹鞋": "Chunky Dad Sneaker",
        "袜套跑鞋": "Sock-Fit Runner",
        "复古跑鞋": "Retro Runner",
        "轻量网面休闲鞋": "Lightweight Mesh Casual",
        "平台休闲鞋": "Platform Casual Sneaker",
        "拼色休闲鞋": "Color-Block Casual Sneaker",
        "缓震步行鞋": "Cushioned Walking Shoe",
        "城市通勤运动鞋": "City Commuter Sneaker",
        "麂皮短靴": "Suede Ankle Boot",
        "切尔西女靴": "Women's Chelsea Boot",
        "粗跟短靴": "Block-Heel Ankle Boot",
        "马丁风短靴": "Combat Ankle Boot",
        "方头短靴": "Square-Toe Ankle Boot",
        "拉链侧开短靴": "Side-Zip Ankle Boot",
        "防水短靴": "Waterproof Ankle Boot",
        "绒里保暖短靴": "Fleece-Lined Ankle Boot",
        "夜色街头高帮": "Night Street High-Top",
        "帆布高帮": "Canvas High-Top",
        "厚底高帮": "Platform High-Top",
        "皮革高帮": "Leather High-Top",
        "绑带高帮": "Strap High-Top",
        "平台高帮": "Platform High-Top Sneaker",
        "复古篮球高帮": "Retro Basketball High-Top",
        "轻量高帮休闲": "Lightweight High-Top Casual",
        "迷你斜挎包": "Mini Crossbody Bag",
        "托特购物袋": "Tote Shopper Bag",
        "双肩通勤包": "Commuter Backpack",
        "皮质手拿包": "Leather Clutch",
        "品牌棒球帽": "Logo Baseball Cap",
        "船员袜三双装": "Crew Socks 3-Pack",
        "运动短袜三双装": "Sport Ankle Socks 3-Pack",
        "针织冷帽": "Knit Beanie",
        "鞋类护理四件套": "Shoe Care 4-Piece Kit",
        "麂皮护理套装": "Suede Care Kit",
        "皮革清洁套装": "Leather Cleaning Kit",
        "小白鞋清洁套装": "White Sneaker Cleaning Kit",
        "真皮腰带": "Genuine Leather Belt",
        "编织休闲腰带": "Woven Casual Belt",
        "鞋拔金属款": "Metal Shoe Horn",
        "鞋带三双装": "Shoelaces 3-Pack",
    }
    return mapping.get(zh, zh)


def ms_name(zh: str) -> str:
    mapping = {
        "云感缓震跑鞋": "Kasut Larian Cloud Cushion",
        "轻量训练跑鞋": "Kasut Latihan Ringan",
        "经典白网球鞋": "Kasut Gelanggang Putih Klasik",
        "针织一脚蹬": "Slip-On Knit",
        "厚底老爹鞋": "Sneaker Dad Chunky",
        "麂皮短靴": "But Suede Buku Lali",
        "夜色街头高帮": "High-Top Jalanan Malam",
    }
    return mapping.get(zh, en_name(zh, ""))


def description_en(zh: str, cat_name: str) -> str:
    return f"Premium {cat_name.lower()} crafted for everyday comfort and refined Malaysian retail style."


def description_ms(zh: str, cat_name: str) -> str:
    return f"{cat_name} premium untuk gaya harian dan keselesaan."


def get_taxonomy(cat_key: int) -> tuple[str, str, str, str, int]:
    return TAXONOMY[cat_key]


def generate_category_sql(cat_key: int) -> str:
    dept_id, range_id, category_id, cat_name, _ = get_taxonomy(cat_key)
    products = CATALOG[cat_key]
    lines: list[str] = [
        "-- =============================================================================",
        f"-- Expo Customer Storefront Curated Seed — Agent {cat_key + 2:02d} products cat{cat_key:02d}",
        f"-- Category: {cat_name} ({len(products)} SKUs)",
        "-- =============================================================================",
        "",
        "INSERT INTO public.products (",
        "  id, name, price, status, description, brand_id, category_id, department_id, range_id, created_at, updated_at",
        ") VALUES",
    ]

    product_rows: list[str] = []
    for item in products:
        slot = item["slot"]
        pid = product_uuid(cat_key, slot)
        brand_id = BRANDS[item["brand"]]
        ts = created_at_offset(cat_key, slot)
        desc = f"精选{cat_name}，舒适耐穿，日常百搭。"
        product_rows.append(
            f"  ('{pid}', '{item['zh']}', {item['price']}, 'Published', '{desc}', "
            f"'{brand_id}', '{category_id}', '{dept_id}', '{range_id}', {ts}, NOW())"
        )
    lines.append(",\n".join(product_rows))
    lines.append(
        "ON CONFLICT (id) DO UPDATE SET\n"
        "  name = EXCLUDED.name,\n"
        "  price = EXCLUDED.price,\n"
        "  status = EXCLUDED.status,\n"
        "  description = EXCLUDED.description,\n"
        "  brand_id = EXCLUDED.brand_id,\n"
        "  category_id = EXCLUDED.category_id,\n"
        "  department_id = EXCLUDED.department_id,\n"
        "  range_id = EXCLUDED.range_id,\n"
        "  created_at = EXCLUDED.created_at,\n"
        "  deleted_at = NULL,\n"
        "  updated_at = NOW();\n"
    )

    color_rows: list[str] = []
    media_rows: list[str] = []
    for item in products:
        slot = item["slot"]
        pid = product_uuid(cat_key, slot)
        for ci, hex_color in enumerate(item["colors"], start=1):
            cid = color_uuid(cat_key, slot, ci)
            color_rows.append(
                f"  ('{cid}', '{pid}', '{hex_color}', true, NOW(), NOW())"
            )
            mid = media_uuid(cat_key, slot, ci)
            media_rows.append(
                f"  ('{mid}', '{pid}', '', {9 + ci}, '{cid}', NOW(), NOW())"
            )
        fallback_num = len(item["colors"]) + 1
        fallback_id = media_uuid(cat_key, slot, fallback_num)
        media_rows.append(
            f"  ('{fallback_id}', '{pid}', '', 1, NULL, NOW(), NOW())"
        )

    lines.extend([
        "INSERT INTO public.product_colors (id, product_id, color, active, created_at, updated_at) VALUES",
        ",\n".join(color_rows),
        "ON CONFLICT (id) DO UPDATE SET\n"
        "  product_id = EXCLUDED.product_id,\n"
        "  color = EXCLUDED.color,\n"
        "  active = EXCLUDED.active,\n"
        "  deleted_at = NULL,\n"
        "  updated_at = NOW();\n",
        "INSERT INTO public.product_medias (id, product_id, media_url, arrangement, color_id, created_at, updated_at) VALUES",
        ",\n".join(media_rows),
        "ON CONFLICT (id) DO UPDATE SET\n"
        "  product_id = EXCLUDED.product_id,\n"
        "  media_url = EXCLUDED.media_url,\n"
        "  arrangement = EXCLUDED.arrangement,\n"
        "  color_id = EXCLUDED.color_id,\n"
        "  updated_at = NOW();\n",
    ])

    trans_rows: list[str] = []
    for item in products:
        slot = item["slot"]
        pid = product_uuid(cat_key, slot)
        en = en_name(item["zh"], cat_name).replace("'", "''")
        ms = ms_name(item["zh"]).replace("'", "''")
        zh = item["zh"]
        desc_en = description_en(item["zh"], cat_name).replace("'", "''")
        desc_ms = description_ms(item["zh"], cat_name).replace("'", "''")
        trans_rows.append(
            f"  ('{pid}', 'en', '{en}', '{desc_en}')"
        )
        trans_rows.append(
            f"  ('{pid}', 'ms', '{ms}', '{desc_ms}')"
        )

    lines.extend([
        "INSERT INTO public.product_translations (product_id, locale, name, description) VALUES",
        ",\n".join(trans_rows),
        "ON CONFLICT (product_id, locale) DO UPDATE SET\n"
        "  name = EXCLUDED.name,\n"
        "  description = EXCLUDED.description,\n"
        "  updated_at = NOW();\n",
    ])

    pc_rows: list[str] = []
    stock_rows: list[str] = []
    for item in products:
        slot = item["slot"]
        pid = product_uuid(cat_key, slot)
        pc_rows.append(
            f"  ('{pc_uuid(cat_key, slot)}', '{pid}', '{category_id}', NOW(), NOW())"
        )
        stock_rows.append(
            f"  ('{stock_uuid(cat_key, slot)}', '{pid}', NULL, NULL, 25, NOW())"
        )

    lines.extend([
        "INSERT INTO public.product_categories (id, product_id, category_id, created_at, updated_at) VALUES",
        ",\n".join(pc_rows),
        "ON CONFLICT (id) DO UPDATE SET\n"
        "  product_id = EXCLUDED.product_id,\n"
        "  category_id = EXCLUDED.category_id,\n"
        "  updated_at = NOW();\n",
        "INSERT INTO public.product_stock (id, product_id, color_id, size_id, count, created_at) VALUES",
        ",\n".join(stock_rows),
        "ON CONFLICT (id) DO UPDATE SET\n"
        "  product_id = EXCLUDED.product_id,\n"
        "  count = EXCLUDED.count;\n",
    ])

    return "\n".join(lines)


def build_manifest() -> dict:
    manifest: dict = {
        "version": "2026-08-25",
        "products": {},
        "taxonomy": {},
        "posts": {},
        "promotions": {},
    }
    for cat_key, products in CATALOG.items():
        _, _, _, cat_name, _ = get_taxonomy(cat_key)
        for item in products:
            slot = item["slot"]
            pid = product_uuid(cat_key, slot)
            colorways = []
            for ci, hex_color in enumerate(item["colors"], start=1):
                colorways.append({
                    "colorId": color_uuid(cat_key, slot, ci),
                    "hex": hex_color,
                    "url": "",
                    "qc": "pending",
                    "notes": "",
                })
            manifest["products"][pid] = {
                "zh": item["zh"],
                "category": cat_name,
                "colorways": colorways,
                "fallbackUrl": "",
            }
    return manifest


def main() -> None:
    MIGRATIONS.mkdir(parents=True, exist_ok=True)
    MIGRATIONS_MIRROR.mkdir(parents=True, exist_ok=True)

    for cat_key in range(1, 13):
        sql = generate_category_sql(cat_key)
        filename = f"20260825_expo_customer_storefront_curated_products_cat{cat_key:02d}.sql"
        for target in (MIGRATIONS / filename, MIGRATIONS_MIRROR / filename):
            target.write_text(sql, encoding="utf-8")
        print(f"Wrote {filename}")

    manifest = build_manifest()
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {MANIFEST_PATH}")


if __name__ == "__main__":
    main()

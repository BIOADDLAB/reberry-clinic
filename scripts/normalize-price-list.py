#!/usr/bin/env python3
"""Normalize the clinic XLSX price table into Firestore seed JSON."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from collections import OrderedDict
from pathlib import Path
from typing import Any

import openpyxl
from openpyxl.cell.cell import MergedCell


SHEETS = [
    ("보톡스,제모", "botox-hair-removal", "보톡스·제모", [(27, 27)]),
    ("필러", "filler", "필러·실리프팅", [(18, 35)]),
    ("티타늄", "titanium", "티타늄", []),
    ("co2,켈로이드,지분 ", "co2-keloid-contouring", "CO2·켈로이드·지방분해", []),
    ("스킨부스터", "skin-booster", "스킨부스터", []),
    ("문신,바디토닝", "tattoo-body-toning", "문신제거·바디토닝", []),
    ("포텐자,여드름,모공흉터", "potenza-acne-scar", "포텐자·여드름·모공흉터", [(11, 26)]),
    ("리프팅", "lifting", "리프팅", []),
    ("관리", "skin-care", "피부관리", []),
    ("수액", "iv-therapy", "수액·주사", []),
]

PRICE_FIXES = {
    "699,00원": "699,000원",
    "14,9000원": "149,000원",
    "279,00원": "279,000원",
    "199000원": "199,000원",
}
PACKAGE_RE = re.compile(r"pkg|패키지", re.IGNORECASE)
PRICE_RE = re.compile(r"(?:(\(\d+\s*회\))\s*)?(\d[\d,\s]*)\s*원\s*$")
OPTION_ONLY_RE = re.compile(
    r"^(?:\d+(?:\.\d+)?\s*(?:회|cc|u|샷|줄|kj)|\d+\s*/\s*\d+\s*회|"
    r"1회|3회|4회|5회|6회|8회|10회|12회|본원|타원|국산|수입|x)$",
    re.IGNORECASE,
)


def clean(value: Any) -> str:
    if value is None:
        return ""
    return re.sub(r"[ \t]+", " ", str(value).replace("\r", "\n")).strip()


def parse_price(value: Any) -> tuple[int, str] | None:
    if isinstance(value, (int, float)) and value >= 1_000:
        return int(value), ""
    text = clean(value)
    fixed = PRICE_FIXES.get(text.replace(" ", ""), text)
    match = PRICE_RE.fullmatch(fixed)
    if not match:
        return None
    amount = int(re.sub(r"\D", "", match.group(2)))
    prefix = clean(match.group(1))
    return amount, prefix


def stable_id(*parts: str) -> str:
    source = "\0".join(parts)
    return hashlib.sha1(source.encode("utf-8")).hexdigest()[:20]


def merged_context(ws: Any) -> dict[tuple[int, int], tuple[str, str]]:
    result: dict[tuple[int, int], tuple[str, str]] = {}
    for merged_range in ws.merged_cells.ranges:
        anchor = ws.cell(merged_range.min_row, merged_range.min_col)
        value = clean(anchor.value)
        if not value:
            continue
        coordinate = anchor.coordinate
        for row in range(merged_range.min_row, merged_range.max_row + 1):
            for col in range(merged_range.min_col, merged_range.max_col + 1):
                result[(row, col)] = (value, coordinate)
    return result


def context_value(ws: Any, merged: dict[tuple[int, int], tuple[str, str]], row: int, col: int) -> tuple[str, str]:
    if (row, col) in merged:
        return merged[(row, col)]
    cell = ws.cell(row, col)
    return clean(cell.value), cell.coordinate


def excluded(row: int, ranges: list[tuple[int, int]]) -> bool:
    return any(start <= row <= end for start, end in ranges)


def normalize_sheet(ws: Any, category_id: str, category_label: str, excluded_ranges: list[tuple[int, int]]) -> list[dict]:
    merged = merged_context(ws)
    headers: dict[int, str] = {}
    grouped: "OrderedDict[str, dict]" = OrderedDict()
    fallback_by_column: dict[int, str] = {}
    last_single_title: tuple[int, str, str] | None = None

    for row_number in range(1, ws.max_row + 1):
        if excluded(row_number, excluded_ranges):
            continue

        price_cells = []
        for cell in ws[row_number]:
            if isinstance(cell, MergedCell):
                continue
            parsed = parse_price(cell.value)
            if parsed:
                price_cells.append((cell, parsed))

        if not price_cells:
            row_texts = []
            for col in range(1, ws.max_column + 1):
                value, _ = context_value(ws, merged, row_number, col)
                if value and not parse_price(value) and value not in row_texts:
                    row_texts.append(value)
            if len(row_texts) >= 2:
                for col in range(1, ws.max_column + 1):
                    value, _ = context_value(ws, merged, row_number, col)
                    if value and not parse_price(value):
                        headers[col] = value
            elif len(row_texts) == 1:
                value, coordinate = context_value(ws, merged, row_number, 1)
                if not value:
                    for col in range(2, ws.max_column + 1):
                        value, coordinate = context_value(ws, merged, row_number, col)
                        if value:
                            break
                last_single_title = (row_number, value, coordinate)
            continue

        for price_cell, (amount, inline_option) in price_cells:
            left_values: list[tuple[int, str, str]] = []
            seen_content = False
            for col in range(price_cell.column - 1, 0, -1):
                value, coordinate = context_value(ws, merged, row_number, col)
                if not value:
                    if seen_content:
                        break
                    continue
                seen_content = True
                if not parse_price(value):
                    left_values.insert(0, (col, value, coordinate))

            deduped_left: list[tuple[int, str, str]] = []
            for entry in left_values:
                if not any(existing[2] == entry[2] for existing in deduped_left):
                    deduped_left.append(entry)
            left_values = deduped_left

            option_parts: list[str] = []
            name_entry = None
            for entry in reversed(left_values):
                if OPTION_ONLY_RE.fullmatch(entry[1].replace(" ", "")) and name_entry is None:
                    option_parts.insert(0, entry[1])
                    continue
                name_entry = entry
                break

            if name_entry is None:
                all_left_values: list[tuple[int, str, str]] = []
                for col in range(1, price_cell.column):
                    value, coordinate = context_value(ws, merged, row_number, col)
                    if value and not parse_price(value) and not any(entry[2] == coordinate for entry in all_left_values):
                        all_left_values.append((col, value, coordinate))
                name_entry = next(
                    (
                        entry
                        for entry in reversed(all_left_values)
                        if not OPTION_ONLY_RE.fullmatch(entry[1].replace(" ", ""))
                    ),
                    None,
                )

            if name_entry is None:
                previous_title_is_name = (
                    last_single_title
                    and last_single_title[0] == row_number - 1
                    and not OPTION_ONLY_RE.fullmatch(last_single_title[1].replace(" ", ""))
                )
                if previous_title_is_name:
                    name_entry = (1, last_single_title[1], last_single_title[2])
                elif left_values:
                    count_only = re.fullmatch(r"\d+\s*회", left_values[-1][1].replace(" ", ""))
                    fallback_key = fallback_by_column.get(price_cell.column)
                    if count_only and fallback_key and fallback_key in grouped:
                        name_entry = (
                            1,
                            grouped[fallback_key]["name"],
                            grouped[fallback_key]["sourceCell"],
                        )
                    else:
                        name_entry = next(
                            (entry for entry in left_values if entry[1].strip().lower() != "x"),
                            left_values[-1],
                        )
                        option_parts = [part for part in option_parts if part != name_entry[1]]
                else:
                    fallback_key = fallback_by_column.get(price_cell.column)
                    if fallback_key and fallback_key in grouped:
                        name_entry = (
                            1,
                            grouped[fallback_key]["name"],
                            grouped[fallback_key]["sourceCell"],
                        )
                    else:
                        name_entry = (1, f"{category_label} {row_number}행", f"A{row_number}")

            name = name_entry[1]
            name_anchor = name_entry[2]
            if PACKAGE_RE.search(name):
                continue

            if inline_option:
                option_parts.append(inline_option)
            header = headers.get(price_cell.column, "")
            if header and header != name and header not in option_parts:
                option_parts.append(header)
            unique_options = []
            for part in option_parts:
                if part and part.lower() != "x" and part not in unique_options:
                    unique_options.append(part)
            option_label = " · ".join(unique_options) or "기본"

            group_key = f"{category_id}:{name_anchor}"
            if group_key not in grouped:
                grouped[group_key] = {
                    "docId": stable_id(category_id, name_anchor, name),
                    "categoryId": category_id,
                    "section": category_label,
                    "name": name,
                    "description": "",
                    "options": [],
                    "sort": len(grouped),
                    "isPublished": True,
                    "sourceSheet": ws.title.strip(),
                    "sourceCell": name_anchor,
                }
            item = grouped[group_key]
            option_id = stable_id(item["docId"], price_cell.coordinate, option_label)
            if not any(option["id"] == option_id for option in item["options"]):
                item["options"].append(
                    {
                        "id": option_id,
                        "label": option_label,
                        "price": amount,
                        "sourceCell": price_cell.coordinate,
                    }
                )
            fallback_by_column[price_cell.column] = group_key

    return [item for item in grouped.values() if item["options"]]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()

    workbook = openpyxl.load_workbook(args.source, data_only=True)
    now_marker = "xlsx-seed-v1"
    categories = []
    items = []

    for sort, (sheet_name, category_id, label, excluded_ranges) in enumerate(SHEETS):
        ws = workbook[sheet_name]
        categories.append(
            {
                "docId": category_id,
                "label": label,
                "sort": sort,
                "isPublished": True,
                "seedVersion": now_marker,
            }
        )
        sheet_items = normalize_sheet(ws, category_id, label, excluded_ranges)
        for item in sheet_items:
            item["sort"] = len([existing for existing in items if existing["categoryId"] == category_id])
            item["seedVersion"] = now_marker
        items.extend(sheet_items)

    package_hits = [
        item["name"]
        for item in items
        if PACKAGE_RE.search(item["name"]) or PACKAGE_RE.search(item["description"])
    ]
    invalid_prices = [
        (item["name"], option["price"])
        for item in items
        for option in item["options"]
        if not isinstance(option["price"], int) or option["price"] <= 0
    ]
    doc_ids = [item["docId"] for item in items]
    duplicate_ids = len(doc_ids) - len(set(doc_ids))

    if package_hits or invalid_prices or duplicate_ids:
        raise RuntimeError(
            f"validation failed: package_hits={package_hits}, invalid_prices={invalid_prices}, duplicate_ids={duplicate_ids}"
        )

    payload = {
        "version": now_marker,
        "source": args.source.name,
        "categories": categories,
        "items": items,
        "summary": {
            "categoryCount": len(categories),
            "itemCount": len(items),
            "optionCount": sum(len(item["options"]) for item in items),
        },
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(payload["summary"], ensure_ascii=False))


if __name__ == "__main__":
    main()

"""Tiny renderer for Strapi's rich-text `blocks` format.

Strapi v5 stores rich text as a tree of nodes shaped roughly like:
    [{"type": "paragraph", "children": [{"text": "hi"}]}, ...]

We only need plain text for embedding — bullet markers and paragraph breaks
keep the chunks readable in case anyone inspects them in ChromaDB.
"""

from typing import Any


def render_blocks(blocks: Any) -> str:
    if not blocks:
        return ""
    if isinstance(blocks, str):
        return blocks.strip()
    if not isinstance(blocks, list):
        return ""

    lines: list[str] = []
    for node in blocks:
        rendered = _render_node(node)
        if rendered:
            lines.append(rendered)
    return "\n".join(lines).strip()


def _render_node(node: Any) -> str:
    if not isinstance(node, dict):
        return ""
    node_type = node.get("type")
    children = node.get("children") or []

    if node_type in {"paragraph", "heading", "quote"}:
        return _flatten_text(children)
    if node_type == "list":
        marker = "•" if node.get("format") != "ordered" else "1."
        items: list[str] = []
        for index, item in enumerate(children, start=1):
            text = _flatten_text(item.get("children") if isinstance(item, dict) else [])
            if not text:
                continue
            bullet = "1." if marker == "1." else marker
            if marker == "1.":
                bullet = f"{index}."
            items.append(f"{bullet} {text}")
        return "\n".join(items)
    if node_type == "code":
        return _flatten_text(children)
    if node_type == "image":
        return ""
    return _flatten_text(children)


def _flatten_text(children: Any) -> str:
    if not isinstance(children, list):
        return ""
    out: list[str] = []
    for child in children:
        if isinstance(child, str):
            out.append(child)
            continue
        if not isinstance(child, dict):
            continue
        if "text" in child:
            out.append(str(child.get("text", "")))
        elif "children" in child:
            out.append(_flatten_text(child.get("children")))
    return "".join(out).strip()

from typing import Any

from app.scripts.blocks import render_blocks
from app.scripts.index_tours import _format_price, build_chunks, to_vector_documents


def test_render_blocks_handles_string_passthrough() -> None:
    assert render_blocks("hello") == "hello"


def test_render_blocks_returns_empty_when_falsy() -> None:
    assert render_blocks(None) == ""
    assert render_blocks([]) == ""


def test_render_blocks_renders_paragraphs() -> None:
    nodes = [
        {"type": "paragraph", "children": [{"text": "Hello "}, {"text": "world"}]},
        {"type": "paragraph", "children": [{"text": "Second line"}]},
    ]
    assert render_blocks(nodes) == "Hello world\nSecond line"


def test_render_blocks_renders_unordered_list() -> None:
    nodes = [
        {
            "type": "list",
            "format": "unordered",
            "children": [
                {"type": "list-item", "children": [{"text": "Beach"}]},
                {"type": "list-item", "children": [{"text": "Boat"}]},
            ],
        }
    ]
    assert render_blocks(nodes) == "• Beach\n• Boat"


def test_render_blocks_renders_ordered_list() -> None:
    nodes = [
        {
            "type": "list",
            "format": "ordered",
            "children": [
                {"type": "list-item", "children": [{"text": "Day 1"}]},
                {"type": "list-item", "children": [{"text": "Day 2"}]},
            ],
        }
    ]
    assert render_blocks(nodes) == "1. Day 1\n2. Day 2"


def test_format_price_returns_vnd_with_dot_thousands() -> None:
    assert _format_price(2_500_000) == "2.500.000 VND"


def test_format_price_returns_none_for_invalid_or_zero() -> None:
    assert _format_price(None) is None
    assert _format_price(0) is None
    assert _format_price("not-a-number") is None


def _tour_fixture() -> dict[str, Any]:
    return {
        "id": 42,
        "attributes": {
            "Tour_Name": "Hue Imperial City",
            "slug": "hue-imperial-city",
            "Short_Description": "Walk the citadels.",
            "Location": "Hue",
            "Region": "MienTrung",
            "Price": 2_500_000,
            "Duration_Days": 3,
            "Duration_Nights": 2,
            "Rating": 4.8,
            "Description": [
                {"type": "paragraph", "children": [{"text": "A historic capital."}]},
            ],
            "Highlights": [
                {"Title": "Citadel", "Description": "Imperial enclosure walk."},
                {"Title": "Cuisine"},
            ],
            "Itinerary": [
                {"type": "paragraph", "children": [{"text": "Day 1: Arrival."}]},
                {"type": "paragraph", "children": [{"text": "Day 2: Tour."}]},
            ],
        },
    }


def test_build_chunks_emits_four_chunk_types() -> None:
    chunks = build_chunks(_tour_fixture())
    types = [c.chunk_type for c in chunks]
    assert types == ["overview", "description", "highlights", "itinerary"]


def test_build_chunks_includes_pricing_and_duration_in_overview() -> None:
    overview = build_chunks(_tour_fixture())[0]
    assert "Price: 2.500.000 VND" in overview.content
    assert "Duration: 3 days / 2 nights" in overview.content
    assert "Rating: 4.8/5" in overview.content


def test_build_chunks_skips_empty_sections() -> None:
    tour = _tour_fixture()
    tour["attributes"]["Highlights"] = []
    tour["attributes"]["Itinerary"] = []
    types = [c.chunk_type for c in build_chunks(tour)]
    assert types == ["overview", "description"]


def test_to_vector_documents_ids_include_language_slug_chunk() -> None:
    docs = to_vector_documents(_tour_fixture(), "en")
    ids = [d.id for d in docs]
    assert ids == [
        "en::hue-imperial-city::overview",
        "en::hue-imperial-city::description",
        "en::hue-imperial-city::highlights",
        "en::hue-imperial-city::itinerary",
    ]


def test_to_vector_documents_metadata_includes_language_and_slug() -> None:
    docs = to_vector_documents(_tour_fixture(), "vi")
    meta = docs[0].metadata
    assert meta["language"] == "vi"
    assert meta["tourSlug"] == "hue-imperial-city"
    assert meta["tourName"] == "Hue Imperial City"
    assert meta["chunkType"] == "overview"
    assert meta["price"] == "2.500.000 VND"

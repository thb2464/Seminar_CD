"""Index Strapi/Catalog tours into ChromaDB.

Run as a module: `python -m app.scripts.index_tours [--clear] [--language vi|en|zh]`.

Replaces the legacy `Travel_TVB_Server/src/api/chatbot/scripts/indexTours.js` and
the `index-tours-cron.sh` wrapper. While Sprint 3 is in flight the script points
at the still-monolith Strapi via `CATALOG_BASE_URL`; once the Catalog Service ships,
that env var just flips to the new origin without code changes.
"""

import argparse
import asyncio
import logging
import sys
from dataclasses import dataclass
from typing import Any, Iterable

import httpx

from app.config import Settings, get_settings
from app.logging import configure_logging
from app.scripts.blocks import render_blocks
from app.services.gemini import GoogleGeminiClient
from app.services.vector_store import VectorDocument, VectorStore, build_chroma_client

logger = logging.getLogger(__name__)

_SUPPORTED_LANGUAGES = ("vi", "en", "zh")
_PAGE_SIZE = 50


@dataclass(frozen=True)
class TourChunk:
    chunk_type: str
    content: str


def _format_price(value: Any) -> str | None:
    if value is None:
        return None
    try:
        amount = int(value)
    except (TypeError, ValueError):
        return None
    if amount <= 0:
        return None
    return f"{amount:,} VND".replace(",", ".")


def _tour_metadata(tour: dict[str, Any], language: str) -> dict[str, Any]:
    attrs = tour.get("attributes", tour)
    return {
        "tourId": str(tour.get("id", attrs.get("id", ""))),
        "tourSlug": attrs.get("slug") or "",
        "tourName": attrs.get("Tour_Name") or "",
        "language": language,
        "price": _format_price(attrs.get("Price")),
        "location": attrs.get("Location") or attrs.get("Departure_Location") or "",
        "region": attrs.get("Region") or "",
        "durationDays": attrs.get("Duration_Days"),
        "rating": attrs.get("Rating"),
    }


def build_chunks(tour: dict[str, Any]) -> list[TourChunk]:
    """Split a tour into 4 chunk types: overview, description, highlights, itinerary."""
    attrs = tour.get("attributes", tour)
    name = attrs.get("Tour_Name") or ""
    parts: list[TourChunk] = []

    overview_lines = [f"Tour: {name}"]
    if short := attrs.get("Short_Description"):
        overview_lines.append(f"Summary: {short}")
    if loc := attrs.get("Location"):
        overview_lines.append(f"Location: {loc}")
    if region := attrs.get("Region"):
        overview_lines.append(f"Region: {region}")
    if price := _format_price(attrs.get("Price")):
        overview_lines.append(f"Price: {price}")
    if (days := attrs.get("Duration_Days")) and (nights := attrs.get("Duration_Nights")):
        overview_lines.append(f"Duration: {days} days / {nights} nights")
    elif days := attrs.get("Duration_Days"):
        overview_lines.append(f"Duration: {days} days")
    if rating := attrs.get("Rating"):
        overview_lines.append(f"Rating: {rating}/5")
    parts.append(TourChunk("overview", "\n".join(overview_lines)))

    if description := render_blocks(attrs.get("Description")):
        parts.append(TourChunk("description", f"Tour: {name}\nDescription:\n{description}"))

    highlights = attrs.get("Highlights") or []
    if isinstance(highlights, list) and highlights:
        bullets: list[str] = []
        for entry in highlights:
            if not isinstance(entry, dict):
                continue
            title = entry.get("Title") or entry.get("title")
            body = entry.get("Description") or entry.get("description")
            if title and body:
                bullets.append(f"• {title}: {body}")
            elif title:
                bullets.append(f"• {title}")
        if bullets:
            parts.append(TourChunk("highlights", f"Tour: {name}\nHighlights:\n" + "\n".join(bullets)))

    if itinerary := render_blocks(attrs.get("Itinerary")):
        parts.append(TourChunk("itinerary", f"Tour: {name}\nItinerary:\n{itinerary}"))

    return parts


def to_vector_documents(tour: dict[str, Any], language: str) -> list[VectorDocument]:
    metadata_base = _tour_metadata(tour, language)
    slug = metadata_base["tourSlug"] or str(tour.get("id", ""))
    documents: list[VectorDocument] = []
    for chunk in build_chunks(tour):
        documents.append(
            VectorDocument(
                id=f"{language}::{slug}::{chunk.chunk_type}",
                content=chunk.content,
                metadata={
                    **{k: v for k, v in metadata_base.items() if v not in (None, "")},
                    "chunkType": chunk.chunk_type,
                },
            )
        )
    return documents


class StrapiTourClient:
    def __init__(self, base_url: str, api_token: str, http: httpx.AsyncClient) -> None:
        self._base_url = base_url.rstrip("/")
        self._api_token = api_token
        self._http = http

    async def list_tours(self, language: str) -> list[dict[str, Any]]:
        results: list[dict[str, Any]] = []
        page = 1
        while True:
            response = await self._http.get(
                f"{self._base_url}/api/tours",
                params={
                    "locale": language,
                    "populate": "*",
                    "pagination[page]": page,
                    "pagination[pageSize]": _PAGE_SIZE,
                    "publicationState": "live",
                },
                headers=self._headers(),
                timeout=30.0,
            )
            response.raise_for_status()
            payload = response.json()
            data = payload.get("data") or []
            results.extend(data)
            meta = payload.get("meta", {}).get("pagination", {})
            page_count = int(meta.get("pageCount", page))
            if page >= page_count or not data:
                break
            page += 1
        return results

    def _headers(self) -> dict[str, str]:
        if not self._api_token:
            return {}
        return {"Authorization": f"Bearer {self._api_token}"}


async def run(
    *,
    settings: Settings,
    languages: Iterable[str] = _SUPPORTED_LANGUAGES,
    clear: bool = False,
) -> int:
    gemini = GoogleGeminiClient(
        api_key=settings.google_ai_api_key,
        llm_model=settings.gemini_llm_model,
        embedding_model=settings.gemini_embedding_model,
    )
    chroma_client = build_chroma_client(
        host=settings.chromadb_host,
        port=settings.chromadb_port,
        ssl=settings.chromadb_ssl,
    )
    vector_store = VectorStore(chroma_client, gemini, settings.chroma_collection)

    if clear:
        logger.info("clearing collection before indexing")
        await vector_store.clear_collection()

    async with httpx.AsyncClient() as http:
        tour_client = StrapiTourClient(settings.catalog_base_url, settings.catalog_api_token, http)
        total = 0
        for language in languages:
            logger.info("fetching tours", extra={"language": language})
            tours = await tour_client.list_tours(language)
            documents: list[VectorDocument] = []
            for tour in tours:
                documents.extend(to_vector_documents(tour, language))
            indexed = await vector_store.add_documents(documents)
            logger.info(
                "indexed language batch",
                extra={"language": language, "tours": len(tours), "chunks": indexed},
            )
            total += indexed
        return total


def _parse_args(argv: list[str] | None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Index Travel TVB tours into ChromaDB.")
    parser.add_argument(
        "--clear",
        action="store_true",
        help="Drop the collection before indexing.",
    )
    parser.add_argument(
        "--language",
        choices=_SUPPORTED_LANGUAGES,
        action="append",
        help="Restrict indexing to one or more languages. May be passed multiple times.",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = _parse_args(argv)
    settings = get_settings()
    configure_logging(settings.log_level)
    if not settings.google_ai_api_key:
        logger.error("GOOGLE_AI_API_KEY is required for indexing")
        return 2
    languages = tuple(args.language) if args.language else _SUPPORTED_LANGUAGES
    total = asyncio.run(run(settings=settings, languages=languages, clear=args.clear))
    logger.info("indexing complete", extra={"total_chunks": total})
    return 0


if __name__ == "__main__":
    sys.exit(main())

"""
Voyage AI embedding wrapper using voyage-law-2 model.
"""
import logging

import voyageai
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import settings

logger = logging.getLogger(__name__)

_client = voyageai.AsyncClient(api_key=settings.VOYAGE_API_KEY)
MODEL = "voyage-law-2"


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=30))
async def embed_text(text: str) -> list[float] | None:
    try:
        result = await _client.embed([text], model=MODEL, input_type="document")
        return result.embeddings[0]
    except Exception as e:
        logger.error(f"Voyage AI embedding error: {e}")
        raise


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=30))
async def embed_texts(texts: list[str]) -> list[list[float]]:
    try:
        result = await _client.embed(texts, model=MODEL, input_type="document")
        return result.embeddings
    except Exception as e:
        logger.error(f"Voyage AI batch embedding error: {e}")
        raise


async def embed_query(query: str) -> list[float] | None:
    try:
        result = await _client.embed([query], model=MODEL, input_type="query")
        return result.embeddings[0]
    except Exception as e:
        logger.error(f"Voyage AI query embedding error: {e}")
        return None

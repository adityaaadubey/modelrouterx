"""Fetch public Arena leaderboard snapshots and persist them to Supabase."""
from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import logging
import os
import time
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urlparse
from urllib.robotparser import RobotFileParser

import requests
import uvicorn
from fastapi import FastAPI

DATASET_ID = "lmarena-ai/leaderboard-dataset"
DATASET_URL = f"https://huggingface.co/datasets/{DATASET_ID}"
DATASET_API = "https://datasets-server.huggingface.co"
USER_AGENT = os.getenv("ARENA_USER_AGENT", "ArenaSignal/1.0")
REFRESH_SECONDS = max(300, int(os.getenv("ARENA_REFRESH_INTERVAL_SECONDS", "900")))
MAX_ROWS_PER_TRACK = min(max(int(os.getenv("MAX_ROWS_PER_TRACK", "100")), 1), 100)
STATE_FILE = Path(os.getenv("ARENA_STATE_FILE", "/tmp/arena-signal-state.sha256"))
SUPABASE_URL = (os.getenv("SUPABASE_URL") or "").rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_SECRET_KEY")
RETENTION_DAYS = 14
REQUEST_TIMEOUT = (10, 40)
BATCH_SIZE = 300

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger("arena-signal")
http = requests.Session()
http.headers.update({"User-Agent": USER_AGENT, "Accept": "application/json"})
status = {"last_attempt_at": None, "last_success_at": None, "last_error": None, "row_count": 0, "config_count": 0}


def allowed_by_robots(url: str) -> bool:
    parsed = urlparse(url)
    robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
    try:
        response = http.get(robots_url, timeout=REQUEST_TIMEOUT)
        if response.status_code == 404:
            return True
        response.raise_for_status()
        parser = RobotFileParser()
        parser.parse(response.text.splitlines())
        return parser.can_fetch(USER_AGENT, url)
    except requests.RequestException as error:
        log.warning("Could not verify robots policy for %s: %s", parsed.netloc, error)
        return False


def request_json(url: str, params: dict | None = None, retries: int = 4) -> dict:
    for attempt in range(1, retries + 1):
        try:
            response = http.get(url, params=params, timeout=REQUEST_TIMEOUT)
            if response.status_code in (429, 502, 503, 504) and attempt < retries:
                retry_after = response.headers.get("Retry-After")
                try:
                    wait_seconds = min(120, max(1, int(float(retry_after)))) if retry_after else min(60, 5 * attempt)
                except (TypeError, ValueError, OverflowError):
                    wait_seconds = min(60, 5 * attempt)
                log.warning("Dataset API returned %s; retrying after %ss.", response.status_code, wait_seconds)
                time.sleep(wait_seconds)
                continue
            response.raise_for_status()
            return response.json()
        except requests.RequestException:
            if attempt == retries:
                raise
            wait_seconds = min(30, 2 ** attempt)
            log.warning("Dataset request failed; retrying after %ss.", wait_seconds)
            time.sleep(wait_seconds)
    raise RuntimeError("The dataset request could not be completed.")


def fetch_dataset_rows() -> tuple[list[dict], set[str], str | None]:
    if not allowed_by_robots(f"{DATASET_API}/rows"):
        raise RuntimeError("The public dataset API robots policy does not allow fetching rows.")

    splits = request_json(f"{DATASET_API}/splits", {"dataset": DATASET_ID})
    configs = sorted({
        item["config"]
        for item in splits.get("splits", [])
        if item.get("split") == "latest" and isinstance(item.get("config"), str)
    })
    if not configs:
        raise RuntimeError("The public dataset did not return any latest leaderboard tracks.")

    records: list[dict] = []
    published_dates: set[str] = set()
    for config in configs:
        payload = request_json(
            f"{DATASET_API}/rows",
            {
                "dataset": DATASET_ID,
                "config": config,
                "split": "latest",
                "offset": 0,
                "length": MAX_ROWS_PER_TRACK,
            },
        )
        for item in payload.get("rows", []):
            source_row = item.get("row")
            if not isinstance(source_row, dict):
                continue
            record = normalize_row(config, source_row)
            if record is not None:
                records.append(record)
                if record["published_at"]:
                    published_dates.add(record["published_at"])
        time.sleep(1.0)

    if not records:
        raise RuntimeError("The public dataset returned no valid ranked model rows.")
    return records, set(configs), max(published_dates) if published_dates else None


def normalize_row(config: str, row: dict) -> dict | None:
    model_name = row.get("model_name")
    category = row.get("category") or "overall"
    rank_value = row.get("rank")
    if not isinstance(model_name, str) or not model_name.strip() or len(model_name) > 300:
        return None
    if not isinstance(category, str) or len(category) > 200:
        return None
    try:
        rank_number = float(rank_value)
        rank = int(rank_number)
    except (TypeError, ValueError, OverflowError):
        return None
    if rank < 1 or rank_number != rank:
        return None

    rating = finite_number(row.get("rating", row.get("score")))
    if rating is None:
        return None
    published_at = row.get("leaderboard_publish_date")
    if not isinstance(published_at, str) or len(published_at) > 32:
        published_at = None
    stable_key = "\0".join((config, category, model_name.strip().casefold()))
    source_key = hashlib.sha256(stable_key.encode("utf-8")).hexdigest()

    return {
        "source_key": source_key,
        "model_name": model_name.strip(),
        "organization": bounded_text(row.get("organization"), 160),
        "license": bounded_text(row.get("license"), 160),
        "source_config": config,
        "category": category.strip(),
        "rank": rank,
        "rating": rating,
        "rating_lower": finite_number(row.get("rating_lower", row.get("score_ci_lower"))),
        "rating_upper": finite_number(row.get("rating_upper", row.get("score_ci_upper"))),
        "variance": finite_number(row.get("variance")),
        "vote_count": integer_or_none(row.get("vote_count")),
        "published_at": published_at,
        "source_url": DATASET_URL,
        "raw": json_safe(row),
    }


def json_safe(value: object) -> object:
    if isinstance(value, dict):
        return {str(key): json_safe(item) for key, item in value.items()}
    if isinstance(value, list):
        return [json_safe(item) for item in value]
    if isinstance(value, float) and not (-1e12 < value < 1e12):
        return None
    return value


def finite_number(value: object) -> float | None:
    if value is None or isinstance(value, bool):
        return None
    try:
        number = float(value)
    except (TypeError, ValueError, OverflowError):
        return None
    if not (-1e12 < number < 1e12):
        return None
    return number


def integer_or_none(value: object) -> int | None:
    number = finite_number(value)
    if number is None or number < 0 or int(number) != number:
        return None
    return int(number)


def bounded_text(value: object, max_length: int) -> str | None:
    if not isinstance(value, str):
        return None
    normalized = value.strip()
    return normalized[:max_length] or None


def content_hash(records: list[dict]) -> str:
    stable = json.dumps(records, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(stable.encode("utf-8")).hexdigest()


def load_last_hash() -> str:
    try:
        return STATE_FILE.read_text(encoding="utf-8").strip()
    except OSError:
        return ""


def save_hash(value: str) -> None:
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    temporary = STATE_FILE.with_suffix(".tmp")
    temporary.write_text(value, encoding="utf-8")
    temporary.replace(STATE_FILE)


def supabase_request(method: str, path: str, *, params: dict | None = None, payload: object = None, prefer: str | None = None) -> requests.Response:
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured in Render.")
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
    }
    if prefer:
        headers["Prefer"] = prefer
    response = http.request(
        method,
        f"{SUPABASE_URL}/rest/v1/{path}",
        params=params,
        json=payload,
        headers=headers,
        timeout=REQUEST_TIMEOUT,
    )
    response.raise_for_status()
    return response


def write_snapshot(records: list[dict], configs: set[str], published_at: str | None) -> int:
    created = supabase_request(
        "POST",
        "arena_leaderboard_snapshots",
        payload={
            "source": DATASET_ID,
            "source_url": DATASET_URL,
            "published_at": published_at,
            "status": "running",
            "config_count": len(configs),
        },
        prefer="return=representation",
    )
    snapshot_rows = created.json()
    if not isinstance(snapshot_rows, list) or not snapshot_rows or not snapshot_rows[0].get("id"):
        raise RuntimeError("Supabase did not return the newly created snapshot ID.")
    snapshot_id = snapshot_rows[0]["id"]

    try:
        for offset in range(0, len(records), BATCH_SIZE):
            batch = [
                {**record, "snapshot_id": snapshot_id}
                for record in records[offset:offset + BATCH_SIZE]
            ]
            supabase_request("POST", "arena_leaderboard_rows", payload=batch, prefer="return=minimal")

        completed_at = datetime.now(timezone.utc).isoformat()
        supabase_request(
            "PATCH",
            "arena_leaderboard_snapshots",
            params={"id": f"eq.{snapshot_id}"},
            payload={"status": "complete", "row_count": len(records), "completed_at": completed_at, "error_message": None},
            prefer="return=minimal",
        )
    except Exception as error:
        try:
            supabase_request(
                "PATCH",
                "arena_leaderboard_snapshots",
                params={"id": f"eq.{snapshot_id}"},
                payload={"status": "failed", "error_message": str(error)[:500]},
                prefer="return=minimal",
            )
        except Exception:
            log.exception("Could not mark snapshot %s as failed", snapshot_id)
        raise

    cleanup_cutoff = (datetime.now(timezone.utc) - timedelta(days=RETENTION_DAYS)).isoformat()
    try:
        supabase_request(
            "DELETE",
            "arena_leaderboard_snapshots",
            params={"started_at": f"lt.{cleanup_cutoff}"},
            prefer="return=minimal",
        )
    except Exception as error:
        log.warning("Snapshot retention cleanup failed: %s", str(error)[:200])
    return len(records)


def scrape_once(force: bool = False) -> dict:
    status["last_attempt_at"] = datetime.now(timezone.utc).isoformat()
    records, configs, published_at = fetch_dataset_rows()
    current_hash = content_hash(records)
    if not force and current_hash == load_last_hash():
        status.update({
            "last_success_at": datetime.now(timezone.utc).isoformat(),
            "last_error": None,
            "row_count": len(records),
            "config_count": len(configs),
        })
        log.info("Leaderboard unchanged; skipped database write (%d rows, %d tracks).", len(records), len(configs))
        return {"changed": False, "row_count": len(records), "config_count": len(configs)}

    row_count = write_snapshot(records, configs, published_at)
    save_hash(current_hash)
    status.update({
        "last_success_at": datetime.now(timezone.utc).isoformat(),
        "last_error": None,
        "row_count": row_count,
        "config_count": len(configs),
    })
    log.info("Stored %d ranked rows across %d tracks.", row_count, len(configs))
    return {"changed": True, "row_count": row_count, "config_count": len(configs)}


async def scheduler() -> None:
    while True:
        try:
            await asyncio.to_thread(scrape_once)
        except Exception as error:
            status["last_error"] = str(error)[:500]
            log.exception("Leaderboard refresh failed; the last completed snapshot remains available.")
        await asyncio.sleep(REFRESH_SECONDS)


@asynccontextmanager
async def lifespan(_: FastAPI):
    task = asyncio.create_task(scheduler())
    try:
        yield
    finally:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass


app = FastAPI(title="Arena Signal data service", docs_url=None, redoc_url=None, openapi_url=None, lifespan=lifespan)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "source": DATASET_URL, **status}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--once", action="store_true", help="Fetch and store one snapshot, then exit.")
    parser.add_argument("--dry-run", action="store_true", help="Fetch public rows without writing to Supabase.")
    parser.add_argument("--force", action="store_true", help="Store a snapshot even if the dataset is unchanged.")
    args = parser.parse_args()

    if args.dry_run:
        records, configs, published_at = fetch_dataset_rows()
        log.info("Dry run fetched %d rows across %d tracks (published %s).", len(records), len(configs), published_at or "date unavailable")
        return
    if args.once:
        result = scrape_once(force=args.force)
        log.info("One-shot refresh complete: %s", json.dumps(result, sort_keys=True))
        return
    uvicorn.run("scraper.scraper:app", host="0.0.0.0", port=int(os.getenv("PORT", "10000")), reload=False)


if __name__ == "__main__":
    main()

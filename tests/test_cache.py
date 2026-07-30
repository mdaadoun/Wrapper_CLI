"""Unit tests for SHA-256 ContentCache persistence module."""

from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch

from ai_watcher.clients import get_mock_analysis_report
from ai_watcher.main import app
from ai_watcher.utils.cache import ContentCache, compute_content_hash
from typer.testing import CliRunner

runner = CliRunner()


def test_compute_content_hash():
    """Verify SHA-256 computation consistency."""
    hash1 = compute_content_hash("Hello World")
    hash2 = compute_content_hash("Hello World")
    hash3 = compute_content_hash("Different Text")

    assert len(hash1) == 64
    assert hash1 == hash2
    assert hash1 != hash3


def test_default_cache_path():
    """Verify default cache file location."""
    cache = ContentCache()
    expected_path = Path.home() / ".cache" / "ai_watcher" / "cache.json"
    assert cache.cache_file == expected_path


def test_cache_set_and_get(tmp_path):
    """Verify storing and retrieving report from local JSON cache."""
    cache_file = tmp_path / "cache.json"
    cache = ContentCache(cache_file=cache_file)
    report = get_mock_analysis_report()
    content_hash = compute_content_hash("Sample content for analysis")

    assert cache.get(content_hash) is None

    cache.set(content_hash, report, ttl=3600)
    assert cache_file.exists()

    cached_report = cache.get(content_hash)
    assert cached_report is not None
    assert cached_report.title == report.title
    assert cached_report.is_cached is True


def test_cache_miss(tmp_path):
    """Verify retrieving non-existent hash returns None."""
    cache_file = tmp_path / "cache.json"
    cache = ContentCache(cache_file=cache_file)
    assert cache.get("non_existent_hash") is None


def test_cache_expired_ttl(tmp_path):
    """Verify expired cache entry returns None."""
    cache_file = tmp_path / "cache.json"
    cache = ContentCache(cache_file=cache_file)
    report = get_mock_analysis_report()
    content_hash = compute_content_hash("Expired content")

    past_time = (datetime.now(timezone.utc) - timedelta(seconds=100)).isoformat()
    cache._save(
        {
            content_hash: {
                "hash": content_hash,
                "created_at": past_time,
                "ttl": 50,  # Expired (100 > 50)
                "report": report.model_dump(mode="json"),
            }
        }
    )

    assert cache.get(content_hash) is None


def test_cache_invalid_iso_timestamp(tmp_path):
    """Verify invalid created_at date format returns None."""
    cache_file = tmp_path / "cache.json"
    cache = ContentCache(cache_file=cache_file)
    cache._save(
        {
            "invalid_date_hash": {
                "hash": "invalid_date_hash",
                "created_at": "not-an-iso-date",
                "ttl": 3600,
                "report": get_mock_analysis_report().model_dump(mode="json"),
            }
        }
    )
    assert cache.get("invalid_date_hash") is None


def test_cache_missing_report_key(tmp_path):
    """Verify cache entry missing report dict returns None."""
    cache_file = tmp_path / "cache.json"
    cache = ContentCache(cache_file=cache_file)
    cache._save(
        {
            "missing_report_hash": {
                "hash": "missing_report_hash",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "ttl": 3600,
            }
        }
    )
    assert cache.get("missing_report_hash") is None


def test_cache_invalid_report_schema(tmp_path):
    """Verify cache entry with invalid report dict returns None."""
    cache_file = tmp_path / "cache.json"
    cache = ContentCache(cache_file=cache_file)
    cache._save(
        {
            "bad_schema_hash": {
                "hash": "bad_schema_hash",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "ttl": 3600,
                "report": {"invalid_field": "unknown"},
            }
        }
    )
    assert cache.get("bad_schema_hash") is None


def test_cache_corrupted_json(tmp_path):
    """Verify corrupted JSON cache file is safely ignored."""
    cache_file = tmp_path / "cache.json"
    cache_file.write_text("invalid json content {{{", encoding="utf-8")
    cache = ContentCache(cache_file=cache_file)

    assert cache.get("any_hash") is None


def test_cache_clear(tmp_path):
    """Verify clearing cache purges the cache file."""
    cache_file = tmp_path / "cache.json"
    cache = ContentCache(cache_file=cache_file)
    report = get_mock_analysis_report()

    cache.set("hash123", report)
    assert cache_file.exists()

    cache.clear()
    assert not cache_file.exists()


def test_cache_clear_os_error(tmp_path):
    """Verify clear handles OSError gracefully."""
    cache_file = tmp_path / "cache.json"
    cache = ContentCache(cache_file=cache_file)
    cache_file.write_text("{}", encoding="utf-8")

    with patch.object(Path, "unlink", side_effect=OSError("Permission denied")):
        cache.clear()  # Should not raise exception


def test_cache_save_os_error(tmp_path):
    """Verify _save handles OSError gracefully."""
    cache_file = tmp_path / "cache.json"
    cache = ContentCache(cache_file=cache_file)
    with patch("builtins.open", side_effect=OSError("Disk write error")):
        cache._save({"test": "data"})  # Should not raise exception


def test_cli_scan_cache_hit(tmp_path, monkeypatch):
    """Verify CLI scan command utilizes cache on second invocation."""
    cache_file = tmp_path / "cache.json"
    monkeypatch.setattr(
        "ai_watcher.main.ContentCache", lambda: ContentCache(cache_file=cache_file)
    )

    # First invocation -> cache miss -> stores result
    result1 = runner.invoke(app, ["scan", "Unique content to analyze", "--demo"])
    assert result1.exit_code == 0
    assert "[CACHE HIT]" not in result1.stdout
    assert "Executing in DEMO mode" in result1.stdout

    # Second invocation -> cache hit -> returns cached report instantly
    result2 = runner.invoke(app, ["scan", "Unique content to analyze", "--demo"])
    assert result2.exit_code == 0
    assert "[CACHE HIT]" in result2.stdout


def test_cache_purge_expired(tmp_path):
    """Verify purge_expired removes expired entries from disk."""
    cache_file = tmp_path / "cache.json"
    cache = ContentCache(cache_file=cache_file, auto_purge=False)
    report = get_mock_analysis_report()
    valid_hash = compute_content_hash("valid content")
    expired_hash = compute_content_hash("expired content")

    past_time = (datetime.now(timezone.utc) - timedelta(seconds=100)).isoformat()
    now_time = datetime.now(timezone.utc).isoformat()

    cache._save(
        {
            valid_hash: {
                "hash": valid_hash,
                "created_at": now_time,
                "ttl": 3600,
                "report": report.model_dump(mode="json"),
            },
            expired_hash: {
                "hash": expired_hash,
                "created_at": past_time,
                "ttl": 50,
                "report": report.model_dump(mode="json"),
            },
        }
    )

    purged = cache.purge_expired()
    assert purged == 1

    loaded = cache._load()
    assert valid_hash in loaded
    assert expired_hash not in loaded


def test_cache_auto_purge_on_init(tmp_path):
    """Verify ContentCache automatically purges expired entries on initialization."""
    cache_file = tmp_path / "cache.json"
    cache_init = ContentCache(cache_file=cache_file, auto_purge=False)
    report = get_mock_analysis_report()
    expired_hash = compute_content_hash("auto purge content")

    past_time = (datetime.now(timezone.utc) - timedelta(seconds=200)).isoformat()
    cache_init._save(
        {
            expired_hash: {
                "hash": expired_hash,
                "created_at": past_time,
                "ttl": 50,
                "report": report.model_dump(mode="json"),
            }
        }
    )

    # Initializing ContentCache with default auto_purge=True purges expired entries
    cache = ContentCache(cache_file=cache_file, auto_purge=True)
    assert cache.get(expired_hash) is None
    loaded = cache._load()
    assert expired_hash not in loaded


def test_cache_custom_ttl_override(tmp_path):
    """Verify get with custom ttl overrides entry ttl."""
    cache_file = tmp_path / "cache.json"
    cache = ContentCache(cache_file=cache_file, auto_purge=False)
    report = get_mock_analysis_report()
    content_hash = compute_content_hash("custom ttl text")

    past_time = (datetime.now(timezone.utc) - timedelta(seconds=30)).isoformat()
    cache._save(
        {
            content_hash: {
                "hash": content_hash,
                "created_at": past_time,
                "ttl": 3600,
                "report": report.model_dump(mode="json"),
            }
        }
    )

    # Effective custom TTL of 10s is smaller than 30s elapsed time
    assert cache.get(content_hash, ttl=10) is None
    # Effective custom TTL of 100s is larger than 30s elapsed time
    assert cache.get(content_hash, ttl=100) is not None


def test_cache_ttl_zero_override(tmp_path):
    """Verify ttl=0 forces cache miss."""
    cache_file = tmp_path / "cache.json"
    cache = ContentCache(cache_file=cache_file, auto_purge=False)
    report = get_mock_analysis_report()
    content_hash = compute_content_hash("ttl zero content")

    cache.set(content_hash, report, ttl=3600)
    assert cache.get(content_hash, ttl=0) is None


def test_cli_scan_cache_ttl_zero(tmp_path, monkeypatch):
    """Verify --cache-ttl 0 forces fresh API analysis without cache hit."""
    cache_file = tmp_path / "cache.json"
    monkeypatch.setattr(
        "ai_watcher.main.ContentCache", lambda: ContentCache(cache_file=cache_file)
    )

    runner.invoke(app, ["scan", "TTL zero test text", "--demo"])
    result = runner.invoke(
        app, ["scan", "TTL zero test text", "--demo", "--cache-ttl", "0"]
    )

    assert result.exit_code == 0
    assert "[CACHE HIT]" not in result.stdout
    assert "Executing in DEMO mode" in result.stdout


def test_cli_scan_no_cache_flag(tmp_path, monkeypatch):
    """Verify --no-cache flag bypasses cache read and write."""
    cache_file = tmp_path / "cache.json"
    monkeypatch.setattr(
        "ai_watcher.main.ContentCache", lambda: ContentCache(cache_file=cache_file)
    )

    result = runner.invoke(app, ["scan", "No cache test text", "--demo", "--no-cache"])
    assert result.exit_code == 0
    assert "[CACHE HIT]" not in result.stdout
    assert not cache_file.exists()


def test_cache_purge_corrupted_entries(tmp_path):
    """Verify purge_expired handles invalid dictionary, missing created_at, or bad timestamp."""
    cache_file = tmp_path / "cache.json"
    cache = ContentCache(cache_file=cache_file, auto_purge=False)

    cache._save(
        {
            "non_dict": "not_a_dict",
            "missing_date": {"hash": "h1"},
            "bad_date": {"created_at": "invalid-iso"},
        }
    )

    purged = cache.purge_expired()
    assert purged == 3
    assert cache._load() == {}

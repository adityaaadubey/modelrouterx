import unittest
from unittest.mock import Mock, patch

from scraper import scraper


class ArenaScraperTests(unittest.TestCase):
    @patch.object(scraper.time, "sleep")
    @patch.object(scraper.http, "get")
    def test_rate_limit_retry_honors_retry_after(self, mock_get, mock_sleep):
        limited = Mock(status_code=429, headers={"Retry-After": "3"})
        successful = Mock(status_code=200)
        successful.json.return_value = {"rows": []}
        mock_get.side_effect = [limited, successful]

        result = scraper.request_json("https://datasets-server.huggingface.co/rows")

        self.assertEqual(result, {"rows": []})
        mock_sleep.assert_called_once_with(3)
        self.assertEqual(mock_get.call_count, 2)

    def test_normalize_row_preserves_track_metadata_and_score(self):
        row = scraper.normalize_row("text", {
            "model_name": "Example Model",
            "organization": "Example Lab",
            "license": "Open",
            "rank": 2.0,
            "rating": 1412.3456,
            "rating_lower": 1401.2,
            "rating_upper": 1423.4,
            "vote_count": 123,
            "category": "overall",
            "leaderboard_publish_date": "2026-11-22",
        })

        self.assertIsNotNone(row)
        self.assertEqual(row["source_config"], "text")
        self.assertEqual(row["rank"], 2)
        self.assertEqual(row["rating"], 1412.3456)
        self.assertEqual(row["organization"], "Example Lab")
        self.assertEqual(row["published_at"], "2026-11-22")

    def test_normalize_row_rejects_invalid_ranks(self):
        row = scraper.normalize_row("text", {"model_name": "Example", "rank": "NaN", "rating": 1200})
        self.assertIsNone(row)


if __name__ == "__main__":
    unittest.main()

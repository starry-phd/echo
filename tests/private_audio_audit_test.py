import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("private_audit", Path(__file__).parents[1] / "scripts/audit-private-audio.py")
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)


class PrivateAudioAuditTests(unittest.TestCase):
    def test_inventory_rejects_traversal_and_duplicate_audio_keys(self):
        for path in ("../private.mp3", "/private.mp3", "folder/../private.mp3", "title\nname.mp3"):
            with self.assertRaises(audit.AuditError):
                audit.parse_inventory(json.dumps([{"Path": path, "Size": 3}]))
        with self.assertRaises(audit.AuditError):
            audit.parse_inventory(json.dumps([{"Path": "same.mp3", "Size": 3}] * 2))

    def test_inventory_checks_exact_count_and_matching_paths_and_sizes(self):
        with self.assertRaisesRegex(audit.AuditError, "EXPECTED_COUNT_MISMATCH"):
            audit.match_inventories({"a.mp3": 3}, {"a.mp3": 3}, expected=2)
        with self.assertRaisesRegex(audit.AuditError, "PATH_OR_SIZE_MISMATCH"):
            audit.match_inventories({"a.mp3": 3}, {"a.mp3": 4}, expected=1)

    def test_sha256_detects_same_size_corruption(self):
        with tempfile.TemporaryDirectory() as temporary:
            source = Path(temporary) / "original"
            target = Path(temporary) / "copy"
            source.write_bytes(b"ABC"); target.write_bytes(b"XYZ")
            with self.assertRaisesRegex(audit.AuditError, "SHA256_MISMATCH"):
                audit.compare_bytes(source, target, 3)

    def test_subprocess_failure_cannot_disclose_key_or_stderr(self):
        leaked = "PRIVATE_TITLE secret-key-value audio/recording.mp3"
        result = subprocess.CompletedProcess([], 1, stdout=b"", stderr=leaked.encode())
        with patch.object(audit.subprocess, "run", return_value=result):
            with self.assertRaises(audit.AuditError) as error:
                audit.run_capture(["rclone", "lsjson", "unused"])
        self.assertEqual(str(error.exception), "COMMAND_FAILED")
        self.assertNotIn(leaked, str(error.exception))

    def test_download_destinations_are_local_and_private_temp_files_are_cleaned(self):
        destinations = []
        calls = []

        def fake_run(arguments, timeout=240):
            calls.append(arguments)
            if arguments[0] == "rclone":
                destination = Path(arguments[3])
                self.assertTrue(destination.is_absolute())
                self.assertNotIn("PRIVATE_TITLE", str(destination))
                destination.write_bytes(b"ABC")
                destinations.append(destination)
            if arguments[0] == "ffprobe":
                return b'{"streams":[{"codec_name":"aac"}]}'
            return b""

        with patch.object(audit, "run_capture", side_effect=fake_run):
            result = audit.verify_recording("PRIVATE_TITLE.m4a", 3)
        self.assertEqual(result, {"extension": "m4a", "codec": "aac", "bytes": 3})
        self.assertTrue(all(not path.exists() for path in destinations))
        self.assertTrue(all(call[1] == "copyto" for call in calls if call[0] == "rclone"))
        self.assertIn("-t", calls[-1]); self.assertIn("8", calls[-1])


if __name__ == "__main__":
    unittest.main()

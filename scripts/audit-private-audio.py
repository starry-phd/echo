"""Read-only original/copy integrity audit; public output contains aggregates only."""
import argparse
from collections import Counter
from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import subprocess
import tempfile

SOURCE = "old:echoes-audio-bucket/uploads"
TARGET = "new:echo-starry/uploads"
EXPECTED_COUNT = 112
EXTENSIONS = {".m4a", ".mp3", ".aac"}


class AuditError(Exception):
    """Only fixed codes may leave the private subprocess boundary."""


def run_capture(arguments, timeout=240):
    try:
        result = subprocess.run(arguments, stdout=subprocess.PIPE,
                                stderr=subprocess.PIPE, timeout=timeout, check=False)
    except (OSError, subprocess.SubprocessError):
        raise AuditError("COMMAND_FAILED") from None
    if result.returncode:
        # rclone/ffmpeg stderr can contain titles, keys and embedded audio tags.
        raise AuditError("COMMAND_FAILED") from None
    return result.stdout


def parse_inventory(raw):
    try:
        entries = json.loads(raw)
    except (ValueError, TypeError):
        raise AuditError("INVENTORY_INVALID") from None
    if not isinstance(entries, list):
        raise AuditError("INVENTORY_INVALID")
    found = {}
    for entry in entries:
        if not isinstance(entry, dict):
            raise AuditError("INVENTORY_INVALID")
        relative = entry.get("Path")
        if not isinstance(relative, str):
            raise AuditError("INVENTORY_INVALID")
        extension = PurePosixPath(relative).suffix.lower()
        if extension not in EXTENSIONS or entry.get("IsDir") is True:
            continue
        parts = relative.split("/")
        if (relative.startswith("/") or any(part in ("", ".", "..") for part in parts)
                or any(ord(char) < 32 for char in relative) or "\\" in relative):
            raise AuditError("UNSAFE_OBJECT_PATH")
        size = entry.get("Size")
        if type(size) is not int or size <= 0 or relative in found:
            raise AuditError("INVENTORY_INVALID")
        found[relative] = size
    return found


def match_inventories(source, target, expected=EXPECTED_COUNT):
    if len(source) != expected or len(target) != expected:
        raise AuditError("EXPECTED_COUNT_MISMATCH")
    if source != target:
        raise AuditError("PATH_OR_SIZE_MISMATCH")
    return sorted(source.items())


def digest_file(path):
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.digest()


def compare_bytes(source, target, expected_size):
    if source.stat().st_size != expected_size or target.stat().st_size != expected_size:
        raise AuditError("DOWNLOADED_SIZE_MISMATCH")
    if digest_file(source) != digest_file(target):
        raise AuditError("SHA256_MISMATCH")


def verify_recording(relative, expected_size):
    extension = PurePosixPath(relative).suffix.lower()
    # Local filenames never contain the original title or R2 object key.
    with tempfile.TemporaryDirectory(prefix="echo-private-audio-") as temporary:
        old_file = Path(temporary) / ("original" + extension)
        new_file = Path(temporary) / ("copy" + extension)
        for remote, local in ((SOURCE, old_file), (TARGET, new_file)):
            run_capture(["rclone", "copyto", remote + "/" + relative,
                         str(local), "--quiet", "--retries", "2"])
        compare_bytes(old_file, new_file, expected_size)
        try:
            probe = json.loads(run_capture([
                "ffprobe", "-v", "error", "-select_streams", "a:0",
                "-show_entries", "stream=codec_name", "-of", "json", str(new_file)
            ], timeout=60))
            codec = probe["streams"][0]["codec_name"]
        except (ValueError, KeyError, IndexError, TypeError):
            raise AuditError("AUDIO_STREAM_MISSING") from None
        if not isinstance(codec, str) or not re.fullmatch(r"[a-z0-9_]{1,24}", codec):
            raise AuditError("AUDIO_CODEC_INVALID")
        run_capture(["ffmpeg", "-nostdin", "-v", "error", "-xerror",
                     "-i", str(new_file), "-t", "8", "-vn", "-map", "0:a:0",
                     "-f", "null", "-"], timeout=90)
        return {"extension": extension[1:], "codec": codec, "bytes": expected_size}


def audit():
    source = parse_inventory(run_capture(["rclone", "lsjson", SOURCE, "--recursive", "--files-only"]))
    target = parse_inventory(run_capture(["rclone", "lsjson", TARGET, "--recursive", "--files-only"]))
    recordings = match_inventories(source, target)
    passed = []
    failures = Counter()
    # Bound disk and network use; copies only go from private remotes to temporary local files.
    with ThreadPoolExecutor(max_workers=3) as pool:
        futures = [pool.submit(verify_recording, path, size) for path, size in recordings]
        for completed, future in enumerate(as_completed(futures), 1):
            try:
                passed.append(future.result())
            except AuditError as error:
                failures[str(error)] += 1
            except Exception:
                failures["INTERNAL_ERROR"] += 1
            if completed % 16 == 0 or completed == EXPECTED_COUNT:
                print(f"Private recordings audited: {completed}/{EXPECTED_COUNT}", flush=True)
    return {
        "scope": "read-only-private-audio-original-copy",
        "expectedRecordings": EXPECTED_COUNT,
        "matchedPathAndSize": len(recordings),
        "sha256MatchedAndFirst8SecondsDecoded": len(passed),
        "bytesOfVerifiedRecordings": sum(item["bytes"] for item in passed),
        "extensions": dict(Counter(item["extension"] for item in passed)),
        "codecs": dict(Counter(item["codec"] for item in passed)),
        "failures": dict(failures),
        "databaseWrites": 0,
        "publicationChanges": 0,
        "fullDurationDecoded": False,
        "devicePlaybackVerified": False,
        "contentRightsApproved": False,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--summary", required=True)
    args = parser.parse_args()
    try:
        summary = audit()
    except AuditError as error:
        print("Private audit stopped: " + str(error))
        return 1
    except Exception:
        print("Private audit stopped: INTERNAL_ERROR")
        return 1
    Path(args.summary).write_text(json.dumps(summary, indent=2) + "\n")
    print(json.dumps(summary, sort_keys=True))
    print("Hashes and sample decode do not grant playback, publication or content rights.")
    return 0 if not summary["failures"] else 1


if __name__ == "__main__":
    raise SystemExit(main())

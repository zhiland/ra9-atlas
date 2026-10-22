"""Regression tests for admission, egress, and patch boundaries."""

from http.client import HTTPConnection
import io
import json
import os
from pathlib import Path
import subprocess
import sys
import tarfile
import tempfile
import unittest
from unittest.mock import Mock, patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools/isolation"))
import opencode_runner as runner


def archive_bytes(entries):
    output = io.BytesIO()
    with tarfile.open(fileobj=output, mode="w") as archive:
        for name, kind in entries:
            entry = tarfile.TarInfo(name)
            entry.type = kind
            if kind == tarfile.REGTYPE:
                entry.size = 7
                archive.addfile(entry, io.BytesIO(b"PUBLIC\n"))
            else:
                entry.linkname = "../private"
                archive.addfile(entry)
    return output.getvalue()


class RunnerBoundaryTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve()
        network_guard = patch.object(runner.http.client, "HTTPSConnection",
                                     side_effect=AssertionError("Unit tests must not contact upstream"))
        network_guard.start()
        self.addCleanup(network_guard.stop)

    def test_public_archive_contains_only_fresh_regular_files(self):
        destination = self.root / "public"
        runner.unpack_public_archive(archive_bytes([("docs/test.md", tarfile.REGTYPE)]), destination)
        path = destination / "docs/test.md"
        self.assertEqual(path.read_bytes(), b"PUBLIC\n")
        self.assertEqual(path.stat().st_nlink, 1)

    def test_tar_traversal_link_device_and_private_names_fail_before_extraction(self):
        cases = [(name, tarfile.REGTYPE) for name in [
            "../outside", "/absolute", "docs/../../escape", ".git/config", ".env.local",
            "docs/.env", "notes/evidence/raw.txt", "node_modules/cache", "secret.log",
            ".opencode/plugin.js", "opencode.json", ".agents/private.md",
        ]] + [("link", kind) for kind in [tarfile.SYMTYPE, tarfile.LNKTYPE, tarfile.FIFOTYPE, tarfile.CHRTYPE]]
        for name, kind in cases:
            with self.subTest(name=name, kind=kind):
                destination = self.root / "rejected"
                data = archive_bytes([("safe.txt", tarfile.REGTYPE), (name, kind)])
                with self.assertRaises(ValueError):
                    runner.unpack_public_archive(data, destination)
                self.assertFalse(destination.exists())

    def test_duplicate_tar_entries_fail_before_extraction(self):
        with self.assertRaisesRegex(ValueError, "Duplicate"):
            runner.unpack_public_archive(archive_bytes([("a", tarfile.REGTYPE), ("a", tarfile.REGTYPE)]), self.root / "out")

    def test_export_rejects_symlink_before_reading_target(self):
        project = self.root / "project"
        project.mkdir()
        (project / "link").symlink_to(self.root / "unreadable-private-target")
        with self.assertRaisesRegex(ValueError, "Unsafe"):
            runner.audit_tree(project)

    def test_export_rejects_preexisting_hardlink(self):
        source = self.root / "fabricated.txt"
        source.write_text("FABRICATED")
        project = self.root / "project"
        project.mkdir()
        os.link(source, project / "link")
        with self.assertRaisesRegex(ValueError, "Hardlinked"):
            runner.audit_tree(project)

    def test_patch_applies_exactly_including_new_and_missing_final_newlines(self):
        before = {"modified.txt": b"old", "removed.txt": b"remove\n"}
        after = {"modified.txt": b"new\n", "added.txt": b"add"}
        for name, content in before.items():
            (self.root / name).write_bytes(content)
        patch = self.root / "changes.patch"
        patch.write_text(runner.patch_text(before, after))
        result = subprocess.run(["git", "apply", "--no-index", str(patch)], cwd=self.root, capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        for name, content in after.items():
            self.assertEqual((self.root / name).read_bytes(), content)
        self.assertFalse((self.root / "removed.txt").exists())

    def test_candidate_rejects_port_injection(self):
        for port in [0, 80, 65536, '443"))']:
            with self.subTest(port=port), self.assertRaises(ValueError):
                runner.candidate_profile(self.root, (port, 45000))

    def test_patch_preserves_empty_file_creation_and_deletion(self):
        (self.root / "removed.txt").touch()
        patch = self.root / "empty.patch"
        patch.write_text(runner.patch_text({"removed.txt": b""}, {"created.txt": b""}))
        result = subprocess.run(["git", "apply", "--no-index", str(patch)], cwd=self.root, capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertTrue((self.root / "created.txt").is_file())
        self.assertFalse((self.root / "removed.txt").exists())

    def test_relay_refuses_other_paths_methods_and_paid_models(self):
        relay = runner.InferenceRelay()
        self.addCleanup(relay.close)
        relay.enabled = True
        for method, path, model in [
            ("POST", "/v1/chat/completions", "paid-model"),
            ("POST", "/redirect", runner.FREE_MODEL),
            ("CONNECT", "example.com:443", runner.FREE_MODEL),
            ("GET", "/v1/chat/completions", runner.FREE_MODEL),
        ]:
            with self.subTest(method=method, path=path, model=model):
                connection = HTTPConnection("127.0.0.1", relay.port, timeout=2)
                connection.request(method, path, body=json.dumps({"model": model}))
                response = connection.getresponse()
                self.assertIn(response.status, (403, 501))
                response.read()
                connection.close()
        self.assertEqual(relay.records, [])

    def test_relay_disabled_until_checks_finish(self):
        relay = runner.InferenceRelay()
        self.addCleanup(relay.close)
        connection = HTTPConnection("127.0.0.1", relay.port, timeout=2)
        self.addCleanup(connection.close)
        connection.request("POST", "/v1/chat/completions", body=json.dumps({"model": runner.FREE_MODEL}))
        response = connection.getresponse()
        self.assertEqual(response.status, 403)
        response.read()
        self.assertEqual(relay.records, [])

    def test_relay_preserves_genuine_headers_and_fixed_destination(self):
        relay = runner.InferenceRelay()
        self.addCleanup(relay.close)
        relay.enabled = True
        upstream = Mock()
        response = upstream.getresponse.return_value
        response.status = 200
        response.getheader.return_value = "text/event-stream"
        response.read1.side_effect = [b"data: [DONE]\n\n", b""]
        with patch.object(runner.http.client, "HTTPSConnection", return_value=upstream) as factory:
            connection = HTTPConnection("127.0.0.1", relay.port, timeout=2)
            connection.request("POST", "/v1/chat/completions", body=json.dumps({"model": runner.FREE_MODEL}),
                               headers={"User-Agent": "SYNTHETIC_CLIENT", "X-Opencode-Test": "SYNTHETIC_HEADER"})
            result = connection.getresponse()
            self.assertEqual(result.status, 200)
            self.assertEqual(result.read(), b"data: [DONE]\n\n")
            connection.close()
        factory.assert_called_once_with("opencode.ai", timeout=90)
        args, kwargs = upstream.request.call_args
        self.assertEqual(args, ("POST", "/inference/openai/v1/chat/completions"))
        headers = {key.lower(): value for key, value in kwargs["headers"].items()}
        self.assertEqual(headers["user-agent"], "SYNTHETIC_CLIENT")
        self.assertEqual(headers["x-opencode-test"], "SYNTHETIC_HEADER")
        self.assertNotIn("host", headers)

    def test_relay_refuses_code_mode_catalog(self):
        relay = runner.InferenceRelay()
        self.addCleanup(relay.close)
        relay.enabled = True
        connection = HTTPConnection("127.0.0.1", relay.port, timeout=2)
        self.addCleanup(connection.close)
        connection.request("POST", "/v1/chat/completions", body=json.dumps({
            "model": runner.FREE_MODEL, "tools": [{"type": "function", "function": {"name": "execute"}}],
        }))
        response = connection.getresponse()
        self.assertEqual(response.status, 403)
        response.read()
        self.assertEqual(relay.records, [])

    def test_policy_gate_waits_past_early_server_readiness(self):
        calls = []
        states = iter([[], [{"id": "opencode.config.policy", "state": {"status": "starting"}}],
                       [{"id": "opencode.config.policy", "state": {"status": "active"}}]])

        def api(route):
            calls.append(route)
            return {"data": [] if route == "/api/model" else next(states)}

        plugins = runner.wait_for_policy(api, sleep=lambda _: None)
        self.assertEqual(calls, ["/api/model", "/api/plugin", "/api/plugin", "/api/plugin"])
        self.assertEqual(plugins[0]["state"]["status"], "active")

    def test_policy_gate_refuses_missing_enforcement_plugin(self):
        with self.assertRaisesRegex(RuntimeError, "not active"):
            runner.wait_for_policy(lambda _: {"data": []}, sleep=lambda _: None)


if __name__ == "__main__":
    unittest.main()

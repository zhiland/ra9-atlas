"""Host-independent checks for offline diagnostic setup and fail-closed behavior."""

import importlib.util
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

MODULE = Path(__file__).resolve().parents[1] / "tools/isolation/seatbelt_preflight.py"
spec = importlib.util.spec_from_file_location("preflight", MODULE)
preflight = importlib.util.module_from_spec(spec)
spec.loader.exec_module(preflight)


class PreflightSetupTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve()

    def test_environment_excludes_parent_secrets_and_configuration(self):
        with patch.dict(os.environ, {"RA9_SYNTHETIC_SECRET": "fake", "NODE_OPTIONS": "fake", "PYTHONPATH": "fake"}):
            env = preflight.clean_environment(self.root)
        self.assertNotIn("RA9_SYNTHETIC_SECRET", env)
        self.assertNotIn("NODE_OPTIONS", env)
        self.assertNotIn("PYTHONPATH", env)
        for key in ("HOME", "TMPDIR", "XDG_CONFIG_HOME", "XDG_DATA_HOME", "XDG_CACHE_HOME", "XDG_STATE_HOME"):
            self.assertEqual(Path(env[key]).parent, self.root)
            self.assertTrue(Path(env[key]).is_dir())

    def test_environment_refuses_existing_directory_or_symlink(self):
        sibling = self.root / "sibling"
        sibling.mkdir()
        (self.root / "home").symlink_to(sibling, target_is_directory=True)
        with self.assertRaises(FileExistsError):
            preflight.clean_environment(self.root)

    def test_profile_rejects_relative_path(self):
        with self.assertRaises(ValueError):
            preflight.profile_for(Path("relative"))

    def test_profile_rejects_symlink_and_alias_ancestors(self):
        target = self.root / "target"
        target.mkdir()
        (target / "workspace").mkdir()
        link = self.root / "link"
        link.symlink_to(target, target_is_directory=True)
        for path in (link, link / "workspace"):
            with self.subTest(path=path), self.assertRaises(ValueError):
                preflight.profile_for(path)

    def test_profile_rejects_syntax_injection(self):
        for name in ('quote"', 'back\\slash', 'line\nbreak', 'return\rbreak'):
            directory = self.root / name
            directory.mkdir()
            with self.subTest(name=name), self.assertRaises(ValueError):
                preflight.profile_for(directory)

    def test_profile_rejects_missing_directory_and_regular_file(self):
        with self.assertRaises(FileNotFoundError):
            preflight.profile_for(self.root / "missing")
        regular = self.root / "file"
        regular.touch()
        with self.assertRaises(ValueError):
            preflight.profile_for(regular)

    def test_no_sandbox_launch_is_a_failure_not_a_denial_pass(self):
        failed = subprocess.CompletedProcess([], 1, stdout="", stderr="sandbox_apply: Operation not permitted")
        # Exercise the macOS failure branch without requiring /private/tmp on Linux.
        scratch = self.root / "synthetic-preflight"
        scratch.mkdir()
        with patch.object(preflight.tempfile, "mkdtemp", return_value=str(scratch)), \
             patch.object(preflight.platform, "system", return_value="Darwin"), \
             patch.object(preflight.subprocess, "run", return_value=failed) as launch, \
             patch.object(preflight.socket, "socket") as socket_factory:
            socket_factory.return_value.__enter__.return_value.getsockname.return_value = ("127.0.0.1", 12345)
            with self.assertRaisesRegex(RuntimeError, "failed before completion"):
                preflight.run_preflight()
        launch.assert_called_once()
        self.assertEqual(launch.call_args.args[0][0], "/usr/bin/sandbox-exec")
        self.assertTrue((scratch / "offline.sb").is_file())

    def test_other_platform_cannot_report_a_pass(self):
        with patch.object(preflight.platform, "system", return_value="Linux"):
            with self.assertRaisesRegex(RuntimeError, "requires macOS"):
                preflight.run_preflight()


if __name__ == "__main__":
    unittest.main()

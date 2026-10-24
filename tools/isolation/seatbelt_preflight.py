#!/usr/bin/env python3
"""Offline, synthetic Seatbelt diagnostics. This file never starts OpenCode."""

import argparse
import json
import os
from pathlib import Path
import platform
import socket
import subprocess
import tempfile

PYTHON = "/Library/Developer/CommandLineTools/Library/Frameworks/Python3.framework/Versions/3.9/bin/python3.9"


def profile_for(workspace):
    """Permit system runtime reads and workspace writes. Deny network by default."""
    workspace = Path(workspace)
    if not workspace.is_absolute() or workspace.is_symlink():
        raise ValueError("Workspace must be an absolute, non-symlink directory")
    resolved = workspace.resolve(strict=True)
    if resolved != workspace or not resolved.is_dir():
        raise ValueError("Workspace must use its canonical directory path")
    # Keep profile interpolation literal. Do not accept Seatbelt syntax in paths.
    if any(char in str(resolved) for char in '\\"\n\r'):
        raise ValueError("Workspace path contains unsupported characters")
    return '''(version 1)
(deny default)
(import "dyld-support.sb")
(allow process-exec)
(allow process-fork)
(allow sysctl-read)
(allow file-read-metadata
    (path-ancestors "/Library/Developer/CommandLineTools/Library/Frameworks/Python3.framework"))
(allow file-read*
    (subpath "/System/Library")
    (subpath "/usr/bin")
    (subpath "/usr/lib")
    (subpath "/usr/share")
    (subpath "/bin")
    (subpath "/sbin")
    (literal "/dev/urandom")
    (literal "/dev/random")
    (subpath "/Library/Developer/CommandLineTools/Library/Frameworks/Python3.framework")
    (literal "/private/var/select/sh")
    (subpath "%s"))
(allow file-write* (subpath "%s"))
''' % (resolved, resolved)


def clean_environment(workspace):
    workspace = Path(workspace)
    env = {"PATH": "/usr/bin:/bin", "LANG": "C", "LC_ALL": "C"}
    for key, relative in {
        "HOME": "home", "XDG_CONFIG_HOME": "config", "XDG_DATA_HOME": "data",
        "XDG_CACHE_HOME": "cache", "XDG_STATE_HOME": "state", "TMPDIR": "tmp",
    }.items():
        directory = workspace / relative
        directory.mkdir(mode=0o700)
        env[key] = str(directory)
    return env


def run_preflight():
    if platform.system() != "Darwin":
        raise RuntimeError("This diagnostic requires macOS and sandbox-exec")
    root = Path(tempfile.mkdtemp(prefix="ra9-seatbelt-", dir="/private/tmp")).resolve()
    workspace, sibling = root / "workspace", root / "sibling"
    workspace.mkdir(mode=0o700)
    sibling.mkdir(mode=0o700)
    canary = sibling / "canary.txt"
    canary.write_text("FABRICATED_SIBLING_CANARY\n")
    (workspace / "input.txt").write_text("PUBLIC_CANARY\n")
    (workspace / "escape").symlink_to(sibling, target_is_directory=True)
    profile = root / "offline.sb"
    profile.write_text(profile_for(workspace))
    env = clean_environment(workspace)
    probe = workspace / "probe.py"
    # This is the only executed payload. It uses fabricated files and loopback.
    probe.write_text(PROBE)
    results = []
    with socket.socket() as listener, canary.open() as inherited:
        listener.bind(("127.0.0.1", 0))
        listener.listen(1)
        os.set_inheritable(inherited.fileno(), True)
        command = [
            "/usr/bin/sandbox-exec", "-f", str(profile), PYTHON,
            "-I", "-B", str(probe), str(sibling),
            str(listener.getsockname()[1]), str(inherited.fileno()),
        ]
        completed = subprocess.run(
            command, cwd=workspace, env=env, close_fds=True,
            stdin=subprocess.DEVNULL, stdout=subprocess.PIPE,
            stderr=subprocess.PIPE, text=True, timeout=30,
        )
    # Never interpret a failed sandbox launch as a successful denial probe.
    if completed.returncode != 0:
        raise RuntimeError("Sandbox probe failed before completion: " + completed.stderr.strip())
    child = json.loads(completed.stdout)
    results.extend(child["checks"])
    results.append({"name": "sibling canary intact", "passed": canary.read_text() == "FABRICATED_SIBLING_CANARY\n"})
    results.append({"name": "no sibling file created", "passed": not (sibling / "new.txt").exists()})
    results.append({"name": "workspace write persisted", "passed": (workspace / "output.txt").read_text() == "PUBLIC_OUTPUT\n"})
    return {
        "scope": "synthetic offline boundary only",
        "opencodeStarted": False,
        "productionReady": False,
        "macOS": platform.mac_ver()[0],
        "runtime": PYTHON + " -I -B",
        "scratch": str(root),
        "profile": str(profile),
        "profileText": profile.read_text(),
        "environmentKeys": sorted(env),
        "process": child["process"],
        "checks": results,
        "passed": all(item["passed"] for item in results),
        "remainingGates": [
            "Public repository staging and complete candidate runtime audit",
            "Private OpenCode standalone server and effective native-policy tests",
            "Network allowance review and repeated canaries",
            "One synthetic provider request before real repository admission",
        ],
    }


PROBE = r'''
import errno, json, os, pathlib, socket, subprocess, sys
workspace = pathlib.Path.cwd()
sibling = pathlib.Path(sys.argv[1])
port, inherited_fd = int(sys.argv[2]), int(sys.argv[3])
checks = []

def check(name, passed):
    checks.append({"name": name, "passed": bool(passed)})

def denied(name, operation):
    try:
        operation()
    except OSError as error:
        check(name, error.errno in (errno.EPERM, errno.EACCES))
    else:
        check(name, False)

check("allowed read", (workspace / "input.txt").read_text() == "PUBLIC_CANARY\n")
(workspace / "output.txt").write_text("PUBLIC_OUTPUT\n")
check("allowed directory listing", "input.txt" in os.listdir(workspace))
denied("absolute sibling read", lambda: (sibling / "canary.txt").read_text())
denied("relative sibling read", lambda: pathlib.Path("../sibling/canary.txt").read_text())
denied("sibling listing", lambda: os.listdir(sibling))
denied("sibling write", lambda: (sibling / "new.txt").write_text("BAD"))
denied("symlink read", lambda: (workspace / "escape/canary.txt").read_text())
denied("symlink write", lambda: (workspace / "escape/canary.txt").write_text("BAD"))
denied("hardlink admission denied", lambda: os.link(sibling / "canary.txt", workspace / "hardlink"))
# The writable data-volume alias must not bypass the system runtime allowlist.
alias = pathlib.Path("/System/Volumes/Data") / str(sibling).lstrip("/")
denied("data-volume alias read", lambda: (alias / "canary.txt").read_text())
denied("data-volume alias listing", lambda: os.listdir(alias))
denied("data-volume alias write", lambda: (alias / "new.txt").write_text("BAD"))
child = subprocess.run(["/bin/sh", "-c", '/bin/cat "$1"', "probe", str(sibling / "canary.txt")], capture_output=True)
check("shell child denied", child.returncode != 0 and child.stdout == b"" and b"Operation not permitted" in child.stderr)
check("environment allowlist", set(os.environ) == {"HOME", "PATH", "LANG", "LC_ALL", "TMPDIR", "XDG_CONFIG_HOME", "XDG_DATA_HOME", "XDG_CACHE_HOME", "XDG_STATE_HOME"})
check("scratch environment paths", all(pathlib.Path(os.environ[key]).parent == workspace for key in ("HOME", "TMPDIR", "XDG_CONFIG_HOME", "XDG_DATA_HOME", "XDG_CACHE_HOME", "XDG_STATE_HOME")))
try:
    os.fstat(inherited_fd)
except OSError as error:
    check("inheritable parent descriptor closed", error.errno == errno.EBADF)
else:
    check("inheritable parent descriptor closed", False)
denied("TCP loopback denied", lambda: socket.create_connection(("127.0.0.1", port), timeout=2))
denied("UDP socket denied", lambda: socket.socket(socket.AF_INET, socket.SOCK_DGRAM).sendto(b"PUBLIC", ("127.0.0.1", port)))
print(json.dumps({"checks": checks, "process": {"pid": os.getpid(), "parentPid": os.getppid()}}))
'''


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--report", type=Path, required=True, help="New JSON report path outside the repository")
    args = parser.parse_args()
    try:
        report = run_preflight()
    except (OSError, ValueError, RuntimeError, subprocess.TimeoutExpired) as error:
        parser.exit(1, "Preflight failed: %s\n" % error)
    # Never overwrite an existing report or follow a report symlink.
    with args.report.open("x") as handle:
        json.dump(report, handle, indent=2)
        handle.write("\n")
    print("%d/%d checks passed; OpenCode was not started; production gate remains blocked." % (
        sum(item["passed"] for item in report["checks"]), len(report["checks"])))
    return 0 if report["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())

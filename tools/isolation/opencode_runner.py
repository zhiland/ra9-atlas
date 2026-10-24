#!/usr/bin/env python3
"""Run pinned OpenCode in a fresh Seatbelt workspace with a fixed inference relay."""

import argparse
import base64
import difflib
import hashlib
import http.client
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import io
import json
import os
from pathlib import Path, PurePosixPath
import re
import secrets
import shutil
import signal
import socket
import stat
import subprocess
import tarfile
import tempfile
import threading
import time
import urllib.error
import urllib.request

from seatbelt_preflight import PYTHON, PROBE, clean_environment, profile_for

BINARY = Path("/opt/homebrew/Cellar/opencode-v2/2.0.32/bin/opencode")
BINARY_SHA256 = "e43ec2df6f36842fd17d1a71a866acb9a84884b489988376c19bf9a7250dabbf"
RIPGREP = Path("/opt/homebrew/Cellar/ripgrep/15.2.0/bin/rg")
PCRE = Path("/opt/homebrew/Cellar/pcre2/10.49/lib/libpcre2-8.0.dylib")
RIPGREP_SHA256 = "468681470b3ed6291dc85691e83c5d2f8fc6c6ec25b164ffa66248713a7e28a3"
PCRE_SHA256 = "1c0890a01bd446b5174e4ce7c35e1e14f39d2e88b7b5160572198ec26647d2da"
FREE_MODEL = "glm-5.3-flash-free"
REPOSITORY = "zhiland/ra9-atlas"
MAX_BODY = 8 * 1024 * 1024


def allowed_path(name):
    path = PurePosixPath(name)
    excluded = {".git", ".opencode", ".agents", ".claude", "node_modules", "__pycache__"}
    return (not path.is_absolute() and ".." not in path.parts and bool(path.parts)
            and not re.search(r'[\x00-\x1f\x7f"\\]', name)
            and not excluded.intersection(path.parts)
            and not any(part.startswith(".env") for part in path.parts)
            and not name.startswith("notes/evidence/")
            and not path.name.endswith(".log")
            and path.name not in {"opencode.json", "opencode.jsonc", ".DS_Store"})


def unpack_public_archive(data, destination):
    """Validate every entry before creating any file. Never use tar.extract."""
    with tarfile.open(fileobj=io.BytesIO(data)) as archive:
        entries = archive.getmembers()
        names = set()
        for entry in entries:
            if not allowed_path(entry.name) or not (entry.isdir() or entry.isfile()):
                raise ValueError("Disallowed public archive entry: " + entry.name)
            if entry.name in names:
                raise ValueError("Duplicate archive entry: " + entry.name)
            names.add(entry.name)
        destination.mkdir(mode=0o700)
        for entry in entries:
            target = destination / entry.name
            if entry.isdir():
                target.mkdir(parents=True, exist_ok=True)
            else:
                target.parent.mkdir(parents=True, exist_ok=True)
                with target.open("xb") as output, archive.extractfile(entry) as source:
                    shutil.copyfileobj(source, output)
                target.chmod(0o600)


def public_archive(repository, commit):
    if not re.fullmatch(r"[0-9a-f]{40}", commit):
        raise ValueError("Use a full public commit SHA")
    # Anonymous GitHub API confirmation: no credential helper, host tokens, or redirects.
    connection = http.client.HTTPSConnection("api.github.com", timeout=20)
    try:
        for route in ["", "/commits/" + commit]:
            connection.request("GET", "/repos/" + REPOSITORY + route,
                               headers={"User-Agent": "ra9-isolation-runner"})
            response = connection.getresponse()
            if response.status != 200:
                raise RuntimeError("Anonymous public commit verification failed: HTTP %s" % response.status)
            value = json.loads(response.read())
            if not route and value.get("private") is not False:
                raise RuntimeError("Repository is not confirmed public")
            if route and value.get("sha") != commit:
                raise RuntimeError("Public commit SHA mismatch")
    finally:
        connection.close()
    # Export verified objects, not `git archive`: local replace refs and
    # export-subst attributes can substitute unpublished content or ref names.
    environment = {
        "PATH": "/usr/bin:/bin", "LANG": "C", "LC_ALL": "C",
        "GIT_CONFIG_NOSYSTEM": "1", "GIT_CONFIG_GLOBAL": "/dev/null",
        "GIT_NO_REPLACE_OBJECTS": "1", "GIT_TERMINAL_PROMPT": "0",
        "GIT_NO_LAZY_FETCH": "1",
    }

    def object_bytes(kind, oid):
        if not re.fullmatch(r"[0-9a-f]{40}", oid):
            raise ValueError("Invalid Git object ID")
        content = subprocess.check_output(
            ["/usr/bin/git", "-C", str(repository), "--no-replace-objects", "cat-file", kind, oid],
            env=environment, stdin=subprocess.DEVNULL, close_fds=True)
        header = (kind + " " + str(len(content)) + "\0").encode("ascii")
        if hashlib.sha1(header + content).hexdigest() != oid:
            raise ValueError("Git object hash mismatch: " + oid)
        return content

    commit_bytes = object_bytes("commit", commit)
    first_line = commit_bytes.split(b"\n", 1)[0]
    if not re.fullmatch(rb"tree [0-9a-f]{40}", first_line):
        raise ValueError("Public commit has no valid root tree")
    output = io.BytesIO()
    with tarfile.open(fileobj=output, mode="w") as archive:
        def append_tree(oid, prefix="", depth=0):
            if depth > 100:
                raise ValueError("Public tree exceeds supported directory depth")
            data = object_bytes("tree", oid)
            offset = 0
            while offset < len(data):
                separator = data.index(b" ", offset)
                end = data.index(b"\0", separator + 1)
                mode = data[offset:separator]
                name = data[separator + 1:end].decode("utf-8")
                if "/" in name or not name:
                    raise ValueError("Invalid Git tree entry name")
                path = prefix + name
                if not allowed_path(path):
                    raise ValueError("Disallowed public tree entry: " + path)
                raw_oid = data[end + 1:end + 21]
                if len(raw_oid) != 20:
                    raise ValueError("Truncated Git tree object")
                child_oid = raw_oid.hex()
                offset = end + 21
                if mode == b"40000":
                    append_tree(child_oid, path + "/", depth + 1)
                elif mode in (b"100644", b"100755"):
                    content = object_bytes("blob", child_oid)
                    entry = tarfile.TarInfo(path)
                    entry.size = len(content)
                    entry.mode = 0o600
                    archive.addfile(entry, io.BytesIO(content))
                else:
                    raise ValueError("Public tree contains unsupported entry: " + path)

        append_tree(first_line[5:].decode("ascii"))
    return output.getvalue()


class InferenceRelay:
    """Only POST chat completions through one explicitly admitted provider route."""
    def __init__(self, route=None):
        self.enabled = False
        self.records = []
        self.route = route
        self.model = route.model if route is not None else FREE_MODEL
        relay = self

        class Handler(BaseHTTPRequestHandler):
            protocol_version = "HTTP/1.0"

            def log_message(self, *_args):
                pass

            def do_POST(self):
                try:
                    length = int(self.headers.get("Content-Length", "0"))
                    if self.path != "/v1/chat/completions" or not 0 < length <= MAX_BODY:
                        self.send_error(403)
                        return
                    body = self.rfile.read(length)
                    value = json.loads(body)
                    if not isinstance(value, dict) or not isinstance(value.get('tools', []), list):
                        self.send_error(400)
                        return
                    if any(not isinstance(t, dict) or not isinstance(t.get('function', {}), dict)
                           or not isinstance(t.get('function', {}).get('name', ''), str)
                           for t in value.get('tools', [])):
                        self.send_error(400)
                        return
                    exposed = {tool.get("function", {}).get("name", "") for tool in value.get("tools", [])}
                    if value.get("model") != relay.model or not relay.enabled or "execute" in exposed:
                        self.send_error(403)
                        return
                    if relay.route is not None:
                        try:
                            status, content_type, data = relay.route.complete(value)
                        except ValueError:
                            self.send_error(403, 'Controlled inference route rejected request')
                            relay.records.append({"model": relay.model, "status": "route-rejected"})
                            return
                        relay.records.append({"model": relay.model, "status": status,
                                              "requestBytes": length, "tools": sorted(exposed)})
                        # Stop SDK retries/fallback on an unavailable free route.
                        self.send_response(200 if status == 200 else 403)
                        self.send_header('Content-Type', content_type)
                        self.end_headers()
                        self.wfile.write(data)
                        return
                    remote = http.client.HTTPSConnection("opencode.ai", timeout=90)
                    try:
                        # Preserve the genuine client's protocol/authentication headers.
                        # Only the destination and hop-by-hop framing are replaced.
                        headers = {key: value for key, value in self.headers.items()
                                   if key.lower() not in {"host", "connection", "content-length", "transfer-encoding"}}
                        remote.request("POST", "/inference/openai/v1/chat/completions", body=body,
                                       headers=headers)
                        result = remote.getresponse()
                        relay.records.append({"model": FREE_MODEL, "status": result.status,
                                              "requestBytes": length, "tools": sorted(exposed)})
                        self.send_response(result.status)
                        self.send_header("Content-Type", result.getheader("Content-Type", "application/json"))
                        self.end_headers()
                        while True:
                            chunk = result.read1(65536)
                            if not chunk:
                                break
                            self.wfile.write(chunk)
                            self.wfile.flush()
                    finally:
                        remote.close()
                except (OSError, ValueError, http.client.HTTPException):
                    relay.records.append({"model": relay.model, "status": "relay-error"})
                    self.close_connection = True

        self.server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        self.server.daemon_threads = True
        self.port = self.server.server_port
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()

    def close(self):
        self.enabled = False
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=2)


def candidate_profile(workspace, ports):
    result = profile_for(workspace)
    result += '\n(allow file-read* file-write* (literal "/dev/null"))\n'
    result += '\n(allow file-read-metadata file-test-existence (path-ancestors "%s"))\n' % workspace
    for port in ports:
        if not isinstance(port, int) or not 1024 <= port <= 65535:
            raise ValueError("Expected an unprivileged loopback port")
    server_port, relay_port = ports
    result += '(allow network-bind (local tcp "localhost:%d"))\n' % server_port
    result += '(allow network-inbound (local tcp "localhost:%d"))\n' % server_port
    for port in (server_port, relay_port):
        result += '(allow network-outbound (remote tcp "localhost:%d"))\n' % port
    return result


def configuration(relay_port, canary_directory, route=None):
    config = {
        "$schema": "https://opencode.ai/config.json", "update": "disable",
        "snapshots": False, "formatter": False,
        "model": "opencode/" + FREE_MODEL,
        "permissions": [
            {"action": "execute", "resource": "*", "effect": "deny"},
            {"action": "browser", "resource": "*", "effect": "deny"},
        ],
        "providers": {"opencode": {
            "settings": {"baseURL": "http://127.0.0.1:%d/v1" % relay_port, "apiKey": "public"},
            "models": {FREE_MODEL: {"settings": {"baseURL": "http://127.0.0.1:%d/v1" % relay_port}}},
        }},
        "policies": [
            {"action": "provider.use", "resource": "*", "effect": "deny"},
            {"action": "provider.use", "resource": "opencode", "effect": "allow"},
            {"action": "tool.use", "resource": "*", "effect": "deny"},
            *[{"action": "tool.use", "resource": action + ":*", "effect": "allow"}
              for action in ["read", "edit", "glob", "grep", "question"]],
            *[{"action": "integration.use", "resource": kind + ":*", "effect": "deny"}
              for kind in ["mcp", "plugin", "skill"]],
        ],
    }
    if route is not None:
        config['model'] = route.provider_id + '/' + route.alias
        config['providers'] = {route.provider_id: route.settings(relay_port)}
        config['policies'][1]['resource'] = route.provider_id
    # These inert, fabricated integrations must be blocked before execution.
    config["plugins"] = [str(canary_directory / "plugin.mjs")]
    config["mcp"] = {"servers": {"runner-canary": {"type": "local", "command": [
        "/bin/sh", "-c", "printf BAD > " + str(canary_directory / "mcp-started")
    ]}}}
    return config


def wait_for_policy(api, sleep=time.sleep):
    api("/api/model")  # Location boot alone does not activate every post-plugin.
    for _ in range(100):
        plugins = api("/api/plugin")["data"]
        if any(p["id"] == "opencode.config.policy" and p["state"]["status"] == "active" for p in plugins):
            return plugins
        sleep(.1)
    raise RuntimeError("Native policy plugin not active")


def audit_tree(directory):
    files = {}
    for current, dirs, names in os.walk(directory, followlinks=False):
        for name in dirs + names:
            path = Path(current) / name
            info = path.lstat()
            relative = path.relative_to(directory).as_posix()
            if not allowed_path(relative) or not (stat.S_ISDIR(info.st_mode) or stat.S_ISREG(info.st_mode)):
                raise ValueError("Unsafe output path: " + relative)
            if stat.S_ISREG(info.st_mode):
                if info.st_nlink != 1:
                    raise ValueError("Hardlinked output: " + relative)
                files[relative] = path.read_bytes()
    return files


def patch_text(before, after):
    def lines(content):
        # Git hunks use LF only. Bare CR and Unicode separators are file content.
        parts = content.decode("utf-8").split("\n")
        return [part + "\n" for part in parts[:-1]] + ([parts[-1]] if parts[-1] else [])

    result = []
    for name in sorted(before.keys() | after.keys()):
        if before.get(name) == after.get(name):
            continue
        left, right = "a/" + name, "b/" + name
        if " " in name:
            left, right = json.dumps(left, ensure_ascii=False), json.dumps(right, ensure_ascii=False)
        result.append("diff --git %s %s\n" % (left, right))
        if name not in before:
            result.append("new file mode 100644\n")
        elif name not in after:
            result.append("deleted file mode 100644\n")
        old = lines(before.get(name, b""))
        new = lines(after.get(name, b""))
        result.extend(difflib.unified_diff(old, new,
                      fromfile=left if name in before else "/dev/null",
                      tofile=right if name in after else "/dev/null"))
    return "".join(line if line.endswith("\n") else line + "\n\\ No newline at end of file\n" for line in result)


class IsolatedRun:
    def __init__(self, route=None):
        self.route = route
        self.provider_id = route.provider_id if route is not None else 'opencode'
        self.model_alias = route.alias if route is not None else FREE_MODEL
        if route is not None:
            route.prepare()  # Public catalog only. No inference or credentials.
        for path, digest in [(BINARY, BINARY_SHA256), (RIPGREP, RIPGREP_SHA256), (PCRE, PCRE_SHA256)]:
            if hashlib.sha256(path.read_bytes()).hexdigest() != digest:
                raise RuntimeError("Pinned runtime changed. Review and revalidate: " + str(path))
        self.root = Path(tempfile.mkdtemp(prefix="ra9-opencode-run-", dir="/private/tmp")).resolve()
        self.workspace = self.root / "workspace"
        self.workspace.mkdir(mode=0o700)
        self.project = self.workspace / "project"
        self.project.mkdir(mode=0o700)
        self.env = clean_environment(self.workspace)
        self.env.update({
            "OPENCODE_CONFIG_PROJECT_DISABLE": "1", "OPENCODE_DISABLE_CLAUDE_CODE": "1",
            "OPENCODE_DISABLE_MODELS_FETCH": "1", "OPENCODE_DISABLE_FILEWATCHER": "1",
            "OPENCODE_DISABLE_FFF": "1",
        })
        runtime = self.workspace / "bin"
        runtime.mkdir()
        self.binary = runtime / "opencode"
        shutil.copyfile(BINARY, self.binary)
        self.binary.chmod(0o700)
        shutil.copyfile(RIPGREP, runtime / "rg")
        (runtime / "rg").chmod(0o700)
        libraries = self.workspace / "lib"
        libraries.mkdir()
        shutil.copyfile(PCRE, libraries / PCRE.name)
        self.env["PATH"] = str(runtime) + ":/usr/bin:/bin"
        self.launcher = self.workspace / "launch.py"
        # sandbox-exec is a platform executable and strips DYLD_* on this host.
        # Restore only this generated scratch path after entering the boundary.
        self.launcher.write_text(
            'import os,sys\nfrom pathlib import Path\n'
            'os.environ["DYLD_LIBRARY_PATH"]=str(Path(__file__).parent/"lib")\n'
            'os.execv(sys.argv[1],sys.argv[1:])\n')
        self.relay = InferenceRelay(route)
        with socket.socket() as reservation:
            reservation.bind(("127.0.0.1", 0))
            self.port = reservation.getsockname()[1]
        self.profile = self.root / "boundary.sb"
        self.profile.write_text(candidate_profile(self.workspace, (self.port, self.relay.port)))
        config_dir = Path(self.env["XDG_CONFIG_HOME"]) / "opencode"
        config_dir.mkdir()
        self.config = config_dir / "opencode.json"
        self.canaries = self.workspace / "integration-canaries"
        self.canaries.mkdir()
        (self.canaries / "plugin.mjs").write_text(
            'import {writeFileSync} from "node:fs";\n'
            'writeFileSync(%s,"BAD");\nexport default {id:"runner.integration.canary",effect:()=>{}};\n'
            % json.dumps(str(self.canaries / "plugin-started")))
        skill = config_dir / "skills/runner-canary"
        skill.mkdir(parents=True)
        (skill / "SKILL.md").write_text(
            '---\nname: runner-canary\ndescription: Synthetic integration admission probe.\n---\nSynthetic fixture only.\n')
        self.config.write_text(json.dumps(configuration(self.relay.port, self.canaries, route), indent=2))
        self.config_bytes = self.config.read_bytes()
        self.password = secrets.token_urlsafe(32)
        self.env["OPENCODE_PASSWORD"] = self.password
        self.process = None
        self.log = None
        self.report = {"binarySHA256": BINARY_SHA256, "ripgrepSHA256": RIPGREP_SHA256,
                       "pcreSHA256": PCRE_SHA256, "checks": [], "network": "fixed inference relay only",
                       "provider": self.provider_id, "model": self.relay.model}

    def command(self, args, cwd=None, timeout=240):
        return subprocess.run([*self.prefix(), str(self.binary), *args],
                              cwd=cwd or self.project, env=self.env, close_fds=True,
                              stdin=subprocess.DEVNULL, capture_output=True, text=True, timeout=timeout)

    def prefix(self):
        return ["/usr/bin/sandbox-exec", "-f", str(self.profile), PYTHON, "-I", "-B", str(self.launcher)]

    def api(self, path, body=None):
        headers = {"Authorization": "Basic " + base64.b64encode(("opencode:" + self.password).encode()).decode(),
                   "Content-Type": "application/json"}
        request = urllib.request.Request("http://127.0.0.1:%d%s" % (self.port, path),
                                         data=None if body is None else json.dumps(body).encode(), headers=headers)
        # A local API call must never honor an inherited HTTP proxy.
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
        with opener.open(request, timeout=10) as response:
            return json.load(response)

    def check(self, name, passed):
        self.report["checks"].append({"name": name, "passed": bool(passed)})
        if not passed:
            raise RuntimeError("Check failed: " + name)

    def boundary_checks(self):
        sibling = self.root / "sibling"
        sibling.mkdir()
        canary = sibling / "canary.txt"
        canary.write_text("FABRICATED_SIBLING_CANARY\n")
        (self.workspace / "input.txt").write_text("PUBLIC_CANARY\n")
        (self.workspace / "escape").symlink_to(sibling, target_is_directory=True)
        probe = self.workspace / "probe.py"
        probe.write_text(PROBE)
        env = {k: v for k, v in self.env.items() if not k.startswith("OPENCODE_")}
        with socket.socket() as listener, canary.open() as inherited:
            listener.bind(("127.0.0.1", 0))
            listener.listen(1)
            os.set_inheritable(inherited.fileno(), True)
            result = subprocess.run(["/usr/bin/sandbox-exec", "-f", str(self.profile), PYTHON,
                                     "-I", "-B", str(probe), str(sibling),
                                     str(listener.getsockname()[1]), str(inherited.fileno())],
                                    cwd=self.workspace, env=env, close_fds=True, stdin=subprocess.DEVNULL,
                                    capture_output=True, text=True, timeout=20)
        self.check("boundary payload completed", result.returncode == 0)
        for item in json.loads(result.stdout)["checks"]:
            self.check(item["name"], item["passed"])
        extra = subprocess.run([
            "/usr/bin/sandbox-exec", "-f", str(self.profile), PYTHON, "-I", "-B", "-c",
            'import socket,errno,sys\ntry: socket.create_connection(("192.0.2.1",443),timeout=2)\n'
            'except OSError as e: sys.exit(0 if e.errno in (errno.EPERM,errno.EACCES) else 1)\n'
            'sys.exit(1)\n',
        ], cwd=self.workspace, env=env, close_fds=True, stdin=subprocess.DEVNULL,
            capture_output=True, timeout=5)
        self.check("direct external TCP denied", extra.returncode == 0)
        self.check("sibling canary intact", canary.read_text() == "FABRICATED_SIBLING_CANARY\n")
        self.check("sibling write absent", not (sibling / "new.txt").exists())
        (self.workspace / "escape").unlink()
        if self.route is not None:
            # Probe a fabricated file beside the credential store, never its secrets.
            with self.route.credential_canary() as credential_canary:
                code = ('import os,sys\np=sys.argv[1]\n'
                        'actions=[lambda:open(p).read(),lambda:os.listdir(os.path.dirname(p)),lambda:open(p+".new","w")]\n'
                        'for action in actions:\n'
                        ' try: action()\n'
                        ' except PermissionError: continue\n'
                        ' else: sys.exit(1)\n')
                denied = subprocess.run(['/usr/bin/sandbox-exec', '-f', str(self.profile), PYTHON,
                    '-I', '-B', '-c', code, str(credential_canary)], cwd=self.workspace,
                    env=env, close_fds=True, stdin=subprocess.DEVNULL, capture_output=True, timeout=10)
                self.check(getattr(self.route, 'boundary_label', 'Nous auth-store read/list/write denied'), denied.returncode == 0)

    def start(self):
        self.boundary_checks()
        runtime_check = subprocess.run([
            *self.prefix(), str(self.workspace / "bin/rg"), "--version",
        ], cwd=self.project, env=self.env, close_fds=True, stdin=subprocess.DEVNULL,
            capture_output=True, text=True, timeout=5)
        self.check("pinned ripgrep executes inside boundary", runtime_check.returncode == 0)
        self.log = (self.root / "server.log").open("w")
        self.process = subprocess.Popen([
            *self.prefix(), str(self.binary), "serve",
            "--hostname", "127.0.0.1", "--port", str(self.port), "--stdio", "--print-logs",
        ], cwd=self.project, env=self.env, close_fds=True, stdin=subprocess.PIPE,
            stdout=subprocess.PIPE, stderr=self.log, start_new_session=True)
        for _ in range(100):
            if self.process.poll() is not None:
                raise RuntimeError("Private server exited before readiness")
            try:
                info = self.api("/api/info")
                break
            except (OSError, urllib.error.URLError):
                time.sleep(.1)
        else:
            raise RuntimeError("Private server readiness timeout")
        self.check("private server PID matches launched process", info["pid"] == self.process.pid)
        self.report["serverPID"] = info["pid"]
        self.check("pinned version", info["version"] == "2.0.32")
        plugins = wait_for_policy(self.api)
        self.check("native policy plugin active", True)
        self.check("external plugins absent", all(p["source"]["type"] == "builtin" for p in plugins))
        expected = configuration(self.relay.port, self.canaries, self.route)
        expected["model"] = {"providerID": self.provider_id, "model": self.model_alias}
        # Config parses plugin shorthand into operations. Validate every other
        # setting exactly, plus the single source path and unchanged source bytes.
        expected.pop("plugins")
        documents = [e for e in self.api("/api/config") if e["type"] == "document"]
        self.check("single generated config source", len(documents) == 1 and documents[0]["path"] == str(self.config))
        actual = dict(documents[0]["info"])
        actual.pop("plugins", None)
        self.check("effective config matches", actual == expected)
        self.check("MCP integrations absent", not self.api("/api/mcp")["data"])
        self.check("skills absent", not self.api("/api/skill")["data"])
        self.check("configured plugin blocked before import", not (self.canaries / "plugin-started").exists())
        self.check("configured MCP command blocked", not (self.canaries / "mcp-started").exists())
        model = next(m for m in self.api("/api/model")["data"] if m["id"] == self.model_alias)
        self.check("effective model uses relay", model["settings"]["baseURL"] == "http://127.0.0.1:%d/v1" % self.relay.port)
        if self.route is not None and self.provider_id == 'ra9-openrouter':
            expected_cost = self.route.settings(self.relay.port)['models'][self.model_alias]['cost']
            self.check('catalog model matches admitted price', bool(model['cost']) and
                       all(c['input'] == expected_cost['input'] and c['output'] == expected_cost['output']
                           for c in model['cost']))
        else:
            self.check("catalog model is free", all(c["input"] == 0 and c["output"] == 0 for c in model["cost"]))
        sid = self.api("/api/session", {"title": "Runner policy gate", "location": {"directory": str(self.project)}})["data"]["id"]
        for action, expected in [("read", "allow"), ("edit", "allow"), ("glob", "allow"), ("grep", "allow"),
                                 ("shell", "deny"), ("external_directory", "deny"), ("execute", "deny"),
                                 ("runner_mcp_probe", "deny"), ("subagent", "deny")]:
            effect = self.api("/api/session/%s/permission" % sid,
                              {"action": action, "resources": ["synthetic-public"]})["data"]["effect"]
            self.check("native %s = %s" % (action, expected), effect == expected)
        if self.route is not None:
            self.check(getattr(self.route, 'readiness_label', 'Nous dedicated login available'), self.route.ready())

    def run_prompt(self, prompt):
        self.relay.enabled = True
        try:
            result = self.command(["run", "--server", "http://127.0.0.1:%d" % self.port,
                                   "--model", self.provider_id + '/' + self.model_alias, "--format", "json",
                                   "--title", "Isolated public task", "--auto", "--", prompt])
        finally:
            self.relay.enabled = False
        (self.root / "run.jsonl").write_text(result.stdout)
        (self.root / "client.log").write_text(result.stderr)
        self.check("client exited successfully", result.returncode == 0)
        events = [json.loads(line) for line in result.stdout.splitlines() if line.strip()]
        self.check("no model error events", bool(events) and not any(e.get("type") == "error" for e in events))
        self.check("model returned final text", any(e.get("type") == "text" for e in events))
        self.check("config unchanged", self.config.read_bytes() == self.config_bytes)
        self.check("provider returned HTTP 200", bool(self.relay.records)
                   and all(r["status"] == 200 for r in self.relay.records))
        return result.stdout

    def close(self):
        if self.process is not None and self.process.poll() is None:
            os.killpg(self.process.pid, signal.SIGTERM)
            try:
                self.process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                os.killpg(self.process.pid, signal.SIGKILL)
                self.process.wait()
        if self.process is not None:
            for pipe in [self.process.stdin, self.process.stdout]:
                pipe.close()
        if self.log is not None:
            self.log.close()
        self.relay.close()
        self.report["relay"] = self.relay.records
        if self.route is not None and hasattr(self.route, 'summary'):
            self.report['spendControl'] = self.route.summary()
        self.report["serverStopped"] = self.process is None or self.process.poll() is not None
        (self.root / "report.json").write_text(json.dumps(self.report, indent=2) + "\n")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="mode", required=True)
    self_test = sub.add_parser("self-test", help="Run synthetic isolation, native policy, and provider probes")
    run = sub.add_parser("run", help="Run against an anonymously verified public commit")
    run.add_argument("--repository", type=Path, required=True)
    run.add_argument("--commit", required=True)
    run.add_argument("--prompt", required=True)
    for command in (self_test, run):
        command.add_argument('--provider', choices=('opencode', 'nous-free', 'openrouter'), default='opencode')
        command.add_argument('--free-model', help='Explicit admitted Nous free route; never used for GLM')
        command.add_argument('--model', help='Explicit allowlisted OpenRouter model')
        command.add_argument('--max-cost-usd', default='0', help='Conservative per-run OpenRouter reservation, max 0.10')
        command.add_argument('--allow-public-training', action='store_true', help='Permit Contributor processing of admitted public data')
    args = parser.parse_args()
    route = None
    if args.provider == 'openrouter':
        if args.free_model or not args.model:
            parser.error('--provider openrouter requires --model and forbids --free-model')
        from openrouter_provider import OpenRouterProvider
        route = OpenRouterProvider(args.model, args.max_cost_usd, args.allow_public_training)
    elif args.model or args.max_cost_usd != '0' or args.allow_public_training:
        parser.error('OpenRouter model/budget/training flags require --provider openrouter')
    elif args.provider == 'nous-free':
        from nous_free_provider import NousFreeProvider, DEFAULT_MODEL
        route = NousFreeProvider(args.free_model or DEFAULT_MODEL)
    elif args.free_model is not None:
        parser.error('--free-model requires --provider nous-free')
    instance = IsolatedRun(route)
    print("Scratch: " + str(instance.root), flush=True)
    try:
        instance.start()
        if args.mode == "self-test":
            (instance.project / "public.txt").write_text("PUBLIC_CANARY\n")
            output = instance.run_prompt('Use glob to find *.txt. Use grep to find PUBLIC_CANARY. '
                                         'Read public.txt with the read tool. Create result.txt containing exactly '
                                         'ISOLATED_PROVIDER_OK followed by a newline. Use the write tool. '
                                         'Use only glob, grep, read and write; shell is denied. '
                                         'After the write succeeds, reply DONE without further tool calls.')
            completed = {event["part"]["tool"] for event in map(json.loads, output.splitlines())
                         if event.get("type") == "tool_use" and event["part"]["state"]["status"] == "completed"}
            instance.check("read/search/write tool executions completed", {"read", "write", "glob", "grep"}.issubset(completed))
            instance.check("real model read/edit", (instance.project / "result.txt").read_text() == "ISOLATED_PROVIDER_OK\n")
        else:
            data = public_archive(args.repository, args.commit)
            admission = instance.workspace / "admission"
            unpack_public_archive(data, admission)
            for entry in admission.iterdir():
                entry.rename(instance.project / entry.name)
            admission.rmdir()
            before = audit_tree(instance.project)
            instance.run_prompt(args.prompt)
            after = audit_tree(instance.project)
            (instance.root / "changes.patch").write_text(patch_text(before, after))
            instance.report["publicCommit"] = args.commit
            instance.report["changedFiles"] = sorted(name for name in before.keys() | after.keys()
                                                    if before.get(name) != after.get(name))
        instance.report["passed"] = True
    except Exception as error:
        instance.report["passed"] = False
        instance.report["failure"] = str(error)
        raise
    finally:
        instance.close()
    print("Passed. Report: " + str(instance.root / "report.json"))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

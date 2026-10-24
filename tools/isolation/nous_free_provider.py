"""A fixed, free Nous route. Credentials remain in a trusted Hermes helper."""
import base64
from contextlib import contextmanager
from decimal import Decimal, InvalidOperation
import http.client
import json
import os
from pathlib import Path
import subprocess
import tempfile

HOST = 'inference-api.nousresearch.com'
BASE_URL = 'https://' + HOST + '/v1'
DEFAULT_MODEL = 'poolside/laguna-xs-2.1:free'
MODELS = (DEFAULT_MODEL, 'stepfun/step-3.7-flash:free', 'meituan/longcat-2.5-preview:free')
AUTH_HOME = Path.home() / '.local/share/ra9-atlas/nous-auth'
MAX_RESPONSE = 16 * 1024 * 1024
# Routing, provider selection, credentials and fallback fields are deliberately absent.
FIELDS = frozenset(('model', 'messages', 'tools', 'tool_choice', 'stream', 'stream_options',
                    'temperature', 'top_p', 'max_tokens', 'max_completion_tokens', 'stop',
                    'frequency_penalty', 'presence_penalty', 'seed', 'parallel_tool_calls',
                    'reasoning', 'reasoning_effort', 'response_format', 'user', 'store'))


def admit_request(value, model, allowed_models=MODELS):
    if model not in allowed_models or not isinstance(value, dict) or value.get('model') != model:
        raise ValueError('Only the selected Nous free model is permitted')
    if set(value) - FIELDS:
        raise ValueError('Unsupported Nous request fields; routing and fallbacks are forbidden')
    if 'store' in value and value['store'] is not False:
        raise ValueError('Nous request storage cannot be enabled')
    if not isinstance(value.get('messages'), list) or not value['messages']:
        raise ValueError('Nous messages must be an array')
    for message in value['messages']:
        if not isinstance(message, dict) or message.get('role') not in ('system', 'user', 'assistant', 'tool'):
            raise ValueError('Malformed inference message envelope')
        content = message.get('content')
        if isinstance(content, list):
            if any(not isinstance(p, dict) or p.get('type') != 'text' or not isinstance(p.get('text'), str) for p in content):
                raise ValueError('Only text message parts are admitted')
        elif not isinstance(content, str) and not (content is None and message['role'] == 'assistant'):
            raise ValueError('Malformed inference message content')
        if message['role'] == 'tool' and not isinstance(message.get('tool_call_id'), str):
            raise ValueError('Malformed tool result')
        calls = message.get('tool_calls', [])
        if not isinstance(calls, list) or any(not isinstance(c, dict) or c.get('type') != 'function'
                or not isinstance(c.get('id'), str) or not isinstance(c.get('function'), dict)
                or not isinstance(c['function'].get('name'), str)
                or not isinstance(c['function'].get('arguments'), str) for c in calls):
            raise ValueError('Malformed tool call envelope')
    tools = value.get('tools', [])
    if not isinstance(tools, list) or any(not isinstance(t, dict) for t in tools):
        raise ValueError('Malformed Nous tool definitions')
    if any(t.get('type') != 'function' or not isinstance(t.get('function'), dict)
           or not isinstance(t['function'].get('name'), str) or not t['function']['name']
           or not isinstance(t['function'].get('parameters', {}), dict) for t in tools):
        raise ValueError('Malformed Nous function definition')
    if any(t.get('function', {}).get('name') == 'execute' for t in tools):
        raise ValueError('Code Mode is forbidden')


def admit_catalog(catalog, model):
    if model not in MODELS or not isinstance(catalog, dict) or not isinstance(catalog.get('data'), list):
        raise ValueError('Invalid Nous free catalog')
    rows = [r for r in catalog['data'] if isinstance(r, dict) and r.get('id') == model]
    if len(rows) != 1:
        raise ValueError('Selected Nous free model is absent or duplicated')
    row = rows[0]
    prices = row.get('pricing')
    if not isinstance(prices, dict) or not {'prompt', 'completion'}.issubset(prices):
        raise ValueError('Nous input/output prices must be explicit')
    try:
        if any(isinstance(v, bool) or not Decimal(str(v)).is_finite() or Decimal(str(v)) != 0 for v in prices.values()):
            raise ValueError('Every declared Nous price must be zero')
    except InvalidOperation:
        raise ValueError('Malformed Nous price') from None
    context = row.get('context_length')
    parameters = row.get('supported_parameters')
    if type(context) is not int or context < 64000 or not isinstance(parameters, list) or 'tools' not in parameters:
        raise ValueError('Nous free model needs 64K context and tool support')
    return row


def exchange(method, path, body=None, bearer=None):
    """No proxy environment, alternate origin, redirects or arbitrary endpoint."""
    if (method, path) not in (('GET', '/v1/models'), ('POST', '/v1/chat/completions')):
        raise ValueError('Forbidden Nous endpoint')
    headers = {'Content-Type': 'application/json', 'Accept': 'application/json',
               'User-Agent': 'ra9-atlas-controlled-runner/1'}
    if bearer is not None:
        if not isinstance(bearer, str) or not bearer or any(c.isspace() for c in bearer):
            raise ValueError('Invalid Nous credential')
        headers['Authorization'] = 'Bearer ' + bearer
    connection = http.client.HTTPSConnection(HOST, timeout=90)
    try:
        connection.request(method, path, body=body, headers=headers)
        response = connection.getresponse()
        data = response.read(MAX_RESPONSE + 1)
        if len(data) > MAX_RESPONSE:
            raise ValueError('Nous response exceeds the bounded buffer')
        if 300 <= response.status < 400:
            raise ValueError('Nous redirects are forbidden')
        return response.status, response.getheader('Content-Type', 'application/json'), data
    finally:
        connection.close()


def public_metadata(model):
    status, _, data = exchange('GET', '/v1/models')
    if status != 200:
        raise ValueError('Nous catalog is unavailable')
    return admit_catalog(json.loads(data), model)


class NousFreeProvider:
    provider_id = 'ra9-nous'
    alias = 'free'

    def __init__(self, model=DEFAULT_MODEL):
        if model not in MODELS:
            raise ValueError('Unsupported Nous free model')
        self.model = model
        self.metadata = None

    def prepare(self):
        self.metadata = public_metadata(self.model)

    def settings(self, relay_port):
        if self.metadata is None:
            raise ValueError('Nous catalog must pass before configuration')
        url = 'http://127.0.0.1:%d/v1' % relay_port
        return {'name': 'Controlled Nous Free', 'package': '@opencode/ai/providers/openai-compatible',
                'settings': {'baseURL': url, 'apiKey': 'public', 'encoding': 'none'},
                'models': {self.alias: {'modelID': self.model, 'name': self.model,
                    'settings': {'baseURL': url},
                    'capabilities': {'tools': True, 'input': ['text'], 'output': ['text']},
                    'limit': {'context': min(self.metadata['context_length'], 262144), 'output': 8192},
                    'cost': {'input': 0, 'output': 0}}}}

    def ready(self):
        reply = self._helper({"action": "ready"})
        return reply.get("authenticated") is True

    @contextmanager
    def credential_canary(self):
        if not AUTH_HOME.is_dir() or AUTH_HOME.is_symlink():
            raise ValueError('Dedicated Nous auth directory is unavailable')
        with tempfile.NamedTemporaryFile(prefix='.ra9-boundary-', dir=AUTH_HOME, delete=False) as probe:
            path = Path(probe.name)
            probe.write(b'FABRICATED_AUTH_CANARY\n')
        try:
            yield path
            if path.read_bytes() != b'FABRICATED_AUTH_CANARY\n' or Path(str(path) + '.new').exists():
                raise ValueError('Nous auth canary was changed')
        finally:
            path.unlink(missing_ok=True)
            Path(str(path) + '.new').unlink(missing_ok=True)

    def complete(self, value):
        admit_request(value, self.model)
        reply = self._helper({"action": "complete", "model": self.model, "request": value})
        return self._response(reply)

    def _helper(self, payload):
        # Resolve the installed runtime without loading a chat or changing its model.
        env = {'HOME': str(Path.home()), 'PATH': '/usr/bin:/bin', 'LANG': 'en_US.UTF-8',
               'HERMES_HOME': str(AUTH_HOME), 'HERMES_SHARED_AUTH_DIR': str(AUTH_HOME / 'shared')}
        try:
            command = json.loads(subprocess.check_output(
                [str(Path.home() / '.local/bin/hermes'), '--print-runtime-command'],
                env=env, stdin=subprocess.DEVNULL, stderr=subprocess.DEVNULL, text=True, timeout=20))
        except (OSError, subprocess.SubprocessError, json.JSONDecodeError):
            raise ValueError('Hermes runtime unavailable') from None
        entry = "runpy.run_module('hermes_cli.main', run_name='__main__', alter_sys=True)"
        if (not isinstance(command, list) or len(command) != 4 or command[1:3] != ['-I', '-c']
                or not isinstance(command[3], str) or not command[3].endswith(entry)):
            raise ValueError('Unrecognized Hermes runtime launcher')
        helper = str(Path(__file__).with_name('nous_free_helper.py').resolve())
        command[3] = command[3][:-len(entry)] + 'runpy.run_path(%r, run_name="__main__")' % helper
        command.insert(1, '-B')
        try:
            result = subprocess.run(command, input=json.dumps(payload),
                env=env, text=True, capture_output=True, timeout=180, close_fds=True)
        except (OSError, subprocess.SubprocessError):
            raise ValueError('Nous credential helper failed') from None
        # Never forward helper stderr, exceptions or credentials into model-visible errors.
        if result.returncode != 0:
            raise ValueError('Nous helper unavailable; verify dedicated Portal login')
        try:
            reply = json.loads(result.stdout)
            if not isinstance(reply, dict):
                raise ValueError('Invalid Nous helper response')
            if reply.get('error'):
                raise ValueError('Nous helper rejected request; check login and free catalog')
            return reply
        except (TypeError, json.JSONDecodeError):
            raise ValueError('Invalid Nous helper response') from None

    @staticmethod
    def _response(reply):
        try:
            status, content_type = reply['status'], reply['contentType']
            data = base64.b64decode(reply['body'], validate=True)
            if type(status) is not int or status not in (200, 400, 401, 403, 404, 429):
                raise ValueError('Unexpected Nous response status')
            if (not isinstance(content_type, str) or '\r' in content_type or '\n' in content_type
                    or content_type.split(';')[0] not in ('application/json', 'text/event-stream') or len(data) > MAX_RESPONSE):
                raise ValueError('Invalid Nous response framing')
            # Error bodies can contain upstream account details. Return only a generic status.
            if status != 200:
                data = json.dumps({'error': {'message': 'Nous free route refused: HTTP %s' % status}}).encode()
                content_type = 'application/json'
            return status, content_type, data
        except (KeyError, TypeError, json.JSONDecodeError):
            raise ValueError('Invalid Nous helper response') from None

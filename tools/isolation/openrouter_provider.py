"""Fixed OpenRouter relay with host-only credentials and bounded paid opt-in."""
from contextlib import contextmanager
from decimal import Decimal, InvalidOperation
import http.client
import json
from pathlib import Path
import tempfile
import threading

from nous_free_provider import admit_request, NousFreeProvider, MAX_RESPONSE

MODELS = ('xiaomi/mimo-v2.6-flash', 'deepseek/deepseek-v4.1-flash',
          'meta/muse-spark-1.3-contributor', 'qwen/qwen3-coder-next',
          'minimax/minimax-m3.1-flash', 'recursive/flint-v1.0:free',
          'cohere/north-mini-code:free')
KEY_FILE = Path.home() / '.env'
MAX_INPUT_PRICE = Decimal('0.20')  # USD per million tokens
MAX_OUTPUT_PRICE = Decimal('1.00')
OUTPUT_TOKENS = 2048
MAX_REQUEST = 8 * 1024 * 1024  # Matches the canonical relay's framing bound.


def account_balance():
    """Return only the remaining credit amount, not account identifiers."""
    status, _, data = exchange('GET', '/api/v1/credits', authenticated=True)
    if status != 200:
        raise ValueError('OpenRouter balance check unavailable')
    try:
        value = json.loads(data)['data']
        amounts = [value['total_credits'], value['total_usage']]
        numbers = [Decimal(str(v)) for v in amounts]
        if any(isinstance(v, bool) for v in amounts) or any(not n.is_finite() or n < 0 for n in numbers):
            raise ValueError('Invalid credit amount')
        return max(Decimal(0), numbers[0] - numbers[1])
    except (KeyError, TypeError, InvalidOperation, ValueError):
        raise ValueError('OpenRouter balance response invalid') from None


def output_capacity(row):
    top = row.get('top_provider')
    value = top.get('max_completion_tokens') if isinstance(top, dict) else None
    if type(value) is not int or not 0 < value <= row['context_length']:
        raise ValueError('Explicit model completion capacity required')
    return value


def read_key():
    """Read one literal variable. Never execute the file or import other secrets."""
    key = ''
    for line in KEY_FILE.read_text().splitlines():
        line = line.strip()
        if line.startswith('export '):
            line = line[7:].lstrip()
        name, separator, value = line.partition('=')
        if separator and name.strip() == 'OPENROUTER_API_KEY':
            key = value.strip()
            if len(key) >= 2 and key[0] == key[-1] and key[0] in "\"'":
                key = key[1:-1]
            elif ' #' in key:
                key = key.split(' #', 1)[0].rstrip()
    if not key or any(c.isspace() for c in key) or any(c in key for c in '$`'):
        raise ValueError('OpenRouter literal credential unavailable')
    return key


def exchange(method, path, body=None, authenticated=False, timeout=90):
    if (method, path) not in (('GET', '/api/v1/models'), ('GET', '/api/v1/key'),
                             ('GET', '/api/v1/credits'), ('POST', '/api/v1/chat/completions')):
        raise ValueError('Forbidden OpenRouter endpoint')
    headers = {'Content-Type': 'application/json', 'User-Agent': 'ra9-atlas-controlled-runner/1'}
    if authenticated:
        headers['Authorization'] = 'Bearer ' + read_key()
    connection = http.client.HTTPSConnection('openrouter.ai', timeout=timeout)
    try:
        connection.request(method, path, body=body, headers=headers)
        response = connection.getresponse()
        data = response.read(MAX_RESPONSE + 1)
        if 300 <= response.status < 400 or len(data) > MAX_RESPONSE:
            raise ValueError('OpenRouter redirect or oversized response refused')
        return response.status, response.getheader('Content-Type', 'application/json'), data
    finally:
        connection.close()


def metadata(model):
    status, _, raw = exchange('GET', '/api/v1/models')
    if status != 200:
        raise ValueError('OpenRouter catalog unavailable')
    catalog = json.loads(raw)
    if not isinstance(catalog, dict) or not isinstance(catalog.get('data'), list) or any(not isinstance(r, dict) for r in catalog['data']):
        raise ValueError('Malformed OpenRouter catalog envelope')
    rows = [r for r in catalog['data'] if r.get('id') == model]
    if len(rows) != 1 or model not in MODELS:
        raise ValueError('OpenRouter model absent or not allowlisted')
    row = rows[0]
    prices = row.get('pricing', {})
    try:
        if not isinstance(prices, dict) or not {'prompt', 'completion'}.issubset(prices):
            raise ValueError('Missing OpenRouter prices')
        numbers = {k: Decimal(str(v)) for k, v in prices.items()}
        if any(not v.is_finite() or v < 0 for v in numbers.values()):
            raise ValueError('Invalid OpenRouter prices')
        if numbers['prompt'] * 1000000 > MAX_INPUT_PRICE or numbers['completion'] * 1000000 > MAX_OUTPUT_PRICE:
            raise ValueError('OpenRouter price ceiling exceeded')
        if any(v != 0 for k, v in numbers.items() if k not in ('prompt', 'completion', 'input_cache_read', 'input_cache_write')):
            raise ValueError('Unbounded OpenRouter additional charge')
        if any(v > numbers['prompt'] for k, v in numbers.items() if k.startswith('input_cache_')):
            raise ValueError('OpenRouter cache charge exceeds input ceiling')
        if model.endswith(':free') and any(numbers.values()):
            raise ValueError('Free OpenRouter route acquired a charge')
    except (InvalidOperation, TypeError):
        raise ValueError('Malformed OpenRouter prices') from None
    parameters = row.get('supported_parameters')
    if (type(row.get('context_length')) is not int or row['context_length'] < 64000
            or not isinstance(parameters, list) or any(not isinstance(p, str) for p in parameters)
            or 'tools' not in parameters):
        raise ValueError('OpenRouter model needs 64K context and tools')
    return row


class OpenRouterProvider:
    provider_id = 'ra9-openrouter'
    alias = 'selected'
    boundary_label = 'OpenRouter credential-directory read/list/write denied'
    readiness_label = 'OpenRouter host credential available'

    def __init__(self, model, budget='0', allow_training=False, long_run=False):
        if model not in MODELS:
            raise ValueError('Unsupported OpenRouter model')
        if model == 'meta/muse-spark-1.3-contributor' and not allow_training:
            raise ValueError('Contributor route requires explicit public-data training opt-in')
        self.model, self.metadata = model, None
        self.allow_training = allow_training
        if long_run and model != 'xiaomi/mimo-v2.6-flash':
            raise ValueError('Long run is admitted only for MiMo')
        self.long_run = long_run
        self.request_limit = None if long_run else 6
        self.output_limit = None if long_run else OUTPUT_TOKENS
        self.body_limit = MAX_REQUEST if long_run else 65536
        amount = Decimal(budget)
        if not amount.is_finite() or not 0 <= amount <= Decimal('0.10') or (long_run and amount != 0):
            raise ValueError('Run budget exceeds the explicitly selected mode ceiling')
        self.budget = None if long_run else amount
        self.reserved = Decimal(0)
        self.requests = 0
        self.stop_reason = None
        self.usage_reports = 0
        self.reported_cost = Decimal(0)
        self.cost_reports = 0
        self.reported_tokens = {'prompt_tokens': 0, 'completion_tokens': 0}
        self.reasoning_tokens = 0
        self.reasoning_reports = 0
        self.lock = threading.Lock()

    def prepare(self):
        self.metadata = metadata(self.model)
        if self.long_run:
            if 'reasoning' not in self.metadata['supported_parameters']:
                raise ValueError('Reasoning support required for autonomous MiMo')
            self.output_limit = output_capacity(self.metadata)
        elif not self.model.endswith(':free') and self.budget == 0:
            raise ValueError('Paid OpenRouter route requires explicit run budget')

    def settings(self, relay_port):
        # The same V2 OpenAI-compatible transport as the verified Nous route.
        settings = NousFreeProvider.settings(self, relay_port)
        settings['name'] = 'Controlled OpenRouter'
        prices = self.metadata['pricing']
        settings['models'][self.alias]['cost'] = {
            'input': float(Decimal(prices['prompt']) * 1000000),
            'output': float(Decimal(prices['completion']) * 1000000)}
        if self.long_run:
            # The relay buffers bounded upstream output before sending headers.
            # Native OpenCode defaults to a 300s header deadline and retries on
            # that timeout, even while a reasoning response is still arriving.
            settings['settings'].update({'headerTimeout': False, 'timeout': False})
            settings['models'][self.alias]['limit'] = {
                'context': self.metadata['context_length'], 'output': self.output_limit}
        return settings

    def ready(self):
        return bool(read_key())

    @contextmanager
    def credential_canary(self):
        # Fabricated file beside ~/.env, never expose or read the real key file.
        with tempfile.NamedTemporaryFile(prefix='.ra9-key-boundary-', dir=KEY_FILE.parent, delete=False) as file:
            path = Path(file.name)
            file.write(b'FABRICATED_AUTH_CANARY\n')
        try:
            yield path
            if path.read_bytes() != b'FABRICATED_AUTH_CANARY\n' or Path(str(path) + '.new').exists():
                raise ValueError('OpenRouter auth canary changed')
        finally:
            path.unlink(missing_ok=True)
            Path(str(path) + '.new').unlink(missing_ok=True)

    def complete(self, value):
        admit_request(value, self.model, MODELS)
        if any(t.get('type') != 'function' for t in value.get('tools', [])):
            raise ValueError('OpenRouter server-side tools are forbidden')
        row = metadata(self.model)  # Revalidate prices before every completion.
        if self.long_run:
            if self.output_limit is None:
                raise ValueError('Autonomous MiMo must pass preparation first')
            if 'reasoning' not in row['supported_parameters'] or output_capacity(row) < self.output_limit:
                raise ValueError('MiMo reasoning/capacity admission changed')
            if account_balance() <= 0:
                with self.lock:
                    self.stop_reason = 'account_exhausted'
                raise ValueError('OpenRouter account balance exhausted')
        request = dict(value)
        requested_output = request.pop('max_completion_tokens', request.pop('max_tokens', OUTPUT_TOKENS))
        if type(requested_output) is not int or requested_output <= 0:
            raise ValueError('Invalid OpenRouter output limit')
        request['max_tokens'] = self.output_limit if self.long_run else min(requested_output, OUTPUT_TOKENS)
        if self.long_run:
            request['reasoning'] = {'enabled': True}
        request['provider'] = {'allow_fallbacks': False, 'require_parameters': True,
            'data_collection': 'allow' if self.allow_training else 'deny',
            'max_price': {'prompt': float(Decimal(row['pricing']['prompt']) * 1000000),
                          'completion': float(Decimal(row['pricing']['completion']) * 1000000),
                          'request': 0, 'image': 0}}
        if self.model.endswith(':free'):
            request['provider']['max_price'].update(prompt=0, completion=0)
        request['usage'] = {'include': True}
        body = json.dumps(request, ensure_ascii=True).encode()
        if len(body) > self.body_limit:
            raise ValueError('OpenRouter request exceeds bounded probe size')
        # Conservative reservation, not a provider-enforced account billing cap.
        # Reserve twice the serialized byte count plus 2048 framing tokens.
        input_bound = 2 * len(body) + 2048
        reservation = (input_bound * Decimal(row['pricing']['prompt'])
                       + request['max_tokens'] * Decimal(row['pricing']['completion']))
        with self.lock:
            # Split guards so the host report records which limit stopped the run.
            if self.request_limit is not None and self.requests >= self.request_limit:
                self.stop_reason = 'request_limit'
                raise ValueError('OpenRouter probe request/budget limit reached')
            if self.budget is not None and self.reserved + reservation > self.budget:
                self.stop_reason = 'budget_exhausted'
                raise ValueError('OpenRouter probe request/budget limit reached')
            self.requests += 1
            self.reserved += reservation  # Never refund failed or interrupted requests.
        status, content_type, data = exchange('POST', '/api/v1/chat/completions', body, authenticated=True,
                                             timeout=300 if self.long_run else 90)
        if status != 200:
            data = json.dumps({'error': {'message': 'Controlled inference refused: HTTP %s' % status}}).encode()
            content_type = 'application/json'
        if ('\r' in content_type or '\n' in content_type or
                content_type.split(';')[0] not in ('application/json', 'text/event-stream')):
            raise ValueError('Unexpected OpenRouter response framing')
        if status == 200:
            self.record_usage(content_type, data)
        elif status == 402:
            with self.lock:
                self.stop_reason = 'account_exhausted'
        if self.long_run:
            print(json.dumps({'event': 'provider_usage', **self.summary()}), flush=True)
        return status, content_type, data

    def record_usage(self, content_type, data):
        """Extract only numeric billing fields, never persist response text."""
        if content_type.split(';')[0] == 'text/event-stream':
            documents = [line[5:].strip() for line in data.splitlines() if line.startswith(b'data:')]
        else:
            documents = [data]
        usage = None
        for document in documents:
            try:
                event = json.loads(document)
            except (ValueError, UnicodeError):
                continue
            if isinstance(event, dict) and isinstance(event.get('usage'), dict):
                usage = event['usage']  # Final cumulative report, not one charge per chunk.
        if usage is None:
            return
        with self.lock:
            self.usage_reports += 1
            cost = usage.get('cost')
            try:
                number = Decimal(str(cost))
                if not isinstance(cost, bool) and number.is_finite() and number >= 0:
                    self.reported_cost += number
                    self.cost_reports += 1
            except InvalidOperation:
                pass
            for field in self.reported_tokens:
                if type(usage.get(field)) is int and usage[field] >= 0:
                    self.reported_tokens[field] += usage[field]
            details = usage.get('completion_tokens_details')
            reasoning = details.get('reasoning_tokens') if isinstance(details, dict) else None
            if type(reasoning) is int and reasoning >= 0:
                self.reasoning_tokens += reasoning
                self.reasoning_reports += 1

    def summary(self):
        return {'requestCount': self.requests, 'reservedUSD': str(self.reserved),
                'stopReason': self.stop_reason,
                'longRun': self.long_run, 'requestLimit': self.request_limit,
                'outputLimit': self.output_limit, 'reasoningRequested': self.long_run,
                'runBudgetUSD': None if self.budget is None else str(self.budget),
                'spendPolicy': 'account_balance' if self.long_run else 'run_reservation',
                'trainingOptIn': self.allow_training,
                'usageReports': self.usage_reports, 'costReports': self.cost_reports,
                'apiReportedCostUSD': str(self.reported_cost) if self.cost_reports else None,
                'apiReportedTokens': dict(self.reported_tokens),
                'apiReportedReasoningTokens': self.reasoning_tokens if self.reasoning_reports else None}

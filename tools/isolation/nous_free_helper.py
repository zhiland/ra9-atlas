"""Trusted credential helper. Never run inside the model's workspace."""
import base64
import json
from pathlib import Path
import sys

# This file runs through the installed Hermes bootstrap, outside Seatbelt.
# It imports only the credential adapter, never the Hermes agent or its tools.
sys.path.insert(0, str(Path(__file__).resolve().parent))
from nous_free_provider import BASE_URL, admit_request, exchange, admit_catalog


def invoke(value, adapter):
    model, request = value['model'], value['request']
    admit_request(request, model)
    if not adapter.is_authenticated():
        raise ValueError('Dedicated Nous login required')
    credential = adapter.get_credential()
    if credential.base_url.rstrip('/') != BASE_URL:
        raise ValueError('Only the production Nous inference origin is permitted')
    status, _, raw = exchange('GET', '/v1/models', bearer=credential.bearer)
    if status != 200:
        raise ValueError('Authenticated Nous catalog is unavailable')
    admit_catalog(json.loads(raw), model)  # Refresh price/admission before every inference.
    status, content_type, data = exchange('POST', '/v1/chat/completions',
        body=json.dumps(request).encode(), bearer=credential.bearer)
    return {'status': status, 'contentType': content_type,
            'body': base64.b64encode(data).decode('ascii')}


def main():
    try:
        from hermes_cli.proxy.adapters.nous_portal import NousPortalAdapter
        value = json.loads(sys.stdin.read(8 * 1024 * 1024 + 1))
        adapter = NousPortalAdapter()
        if value.get('action') == 'ready':
            result = {'authenticated': adapter.is_authenticated()}
        elif value.get('action') == 'complete':
            result = invoke(value, adapter)
        else:
            raise ValueError('Unsupported helper action')
    except Exception:
        result = {'error': 'Nous free helper rejected the request'}
    print(json.dumps(result))


if __name__ == '__main__':
    main()

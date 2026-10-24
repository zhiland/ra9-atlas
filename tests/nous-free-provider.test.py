"""Free-price admission, credential exclusion and fixed-route regressions."""
import base64
import copy
from http.client import HTTPConnection
import io
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import types
import unittest
from unittest.mock import Mock, patch
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'tools/isolation'))
import nous_free_provider as nous
import nous_free_helper as helper
import opencode_runner as runner


def catalog():
    return {'data': [{'id': nous.DEFAULT_MODEL, 'pricing': {'prompt': '0', 'completion': '0', 'input_cache_read': '0'},
                      'context_length': 262144, 'supported_parameters': ['tools', 'tool_choice']}]}


def request():
    return {'model': nous.DEFAULT_MODEL, 'messages': [{'role': 'user', 'content': 'SYNTHETIC_PUBLIC'}],
            'tools': [{'type': 'function', 'function': {'name': 'read'}}], 'stream': True}


def credential_adapter(base=nous.BASE_URL):
    adapter = Mock()
    adapter.is_authenticated.return_value = True
    adapter.get_credential.return_value = Mock(base_url=base, bearer='FABRICATED_CREDENTIAL')
    return adapter


class FreeProviderTests(unittest.TestCase):
    def test_route_transport_failure_returns_nonretryable_scrubbed403(self):
        route = Mock(model=nous.DEFAULT_MODEL)
        route.complete.side_effect = OSError('PRIVATE_TRANSPORT_DETAIL')
        relay = runner.InferenceRelay(route); self.addCleanup(relay.close); relay.enabled = True
        connection = HTTPConnection('127.0.0.1', relay.port, timeout=2)
        connection.request('POST', '/v1/chat/completions', body=json.dumps(request()))
        response = connection.getresponse(); body = response.read(); connection.close()
        self.assertEqual(response.status, 403)
        self.assertNotIn(b'PRIVATE_TRANSPORT_DETAIL', body)
        route.complete.assert_called_once()

    def test_malformed_tool_names_return_controlled400_without_provider_call(self):
        route = Mock(model=nous.DEFAULT_MODEL)
        relay = runner.InferenceRelay(route); self.addCleanup(relay.close); relay.enabled = True
        for name in ({}, [], None):
            value = request(); value['tools'][0]['function']['name'] = name
            connection = HTTPConnection('127.0.0.1', relay.port, timeout=2)
            connection.request('POST', '/v1/chat/completions', body=json.dumps(value))
            response = connection.getresponse(); response.read(); connection.close()
            self.assertEqual(response.status, 400)
        route.complete.assert_not_called()

    def test_opencode_store_false_is_admitted_but_storage_cannot_be_enabled(self):
        r = request(); r['store'] = False
        nous.admit_request(r, nous.DEFAULT_MODEL)
        for value in (True, None, 'false', 0):
            r['store'] = value
            with self.subTest(value=value), self.assertRaises(ValueError):
                nous.admit_request(r, nous.DEFAULT_MODEL)

    def test_explicit_zero_prices_and_decimal_zero_are_admitted(self):
        c = catalog(); c['data'][0]['pricing']['prompt'] = '0.0000000000'
        self.assertEqual(nous.admit_catalog(c, nous.DEFAULT_MODEL)['context_length'], 262144)

    def test_missing_nonfinite_and_nonzero_prices_fail_closed(self):
        for price in ('0.1', '-1', 'NaN', 'Infinity', None, True, 'unknown', {}, []):
            c = catalog(); c['data'][0]['pricing']['prompt'] = price
            with self.subTest(price=price), self.assertRaises(ValueError):
                nous.admit_catalog(c, nous.DEFAULT_MODEL)
        for field in ('prompt', 'completion'):
            c = catalog(); del c['data'][0]['pricing'][field]
            with self.assertRaises(ValueError): nous.admit_catalog(c, nous.DEFAULT_MODEL)
        c = catalog(); c['data'][0]['pricing']['request'] = '1'
        with self.assertRaises(ValueError): nous.admit_catalog(c, nous.DEFAULT_MODEL)

    def test_catalog_requires_unique_exact_identity_context_and_tools(self):
        for change in (lambda c: c['data'].clear(), lambda c: c['data'].append(copy.deepcopy(c['data'][0])),
                       lambda c: c['data'][0].update(id='paid'), lambda c: c['data'][0].update(context_length=63999),
                       lambda c: c['data'][0].update(context_length=True), lambda c: c['data'][0].update(supported_parameters=None),
                       lambda c: c['data'][0].update(supported_parameters=['temperature'])):
            c = catalog(); change(c)
            with self.assertRaises(ValueError): nous.admit_catalog(c, nous.DEFAULT_MODEL)

    def test_paid_and_unlisted_free_models_are_rejected(self):
        for model in ('paid', 'unknown:free', nous.DEFAULT_MODEL.removesuffix(':free')):
            with self.assertRaises(ValueError): nous.NousFreeProvider(model)
            with self.assertRaises(ValueError): nous.admit_request(request(), model)

    def test_request_cannot_override_routing_credentials_or_fallbacks(self):
        nous.admit_request(request(), nous.DEFAULT_MODEL)
        for key in ('provider', 'models', 'fallback', 'baseURL', 'headers', 'api_key'):
            r = request(); r[key] = 'forbidden'
            with self.assertRaises(ValueError): nous.admit_request(r, nous.DEFAULT_MODEL)
        for tools in ({}, [None], [{'function': None}], [{'function': {'name': 'execute'}}]):
            r = request(); r['tools'] = tools
            with self.assertRaises(ValueError): nous.admit_request(r, nous.DEFAULT_MODEL)

    def test_helper_rejects_no_login_and_nonproduction_origins(self):
        a = credential_adapter(); a.is_authenticated.return_value = False
        with patch.object(helper, 'exchange') as network:
            with self.assertRaises(ValueError): helper.invoke({'model': nous.DEFAULT_MODEL, 'request': request()}, a)
            network.assert_not_called()
        for origin in ('http://localhost/v1', 'https://evil.example/v1', nous.BASE_URL + '/other'):
            with patch.object(helper, 'exchange') as network:
                with self.assertRaises(ValueError): helper.invoke({'model': nous.DEFAULT_MODEL, 'request': request()}, credential_adapter(origin))
                network.assert_not_called()

    def test_authenticated_catalog_is_refreshed_before_every_completion(self):
        responses = [(200, 'application/json', json.dumps(catalog()).encode()), (200, 'text/event-stream', b'data: [DONE]\n\n')]
        with patch.object(helper, 'exchange', side_effect=responses * 2) as network:
            for _ in range(2):
                reply = helper.invoke({'model': nous.DEFAULT_MODEL, 'request': request()}, credential_adapter())
                self.assertEqual(base64.b64decode(reply['body']), b'data: [DONE]\n\n')
                self.assertNotIn('FABRICATED_CREDENTIAL', json.dumps(reply))
            self.assertEqual([call.args[:2] for call in network.call_args_list], [('GET','/v1/models'), ('POST','/v1/chat/completions')] * 2)
            self.assertTrue(all(c.kwargs['bearer'] == 'FABRICATED_CREDENTIAL' for c in network.call_args_list))

    def test_price_change_prevents_inference(self):
        c = catalog(); c['data'][0]['pricing']['completion'] = '.001'
        with patch.object(helper, 'exchange', return_value=(200, 'application/json', json.dumps(c).encode())) as network:
            with self.assertRaises(ValueError): helper.invoke({'model': nous.DEFAULT_MODEL, 'request': request()}, credential_adapter())
            self.assertEqual(network.call_count, 1)

    def test_transport_cannot_follow_redirects_or_use_other_paths(self):
        connection = Mock(); response = connection.getresponse.return_value
        response.status = 302; response.read.return_value = b''
        with patch.object(nous.http.client, 'HTTPSConnection', return_value=connection) as factory:
            with self.assertRaises(ValueError): nous.exchange('GET', '/v1/models')
            factory.assert_called_once_with(nous.HOST, timeout=90)
            self.assertEqual(connection.request.call_count, 1)
            connection.close.assert_called_once()
        with patch.object(nous.http.client, 'HTTPSConnection') as factory:
            with self.assertRaises(ValueError): nous.exchange('POST', '/arbitrary')
            factory.assert_not_called()

    def test_config_contains_only_loopback_placeholder_and_selected_free_model(self):
        route = nous.NousFreeProvider(); route.metadata = catalog()['data'][0]
        config = runner.configuration(12345, Path('/synthetic'), route)
        self.assertEqual(config['model'], 'ra9-nous/free')
        self.assertEqual(set(config['providers']), {'ra9-nous'})
        self.assertEqual(config['policies'][1]['resource'], 'ra9-nous')
        text = json.dumps(config)
        self.assertNotIn(str(nous.AUTH_HOME), text)
        self.assertNotIn('FABRICATED_CREDENTIAL', text)
        self.assertNotIn('https://', text.replace('https://opencode.ai/config.json', ''))
        self.assertEqual(config['providers']['ra9-nous']['settings']['apiKey'], 'public')
        original = runner.configuration(12345, Path('/synthetic'))
        self.assertEqual(original['model'], 'opencode/' + runner.FREE_MODEL)
        self.assertEqual(set(original['providers']), {'opencode'})

    def test_parent_passes_no_credentials_and_sanitizes_helper_errors(self):
        route = nous.NousFreeProvider()
        command = ['/synthetic/python', '-I', '-c', "import runpy; runpy.run_module('hermes_cli.main', run_name='__main__', alter_sys=True)"]
        result = Mock(returncode=0, stdout=json.dumps({'error': 'FABRICATED_CREDENTIAL'}), stderr='FABRICATED_CREDENTIAL')
        with patch.object(nous.subprocess, 'check_output', return_value=json.dumps(command)), patch.object(nous.subprocess, 'run', return_value=result) as run:
            with self.assertRaises(ValueError) as caught: route.complete(request())
            self.assertNotIn('FABRICATED_CREDENTIAL', str(caught.exception))
            env = run.call_args.kwargs['env']
            self.assertEqual(set(env), {'HOME','PATH','LANG','HERMES_HOME','HERMES_SHARED_AUTH_DIR'})
            self.assertEqual(env['HERMES_HOME'], str(nous.AUTH_HOME))
            self.assertNotIn('FABRICATED_CREDENTIAL', run.call_args.kwargs['input'])
            self.assertTrue(run.call_args.kwargs['close_fds'])

    def test_parent_preserves_sse_and_scrubs_non200_account_errors(self):
        command = ['/synthetic/python', '-I', '-c', "import runpy; runpy.run_module('hermes_cli.main', run_name='__main__', alter_sys=True)"]
        for status in (200, 401, 429):
            data = b'data: [DONE]\n\n' if status == 200 else b'PRIVATE_ACCOUNT_DETAILS'
            reply = {'status': status, 'contentType': 'text/event-stream', 'body': base64.b64encode(data).decode()}
            result = Mock(returncode=0, stdout=json.dumps(reply))
            with patch.object(nous.subprocess, 'check_output', return_value=json.dumps(command)), patch.object(nous.subprocess, 'run', return_value=result):
                actual, content, body = nous.NousFreeProvider().complete(request())
                self.assertEqual(actual, status)
                self.assertEqual(body, data) if status == 200 else self.assertNotIn(b'PRIVATE_ACCOUNT_DETAILS', body)

    def test_readiness_is_boolean_only_and_contains_no_prompt(self):
        route = nous.NousFreeProvider()
        for value, expected in ((True, True), (False, False), ('yes', False)):
            with patch.object(route, '_helper', return_value={'authenticated': value}) as call:
                self.assertEqual(route.ready(), expected)
                call.assert_called_once_with({'action': 'ready'})

    def test_credential_canary_uses_dedicated_root_and_removes_only_its_files(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(nous, 'AUTH_HOME', Path(directory)):
            keep = Path(directory) / 'unrelated'; keep.write_text('KEEP')
            with nous.NousFreeProvider().credential_canary() as canary:
                self.assertEqual(canary.parent, Path(directory))
                self.assertEqual(canary.read_text(), 'FABRICATED_AUTH_CANARY\n')
            self.assertFalse(canary.exists()); self.assertEqual(keep.read_text(), 'KEEP')
            with self.assertRaises(ValueError):
                with nous.NousFreeProvider().credential_canary() as canary:
                    canary.write_text('CHANGED')
            self.assertFalse(canary.exists()); self.assertTrue(keep.exists())

    def test_status_helper_never_refreshes_or_exposes_a_credential(self):
        adapter = credential_adapter()
        modules = {}
        for name in ('hermes_cli', 'hermes_cli.proxy', 'hermes_cli.proxy.adapters', 'hermes_cli.proxy.adapters.nous_portal'):
            modules[name] = types.ModuleType(name)
        modules['hermes_cli.proxy.adapters.nous_portal'].NousPortalAdapter = lambda: adapter
        out = io.StringIO()
        with patch.dict(sys.modules, modules), patch('sys.stdin', io.StringIO('{"action":"ready"}')), patch('sys.stdout', out):
            helper.main()
        self.assertEqual(json.loads(out.getvalue()), {'authenticated': True})
        adapter.get_credential.assert_not_called()

    def test_quota_rejection_is_not_exposed_as_a_retryable_worker_error(self):
        route = Mock(model=nous.DEFAULT_MODEL)
        route.complete.return_value = (429, 'application/json', b'{"error":"free route unavailable"}')
        relay = runner.InferenceRelay(route); self.addCleanup(relay.close); relay.enabled = True
        c = HTTPConnection('127.0.0.1', relay.port, timeout=2); self.addCleanup(c.close)
        c.request('POST', '/v1/chat/completions', json.dumps(request()))
        r = c.getresponse(); self.assertEqual(r.status, 403); r.read()
        self.assertEqual(relay.records[0]['status'], 429)
        self.assertEqual(route.complete.call_count, 1)

    def test_relay_does_not_forward_client_headers_to_nous(self):
        route = Mock(model=nous.DEFAULT_MODEL); route.complete.return_value = (200, 'text/event-stream', b'data: [DONE]\n\n')
        relay = runner.InferenceRelay(route); self.addCleanup(relay.close); relay.enabled = True
        connection = HTTPConnection('127.0.0.1', relay.port, timeout=2); self.addCleanup(connection.close)
        connection.request('POST', '/v1/chat/completions', json.dumps(request()), headers={'Authorization':'Bearer DO_NOT_FORWARD'})
        response = connection.getresponse(); self.assertEqual(response.status, 200); response.read()
        route.complete.assert_called_once_with(request())
        self.assertNotIn('DO_NOT_FORWARD', json.dumps(relay.records))


if __name__ == '__main__': unittest.main()

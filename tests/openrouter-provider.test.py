"""Host-only credentials, exact routing and conservative spend admission."""
import copy
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch, Mock
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'tools/isolation'))
import openrouter_provider as router
import opencode_runner as runner

MODEL = 'xiaomi/mimo-v2.6-flash'


def row(model=MODEL):
    return {'id': model, 'context_length': 1050000,
            'supported_parameters': ['tools', 'max_tokens', 'reasoning'],
            'top_provider': {'max_completion_tokens': 131072},
            'pricing': {'prompt': '0.00000014', 'completion': '0.00000028', 'input_cache_read': '0.000000014'}}


def request():
    return {'model': MODEL, 'messages': [{'role': 'user', 'content': 'PUBLIC_SYNTHETIC'}],
            'store': False, 'max_tokens': 8192, 'stream': True}


class OpenRouterTests(unittest.TestCase):
    def test_self_test_rejects_crlf_instead_of_normalizing_it(self):
        for output, valid in ((runner.SELF_TEST_CONTENT.encode(), True),
                              (runner.SELF_TEST_CONTENT.replace('\n', '\r\n').encode(), False)):
            with tempfile.TemporaryDirectory() as directory:
                instance = Mock(root=Path(directory), project=Path(directory), report={})
                events = [json.dumps({'type': 'tool_use', 'part': {'tool': name, 'state': {'status': 'completed'}}})
                          for name in ('read', 'write', 'glob', 'grep')]
                def run_prompt(_prompt):
                    (instance.project / 'result.txt').write_bytes(output)
                    return '\n'.join(events)
                def check(name, passed):
                    if not passed: raise RuntimeError(name)
                instance.run_prompt.side_effect = run_prompt
                instance.check.side_effect = check
                with patch.object(runner, 'IsolatedRun', return_value=instance), patch.object(sys, 'argv', ['runner', 'self-test']):
                    if valid: self.assertEqual(runner.main(), 0)
                    else:
                        with self.assertRaisesRegex(RuntimeError, 'real model read/edit'): runner.main()

    def test_long_run_is_explicit_mimo_only_and_forces_reasoning(self):
        with self.assertRaises(ValueError): router.OpenRouterProvider(MODEL, '1')
        with self.assertRaises(ValueError): router.OpenRouterProvider('deepseek/deepseek-v4.1-flash', '1', long_run=True)
        with self.assertRaises(ValueError): router.OpenRouterProvider(MODEL, '0.01', long_run=True)
        provider = router.OpenRouterProvider(MODEL, long_run=True)
        self.assertEqual((provider.request_limit, provider.budget, provider.body_limit), (None, None, 8 * 1024 * 1024))
        value = request(); value['reasoning'] = {'enabled': False}; value['max_tokens'] = 2048
        with patch.object(router, 'metadata', return_value=row()), patch.object(router, 'account_balance', return_value=router.Decimal('1')), patch.object(router, 'exchange', return_value=(200, 'application/json', b'{}')) as network:
            provider.prepare()
            provider.requests = 125
            provider.reserved = router.Decimal('99')
            provider.complete(value)
        payload = json.loads(network.call_args.args[2])
        self.assertEqual(payload['reasoning'], {'enabled': True})
        self.assertEqual(payload['max_tokens'], 131072)
        self.assertEqual(provider.requests, 126)
        self.assertIsNone(provider.summary()['runBudgetUSD'])
        self.assertEqual(network.call_args.kwargs['timeout'], 300)
        self.assertFalse(payload['provider']['allow_fallbacks'])

    def test_long_run_stops_on_account_exhaustion_without_paid_post(self):
        provider = router.OpenRouterProvider(MODEL, long_run=True)
        with patch.object(router, 'metadata', return_value=row()), patch.object(router, 'account_balance', return_value=router.Decimal(0)), patch.object(router, 'exchange') as network:
            provider.prepare()
            with self.assertRaises(ValueError): provider.complete(request())
        network.assert_not_called()
        self.assertEqual(provider.stop_reason, 'account_exhausted')
        self.assertEqual(provider.requests, 0)

    def test_account_balance_is_numeric_only_and_fail_closed(self):
        for credits, usage, expected in ((1.5, .5, '1.0'), (1, 2, '0')):
            raw = json.dumps({'data': {'total_credits': credits, 'total_usage': usage}}).encode()
            with patch.object(router, 'exchange', return_value=(200, 'application/json', raw)):
                self.assertEqual(router.account_balance(), router.Decimal(expected))
        for document in ({}, {'data': None}, {'data': {'total_credits': True, 'total_usage': 0}},
                         {'data': {'total_credits': 'NaN', 'total_usage': 0}}):
            with patch.object(router, 'exchange', return_value=(200, 'application/json', json.dumps(document).encode())):
                with self.assertRaises(ValueError): router.account_balance()

    def test_partial_patch_export_retains_changes_without_claiming_success(self):
        with tempfile.TemporaryDirectory() as directory:
            instance = object.__new__(runner.IsolatedRun)
            instance.root = Path(directory); instance.project = instance.root / 'project'; instance.project.mkdir()
            instance.report = {'passed': False}
            before = runner.audit_tree(instance.project)
            (instance.project / 'work.txt').write_text('PUBLIC_PARTIAL\n')
            instance.export_patch(before, 'a' * 40, partial=True)
            self.assertTrue(instance.report['partial'])
            self.assertFalse(instance.report['passed'])
            self.assertEqual(instance.report['changedFiles'], ['work.txt'])
            self.assertIn('+PUBLIC_PARTIAL', (instance.root / 'changes.patch').read_text())

    def test_malformed_catalog_envelopes_fail_closed_with_value_error(self):
        for document in (None, [], {'data': None}, {'data': [None]}, {'data': ['model']}):
            with patch.object(router, 'exchange', return_value=(200, 'application/json', json.dumps(document).encode())):
                with self.subTest(document=document), self.assertRaises(ValueError): router.metadata(MODEL)

    def test_usage_reports_are_numeric_only_and_final_chunk_is_counted_once(self):
        provider = router.OpenRouterProvider(MODEL, '0.02')
        payload = {'usage': {'cost': .0001, 'prompt_tokens': 20, 'completion_tokens': 4},
                   'choices': [{'text': 'PRIVATE_TEXT_NOT_RECORDED'}]}
        chunk = b'data: ' + json.dumps(payload).encode() + b'\n\n'
        provider.record_usage('text/event-stream', chunk * 2 + b'data: [DONE]\n\n')
        provider.record_usage('application/json', json.dumps(payload).encode())
        summary = provider.summary()
        self.assertEqual(summary['apiReportedCostUSD'], '0.0002')
        self.assertEqual(summary['usageReports'], 2)
        self.assertEqual(summary['apiReportedTokens'], {'prompt_tokens': 40, 'completion_tokens': 8})
        self.assertNotIn('PRIVATE_TEXT', json.dumps(summary))

    def test_missing_or_invalid_cost_is_unavailable_not_zero(self):
        for value in (None, True, 'NaN', 'Infinity', '-1', {}):
            provider = router.OpenRouterProvider(MODEL, '0.02')
            provider.record_usage('application/json', json.dumps({'usage': {'cost': value}}).encode())
            self.assertIsNone(provider.summary()['apiReportedCostUSD'])

    def test_key_file_is_parsed_without_shell_execution_or_other_variables(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'key.env'
            path.write_text('OTHER_SECRET=never-read\nexport OPENROUTER_API_KEY="FABRICATED_KEY"\n')
            with patch.object(router, 'KEY_FILE', path):
                self.assertEqual(router.read_key(), 'FABRICATED_KEY')
                for value in ('$(touch bad)', '`touch bad`', 'has space', ''):
                    path.write_text('OPENROUTER_API_KEY=' + value)
                    with self.assertRaises(ValueError): router.read_key()

    def test_unknown_models_training_and_budget_require_explicit_admission(self):
        for model in ('openrouter/auto', 'unknown:free', MODEL + ':nitro'):
            with self.assertRaises(ValueError): router.OpenRouterProvider(model)
        with self.assertRaises(ValueError): router.OpenRouterProvider('meta/muse-spark-1.3-contributor', '0.02')
        for budget in ('NaN', 'Infinity', '-1', '0.11'):
            with self.assertRaises(ValueError): router.OpenRouterProvider(MODEL, budget)
        with patch.object(router, 'metadata', return_value=row()):
            with self.assertRaises(ValueError): router.OpenRouterProvider(MODEL).prepare()

    def test_live_catalog_prices_and_tools_are_required(self):
        def get(value):
            return patch.object(router, 'exchange', return_value=(200, 'application/json', json.dumps({'data': [value]}).encode()))
        with get(row()): self.assertEqual(router.metadata(MODEL)['id'], MODEL)
        changes = ({'prompt': 'NaN'}, {'completion': '.000002'}, {'request': '.01'},
                   {'input_cache_write': '.000001'}, {'completion': '-1'}, {'prompt': True})
        for change in changes:
            value = row(); value['pricing'].update(change)
            with get(value), self.subTest(change=change), self.assertRaises(ValueError): router.metadata(MODEL)
        for change in ({'context_length': 1024}, {'supported_parameters': []},
                       {'supported_parameters': {'tools': False}}, {'supported_parameters': 'tools'},
                       {'supported_parameters': None}, {'supported_parameters': ['tools', None]}):
            value = row(); value.update(change)
            with get(value), self.assertRaises(ValueError): router.metadata(MODEL)

    def test_free_route_cannot_gain_a_charge(self):
        model = 'recursive/flint-v1.0:free'; value = row(model)
        with patch.object(router, 'exchange', return_value=(200, 'application/json', json.dumps({'data': [value]}).encode())):
            with self.assertRaises(ValueError): router.metadata(model)

    def test_request_overrides_are_rejected_before_catalog_and_inference(self):
        provider = router.OpenRouterProvider(MODEL, '0.02')
        for key in ('provider', 'models', 'plugins', 'api_key', 'headers', 'usage'):
            value = request(); value[key] = {}
            with patch.object(router, 'exchange') as network, self.assertRaises(ValueError): provider.complete(value)
            network.assert_not_called()
        value = request(); value['tools'] = [{'type': 'web_search'}]
        with patch.object(router, 'exchange') as network, self.assertRaises(ValueError): provider.complete(value)
        network.assert_not_called()

    def test_malformed_messages_and_tools_never_reach_authenticated_post(self):
        provider = router.OpenRouterProvider(MODEL, '0.02')
        cases = [{'messages': [None]}, {'messages': []}, {'messages': [{'role': 'user', 'content': 1}]},
                 {'tools': [{}]}, {'tools': [{'type': 'function', 'function': {'name': 2}}]},
                 {'messages': [{'role': 'tool', 'content': 'text'}]},
                 {'messages': [{'role': 'user', 'content': [{'type': 'image_url'}]}]}]
        for change in cases:
            value = request(); value.update(change)
            with patch.object(router, 'exchange') as network, self.subTest(change=change), self.assertRaises(ValueError):
                provider.complete(value)
            network.assert_not_called()
        self.assertEqual(provider.requests, 0)

    def test_forced_exact_model_price_no_fallback_and_output_limit(self):
        provider = router.OpenRouterProvider(MODEL, '0.02')
        with patch.object(router, 'metadata', return_value=row()) as catalog, patch.object(router, 'exchange', return_value=(200, 'text/event-stream', b'data: [DONE]\n\n')) as network:
            self.assertEqual(provider.complete(request())[0], 200)
            payload = json.loads(network.call_args.args[2])
            self.assertEqual(payload['model'], MODEL)
            self.assertEqual(payload['max_tokens'], 2048)
            self.assertFalse(payload['provider']['allow_fallbacks'])
            self.assertTrue(payload['provider']['require_parameters'])
            self.assertEqual(payload['provider']['data_collection'], 'deny')
            self.assertEqual(payload['provider']['max_price'], {'prompt': .14, 'completion': .28, 'request': 0, 'image': 0})
            self.assertNotIn('Authorization', json.dumps(payload))
            catalog.assert_called_once_with(MODEL)

    def test_failures_are_scrubbed_and_still_consume_reservation(self):
        provider = router.OpenRouterProvider(MODEL, '0.02')
        with patch.object(router, 'metadata', return_value=row()), patch.object(router, 'exchange', return_value=(429, 'application/json', b'PRIVATE_ACCOUNT_DETAIL')):
            status, _, data = provider.complete(request())
        self.assertEqual(status, 429)
        self.assertNotIn(b'PRIVATE_ACCOUNT_DETAIL', data)
        self.assertGreater(provider.reserved, 0)

    def test_budget_and_call_limit_block_before_paid_post(self):
        for budget in ('0.000001', '0.02'):
            provider = router.OpenRouterProvider(MODEL, budget)
            if budget == '0.02': provider.requests = 6
            with patch.object(router, 'metadata', return_value=row()), patch.object(router, 'exchange') as network:
                with self.assertRaises(ValueError): provider.complete(request())
                network.assert_not_called()

    def test_stop_reason_is_initial_null_then_names_each_complete_guard(self):
        # Initially null before any rejection.
        provider = router.OpenRouterProvider(MODEL, '0.02')
        self.assertIsNone(provider.summary()['stopReason'])
        # Reservation that would exceed the budget stops before the paid POST.
        budgeted = router.OpenRouterProvider(MODEL, '0.000001')
        with patch.object(router, 'metadata', return_value=row()), patch.object(router, 'exchange') as network:
            with self.assertRaises(ValueError): budgeted.complete(request())
            network.assert_not_called()
        self.assertEqual(budgeted.summary()['stopReason'], 'budget_exhausted')
        self.assertEqual(budgeted.requests, 0)
        self.assertEqual(budgeted.reserved, router.Decimal(0))
        # Six requests reached stops before the paid POST.
        limited = router.OpenRouterProvider(MODEL, '0.02')
        limited.requests = 6
        with patch.object(router, 'metadata', return_value=row()), patch.object(router, 'exchange') as network:
            with self.assertRaises(ValueError): limited.complete(request())
            network.assert_not_called()
        self.assertEqual(limited.summary()['stopReason'], 'request_limit')
        self.assertEqual(limited.requests, 6)
        self.assertEqual(limited.reserved, router.Decimal(0))

    def test_config_contains_only_loopback_placeholder_and_real_prices(self):
        provider = router.OpenRouterProvider(MODEL, '0.02'); provider.metadata = row()
        config = runner.configuration(12345, Path('/synthetic'), provider)
        self.assertEqual(config['model'], 'ra9-openrouter/selected')
        self.assertEqual(config['providers']['ra9-openrouter']['models']['selected']['cost'], {'input': .14, 'output': .28})
        self.assertNotIn(str(router.KEY_FILE), json.dumps(config))
        self.assertEqual(config['providers']['ra9-openrouter']['settings']['apiKey'], 'public')

    def test_transport_refuses_redirects_and_other_routes(self):
        connection = Mock(); response = connection.getresponse.return_value
        response.status = 302; response.read.return_value = b''
        with patch.object(router.http.client, 'HTTPSConnection', return_value=connection), self.assertRaises(ValueError):
            router.exchange('GET', '/api/v1/models')
        connection.close.assert_called_once()
        with patch.object(router.http.client, 'HTTPSConnection') as network, self.assertRaises(ValueError):
            router.exchange('POST', '/other')
        network.assert_not_called()


if __name__ == '__main__': unittest.main()

import pytest
from pathlib import Path
from fastapi.testclient import TestClient

from assurance.report_generator import AssuranceReportGenerator
from main import app, DB_PATH

client = TestClient(app)

def test_report_generator_direct():
    generator = AssuranceReportGenerator(DB_PATH)
    report = generator.generate_report()

    assert report['report_title'] == 'VISIONSHIELD ASSURANCE REPORT'
    assert 'scan_id' in report
    assert 'timestamp' in report
    assert 'dataset_information' in report
    assert 'dataset_findings' in report
    assert 'model_information' in report
    assert 'model_integrity_result' in report
    assert 'distribution_analysis' in report
    assert 'inference_integrity' in report
    assert 'overall_risk_score' in report
    assert 'confidence' in report
    assert report['recommendation'] in ['ACCEPT', 'REVIEW', 'QUARANTINE']
    assert 'evidence' in report and len(report['evidence']) > 0
    assert 'limitations' in report and len(report['limitations']) > 0
    assert 'coverage' in report and report['coverage']['total_domains'] == 5
    assert 'audit_trail_status' in report

    html = generator.render_html_report(report)
    assert '<!DOCTYPE html>' in html
    assert 'VISIONSHIELD ASSURANCE REPORT' in html
    assert report['scan_id'] in html


def test_api_report_latest_endpoint():
    response = client.get('/api/report/latest')
    assert response.status_code == 200
    data = response.json()
    assert data['report_title'] == 'VISIONSHIELD ASSURANCE REPORT'
    assert 'scan_id' in data
    assert 'overall_risk_score' in data
    assert 'recommendation' in data


def test_api_report_scan_specific():
    scans_res = client.get('/api/scans')
    assert scans_res.status_code == 200
    scans = scans_res.json()
    if scans:
        scan_code = scans[0]['scan_code']
        response = client.get(f'/api/report/scan/{scan_code}')
        assert response.status_code == 200
        data = response.json()
        assert data['scan_id'] == scan_code


def test_api_report_export_html():
    response = client.get('/api/report/export/html')
    assert response.status_code == 200
    assert 'text/html' in response.headers.get('content-type', '')
    assert '<!DOCTYPE html>' in response.text
    assert 'VISIONSHIELD ASSURANCE REPORT' in response.text
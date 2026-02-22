import json, urllib.request, sys, datetime

CI_RUN = '22270814418'
TESTS_RUN = '22270814416'
CI_TOTAL = 55   # 30 shards + 1 a11y + 10 other jobs
TESTS_TOTAL = 6

ci = json.loads(urllib.request.urlopen(f'https://api.github.com/repos/TalWayn72/Bellor_MVP/actions/runs/{CI_RUN}/jobs?per_page=50').read())
tests = json.loads(urllib.request.urlopen(f'https://api.github.com/repos/TalWayn72/Bellor_MVP/actions/runs/{TESTS_RUN}/jobs?per_page=30').read())

ci_jobs = ci.get('jobs', [])
t_jobs = tests.get('jobs', [])
ci_done = sum(1 for j in ci_jobs if j['status'] == 'completed')
t_done = sum(1 for j in t_jobs if j['status'] == 'completed')
ci_pct = int(ci_done / CI_TOTAL * 100)
t_pct = int(t_done / TESTS_TOTAL * 100)
overall = int((ci_done + t_done) / (CI_TOTAL + TESTS_TOTAL) * 100)

print(f'CI: {ci_pct}% ({ci_done}/{CI_TOTAL}) | Tests: {t_pct}% ({t_done}/{TESTS_TOTAL}) | Overall: {overall}%')

for job in ci_jobs:
    if job['conclusion'] == 'success':
        icon = '[PASS]'
    elif job['conclusion'] == 'failure':
        icon = '[FAIL]'
    elif job['status'] == 'in_progress':
        icon = '[RUN.]'
    elif job['status'] == 'queued':
        icon = '[WAIT]'
    else:
        icon = '[----]'
    print(f'  CI  {icon} {job["name"]}')

for job in t_jobs:
    if job['conclusion'] == 'success':
        icon = '[PASS]'
    elif job['conclusion'] == 'failure':
        icon = '[FAIL]'
    elif job['status'] == 'in_progress':
        icon = '[RUN.]'
    elif job['status'] == 'queued':
        icon = '[WAIT]'
    else:
        icon = '[----]'
    print(f'  TST {icon} {job["name"]}')

ci_fail = [j['name'] for j in ci_jobs if j['conclusion'] == 'failure']
t_fail = [j['name'] for j in t_jobs if j['conclusion'] == 'failure']
if ci_fail:
    print(f'  FAILURES: {ci_fail}')
if t_fail:
    print(f'  FAILURES: {t_fail}')

all_vis_done = all(j['status'] == 'completed' for j in ci_jobs) and all(j['status'] == 'completed' for j in t_jobs)
if all_vis_done:
    print('ALL VISIBLE JOBS COMPLETED')

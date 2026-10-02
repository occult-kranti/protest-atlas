#!/usr/bin/env python3
"""Assemble explicitly researched regional snapshots; never ingest discovery leads."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json
import re
import unicodedata

ROOT=Path(__file__).resolve().parents[1]
REGIONS=('africa','asia','europe','americas','oceania')
def read(path): return json.loads(path.read_text())
def write(path,data): path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
def normalize(value): return re.sub(r'[^a-z0-9]','',unicodedata.normalize('NFKD',value).encode('ascii','ignore').decode().lower())

def assemble(root=ROOT):
    research=root/'research/round3'
    now=datetime.now(timezone.utc).isoformat(timespec='seconds').replace('+00:00','Z')
    countries=read(root/'public/countries.json');catalog={c['code']:c for c in countries}
    seeds=read(research/'seed-events.json')
    for addition in read(research/'seed-source-additions.json'):
        event=next(e for e in seeds if e['id']==addition['event_id'])
        if not any(s['id']==addition['source']['id'] for s in event['sources']):event['sources'].append(addition['source'])
        event['last_verified']=max(s['accessed_at'] for s in event['sources'])
    # Direct Spain article was re-read in the independent seed audit at this recorded time.
    seed_review=read(research/'seed-source-additions.json')[0]['source']['accessed_at']
    for e in seeds:
        if e['country']=='ES':
            for s in e['sources']:s['accessed_at']=seed_review
            e['last_verified']=seed_review
    events=seeds+[e for region in REGIONS for e in read(research/f'{region}-events.json')]
    contexts=read(research/'seed-context.json')+[c for region in REGIONS for c in read(research/f'{region}-context.json')]
    attempts=[r for region in REGIONS for r in read(research/f'{region}-screening.json')]
    screening=[]
    for country in countries:
        rows=[r for r in attempts if r['code']==country['code']]
        successes=[r for r in rows if r['status']=='searched']
        if not rows:raise ValueError('Missing screen '+country['code'])
        row=dict((successes or rows)[0])
        row['candidate_urls']=[u for u in row['candidate_urls'] if u.startswith('https://')][:5]
        row['reviewed_urls']=sorted({u for r in rows for u in r['reviewed_urls'] if u.startswith('https://')}) if successes else []
        row['note']+=' '+str(len(rows))+' logged attempt(s), '+str(sum(r['status']=='search-failed' for r in rows))+' recovered/retained failed attempt(s). Raw attempt history is retained in repository research files. Inspected pages may include partial extracts, as noted; no comprehensive country review is claimed.'
        screening.append(row)
    if len(screening)!=len(countries) or {r['code'] for r in screening}!=set(catalog):raise ValueError('Every directory country needs exactly one screening row')
    if len({e['id'] for e in events})!=len(events):raise ValueError('Duplicate episode IDs')
    for e in events:
        e['country_name']=catalog[e['country']]['name'];e['region']=catalog[e['country']]['region']
    events.sort(key=lambda e:(e['last_observed_at'] or '',e['id']),reverse=True)
    write(root/'public/events.json',{'schema_version':1,'generated_at':now,'last_editorial_review':now,'coverage_note':f"Historical research snapshot, 1 Jan 2024–2 Oct 2026: {len(events)} sourced episodes across {len(set(e['country'] for e in events))} countries and territories. AI-assisted, no independent human editorial sign-off. Initial country searches are not exhaustive histories. Missing records and unknown status remain coverage limits.",'events':events})
    write(root/'public/event-context.json',{'schema_version':1,'window_start':'2024-01-01','window_end':'2026-10-02','records':contexts})
    write(root/'public/research-ledger.json',{'schema_version':1,'window_start':'2024-01-01','window_end':'2026-10-02','generated_at':now,'note':'Initial English-language discovery screening of every directory entry, followed by selected source checks. This is non-exhaustive: one logged search is not a completed country history or proof of no protests. Local-language, city-level and date coverage remain uneven.','countries':sorted(screening,key=lambda r:r['code'])})
    languages={}
    for region in ('seed',*REGIONS):
        path=research/f'{region}-languages.json'
        if path.exists():languages.update(read(path))
    source_languages={s['id']:languages.get(s['id']) for e in events for s in e['sources']}
    rows=[]
    for country in countries:
        sources=[s for e in events if e['country']==country['code'] for s in e['sources']]
        days=[s['published_at'][:10] for s in sources if s['published_at']]
        rows.append({'code':country['code'],'status':'limited-source-check' if sources else 'not-reviewed','last_checked':max(s['accessed_at'] for s in sources) if sources else None,'review_window':{'start':min(days),'end':max(days)} if days else None,'languages':sorted({source_languages[s['id']] for s in sources if source_languages[s['id']]}),'source_ids':[s['id'] for s in sources],'note':'Selected article-level AI-assisted checks only; no independent human editorial sign-off. The source date span is not a continuous review period. Search attempts are documented separately.' if sources else 'No episode established by an article-level check in this snapshot. See the separate initial-screen ledger; this is not evidence that no protest occurred.'})
    write(root/'public/coverage.json',{'schema_version':2,'checked_at':now,'human_editorial_review':False,'coverage_note':'Selected source checks, not exhaustive country coverage. Source languages describe text actually read; null means not recorded. A search alone does not mark a country reviewed.','source_languages':source_languages,'countries':rows})
    prepare_cities(root,events,contexts)
    print(f'Assembled {len(events)} episodes, {len(screening)} country screens, {sum(e["status"]=="ended" for e in events)} ended/suspended episodes')

def prepare_cities(root,events,contexts):
    source_path=root/'vendor/natural-earth-cities.geo.json'
    geo=read(source_path)
    index={}
    for feature in geo['features']:
        p=feature['properties'];code=p['iso_a2']
        for key in ['name','nameascii','namealt','namepar','ls_name']:
            for name in re.split(r'[|;]',str(p.get(key) or '')):
                if name:index.setdefault((code,normalize(name)),[]).append(p)
    # Alternate spellings refer to the same named city, never to protest coordinates.
    aliases={'andorralavella':'andorra','newyork':'newyorkcity','delhi':'newdelhi','santiagodechile':'santiago','washington':'washingtondc','washingtondc':'washingtondc','ciudaddemexico':'mexicocity','mexicocity':'mexicocity','bengaluru':'bangalore','kyiv':'kiev','noumea':'noumea','portofspain':'portofspain'}
    event_map={e['id']:e for e in events};places=[];unmapped=[];seen=set()
    for context in contexts:
        country=event_map[context['event_id']]['country']
        for city in context['cities']:
            key=country+':'+city['name']
            if key in seen:continue
            seen.add(key);name=normalize(city['name'])
            matches=index.get((country,name)) or index.get((country,aliases.get(name,name))) or []
            record={'id':key,'country':country,'name':city['name']}
            if matches:
                # Same-city aliases create repeated matches; prefer the most prominent place.
                match=max(matches,key=lambda x:x['pop_max'])
                places.append({**record,'lat':round(match['latitude'],1),'lon':round(match['longitude'],1),'source_name':match['name']})
            else:unmapped.append(record)
    write(root/'public/cities.json',{'schema_version':1,'source':'Natural Earth populated places simple, 1:10m; locally stored source snapshot','source_url':'https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-populated-places/','source_sha256':hashlib.sha256(source_path.read_bytes()).hexdigest(),'precision':'Coarse city reference points, rounded to one decimal; not protest locations.','places':sorted(places,key=lambda c:c['id']),'unmapped':sorted(unmapped,key=lambda c:c['id'])})
    print('City references:',len(places),'mapped;',len(unmapped),'unmapped:',', '.join(c['id'] for c in unmapped))

if __name__=='__main__':assemble()

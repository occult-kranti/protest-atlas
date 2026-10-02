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
# Last day covered by a research sweep. Bump only when a new sweep has actually searched through that day.
WINDOW_END='2026-10-02'
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
    round4_languages={}
    upcoming=apply_round4(root/'research/round4',events,contexts,round4_languages)
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
    write(root/'public/events.json',{'schema_version':1,'generated_at':now,'last_editorial_review':now,'coverage_note':f"Research snapshot, 1 Jan 2024–2 Oct 2026, with a selective recent-activity sweep for 18 Sep–2 Oct 2026: {len(events)} sourced episodes across {len(set(e['country'] for e in events))} countries and territories. AI-assisted, no independent human editorial sign-off. Initial country searches are not exhaustive histories. Missing records and unknown status remain coverage limits.",'events':events})
    write(root/'public/event-context.json',{'schema_version':1,'window_start':'2024-01-01','window_end':WINDOW_END,'records':contexts})
    write(root/'public/research-ledger.json',{'schema_version':1,'window_start':'2024-01-01','window_end':WINDOW_END,'generated_at':now,'note':'Initial English-language discovery screening of every directory entry, followed by selected source checks. This is non-exhaustive: one logged search is not a completed country history or proof of no protests. Local-language, city-level and date coverage remain uneven.','countries':sorted(screening,key=lambda r:r['code'])})
    languages={}
    for region in ('seed',*REGIONS):
        path=research/f'{region}-languages.json'
        if path.exists():languages.update(read(path))
    languages.update(round4_languages)
    source_languages={s['id']:languages.get(s['id']) for e in events for s in e['sources']}
    rows=[]
    for country in countries:
        sources=[s for e in events if e['country']==country['code'] for s in e['sources']]
        days=[s['published_at'][:10] for s in sources if s['published_at']]
        rows.append({'code':country['code'],'status':'limited-source-check' if sources else 'not-reviewed','last_checked':max(s['accessed_at'] for s in sources) if sources else None,'review_window':{'start':min(days),'end':max(days)} if days else None,'languages':sorted({source_languages[s['id']] for s in sources if source_languages[s['id']]}),'source_ids':[s['id'] for s in sources],'note':'Selected article-level AI-assisted checks only; no independent human editorial sign-off. The source date span is not a continuous review period. Search attempts are documented separately.' if sources else 'No episode established by an article-level check in this snapshot. See the separate initial-screen ledger; this is not evidence that no protest occurred.'})
    write(root/'public/coverage.json',{'schema_version':2,'checked_at':now,'human_editorial_review':False,'coverage_note':'Selected source checks, not exhaustive country coverage. Source languages describe text actually read; null means not recorded. A search alone does not mark a country reviewed.','source_languages':source_languages,'countries':rows})
    prepare_cities(root,events,contexts)
    write_upcoming(root,upcoming,{e['id'] for e in events},now)
    print(f'Assembled {len(events)} episodes, {len(screening)} country screens, {sum(e["status"]=="ended" for e in events)} ended/suspended episodes')

ROUND4=('americas','europe','asia-west','asia-east-oceania','africa')
UPCOMING_NOTE=('Announcements of planned collective actions, attributed to named organisers or institutions and linked to their reporting. '
               'An announcement is not evidence that an action will occur, of its size or of its legality. City and date level only; '
               'AI-assisted source check without independent human editorial review. Missing announcements are a coverage gap.')

def apply_round4(research,events,contexts,languages):
    """Fold in the verified recent-activity sweep: new episodes, sourced updates and announced actions."""
    if not research.exists():return []
    by_id={e['id']:e for e in events};contexts_by_id={c['event_id']:c for c in contexts};upcoming=[]
    def part(region,name,default):
        path=research/f'{region}-{name}.json'
        return read(path) if path.exists() else default
    for region in ROUND4:
        for update in part(region,'updates',[]):
            if update['event_id'] not in by_id:raise ValueError('Round 4 update for unknown episode '+update['event_id'])
            event=by_id[update['event_id']];known={s['id'] for s in event['sources']}
            event['sources'].extend(s for s in update['new_sources'] if s['id'] not in known)
            if update['last_observed_at']>event['last_observed_at']:event['last_observed_at']=update['last_observed_at']
            # Stable sort keeps same-day entries in their recorded order.
            event['timeline']=sorted(event['timeline']+update['timeline_additions'],key=lambda item:item['date'])
            event['state_response'].extend(update['state_response_additions'])
            if update.get('status',event['status'])!=event['status']:
                if not update.get('status_basis'):raise ValueError('Round 4 status change needs status_basis: '+event['id'])
                event['status']=update['status'];contexts_by_id[event['id']]['status_basis']=update['status_basis']
            event['last_verified']=max(s['accessed_at'] for s in event['sources'])
        fresh=part(region,'events',[]);fresh_contexts=part(region,'context',[])
        if {e['id'] for e in fresh}!={c['event_id'] for c in fresh_contexts}:raise ValueError('Round 4 events and contexts disagree: '+region)
        for event in fresh:
            if event['id'] in by_id:raise ValueError('Duplicate round 4 episode '+event['id'])
            by_id[event['id']]=event
        events.extend(fresh);contexts.extend(fresh_contexts)
        languages.update(part(region,'languages',{}))
        upcoming.extend(part(region,'upcoming',[]))
    return upcoming

def write_upcoming(root,items,event_ids,now):
    for item in items:
        if item['event_id'] is not None and item['event_id'] not in event_ids:item['event_id']=None
    items=sorted(items,key=lambda item:(item['planned_start'],item['country'],item['id']))
    write(root/'public/upcoming.json',{'schema_version':1,'generated_at':now,'note':UPCOMING_NOTE,'items':items})
    print('Announced actions:',len(items))

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

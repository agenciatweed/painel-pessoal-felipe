"""Export local Garmin/Last.fm data without touching collectors or exposing raw profiles."""
from __future__ import annotations
import argparse,csv,io,json,math,os,sys,zipfile
from collections import Counter,defaultdict
from datetime import datetime,timedelta,timezone,date
from pathlib import Path
from urllib.request import Request,urlopen

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'.local/python'))
TZ=timezone(timedelta(hours=-3))

def load(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))

def route_details(details):
    descriptors={x['key']:x['metricsIndex'] for x in details.get('metricDescriptors',[])}
    lat,lon=descriptors.get('directLatitude'),descriptors.get('directLongitude')
    if lat is None or lon is None:return []
    return [[row['metrics'][lat],row['metrics'][lon]] for row in details.get('activityDetailMetrics',[]) if valid_point(row['metrics'][lat],row['metrics'][lon])]

def valid_point(lat,lon):
    return isinstance(lat,(int,float)) and isinstance(lon,(int,float)) and math.isfinite(lat) and math.isfinite(lon) and abs(lat)<=90 and abs(lon)<=180 and (lat!=0 or lon!=0)

def route_fit(path):
    import fitdecode
    points=[]
    with zipfile.ZipFile(path) as z:
        names=[n for n in z.namelist() if n.lower().endswith('.fit')]
        if not names:return []
        with fitdecode.FitReader(io.BytesIO(z.read(names[0]))) as reader:
            for frame in reader:
                if isinstance(frame,fitdecode.FitDataMessage) and frame.name=='record':
                    lat=frame.get_value('position_lat',fallback=None);lon=frame.get_value('position_long',fallback=None)
                    if lat is not None and lon is not None:
                        lat,lon=lat*180/2**31,lon*180/2**31
                        if valid_point(lat,lon):points.append([lat,lon])
    return points

def normalize(a):
    kind=a.get('activityType',a.get('activityTypeDTO',{})).get('typeKey','').lower()
    name=a.get('activityName','Corrida')
    if kind not in {'running','trail_running','track_running','street_running','ultra_run'}:return None
    if any(word in name.casefold() for word in ('esteira','treadmill','virtual')):return None
    distance=a.get('distance',0) or 0
    duration=a.get('duration',0) or 0
    if distance<=0 or duration<=0:return None
    speed=a.get('averageSpeed',0) or 0
    return dict(id=str(a['activityId']),name=name,date=a.get('startTimeLocal',''),km=distance/1000,duration=duration,pace=1000/speed if speed>0 else duration/(distance/1000),hr=a.get('averageHR'),maxHr=a.get('maxHR'),cadence=a.get('averageRunningCadenceInStepsPerMinute'),elevation=a.get('elevationGain'),calories=a.get('calories'),route=[])

def garmin_data(folder):
    found={};routes={};covered=set();warnings=[];fetched=[]
    raw=folder/'dados_locais/raw'
    for path in sorted((raw/'activities').glob('*.json')):
        batch=load(path)
        if not isinstance(batch,list):raise ValueError(f'Formato Garmin inválido: {path.name}')
        for a in batch:found[str(a['activityId'])]=a
        fetched.append(path.stat().st_mtime)
        # The last page confirms that this entire collector range was read.
        parts=path.stem.split('_')
        if len(parts)>=2 and len(batch)<99:
            d=date.fromisoformat(parts[0]);end=date.fromisoformat(parts[1])
            while d<=end:covered.add(str(d));d+=timedelta(days=1)
    for path in sorted((folder/'raw/activities').glob('*.json')):
        doc=load(path);a=doc.get('resumo',{})
        if a.get('activityId'):
            found.setdefault(str(a['activityId']),a)
            routes[str(a['activityId'])]=route_details(doc.get('details',{}))
            fetched.append(path.stat().st_mtime)
    runs=[]
    for aid,a in found.items():
        run=normalize(a)
        if not run:continue
        detail=raw/'activity'/f'{aid}.json'
        if detail.exists():
            summary=load(detail).get('summaryDTO',{})
            for dest,source in [('cadence','averageRunCadence'),('calories','calories'),('elevation','elevationGain')]:
                if run.get(dest) is None:run[dest]=summary.get(source)
        points=routes.get(aid,[])
        fit=raw/'download'/f'{aid}.zip'
        if not points and fit.exists():
            try:points=route_fit(fit)
            except Exception as exc:warnings.append(f'GPS {aid}: {type(exc).__name__}')
        # At most 1,200 real samples per run; always retain the last point.
        if len(points)>1200:
            points=points[::math.ceil(len(points)/1199)]+[points[-1]]
        run['route']=[[round(x,6),round(y,6)] for x,y in points]
        runs.append(run)
    runs.sort(key=lambda r:r['date'],reverse=True)
    buckets=defaultdict(list)
    for run in runs:buckets[run['date'][:7]].append(run)
    monthly=[]
    for month,items in sorted(buckets.items()):
        km=sum(r['km'] for r in items)
        hrs=[r for r in items if isinstance(r['hr'],(int,float)) and r['hr']>0]
        first=date.fromisoformat(month+'-01');last=(first.replace(day=28)+timedelta(days=4)).replace(day=1)-timedelta(days=1)
        complete=all(str(first+timedelta(days=n)) in covered for n in range((last-first).days+1))
        monthly.append(dict(month=month,totalKm=km,avgKm=km/len(items),count=len(items),pace=sum(r['pace']*r['km'] for r in items)/km,hr=sum(r['hr']*r['duration'] for r in hrs)/sum(r['duration'] for r in hrs) if hrs else None,complete=complete))
    return runs,monthly,dict(days=sorted(covered),firstRun=runs[-1]['date'][:10] if runs else None,lastRun=runs[0]['date'][:10] if runs else None,sourceUpdatedAt=datetime.fromtimestamp(max(fetched),timezone.utc).isoformat() if fetched else None,warnings=warnings)

def music_data(folder,now):
    counters={7:Counter(),30:Counter()};seen=set();latest=0
    files=sorted(folder.glob('scrobbles_*.csv'))
    if not files:raise ValueError('Nenhum CSV Last.fm encontrado; sincronização cancelada para preservar os dados online.')
    for path in files:
        with path.open(encoding='utf-8-sig',newline='') as f:
            for row in csv.DictReader(f):
                ts=int(row['uts'])
                if ts in seen:continue
                seen.add(ts);latest=max(latest,ts)
                age=now.timestamp()-ts
                for days,counter in counters.items():
                    if 0<=age<days*86400:counter[(row['artist'],row['track'])]+=1
    return dict(windows={str(days):[dict(artist=k[0],track=k[1],plays=v) for k,v in sorted(c.items(),key=lambda x:(-x[1],x[0]))[:10]] for days,c in counters.items()},counts={str(k):sum(c.values()) for k,c in counters.items()},lastScrobbleAt=datetime.fromtimestamp(latest,timezone.utc).isoformat() if latest else None,sourceUpdatedAt=datetime.fromtimestamp(max(p.stat().st_mtime for p in files),timezone.utc).isoformat(),windowEndsAt=now.isoformat())

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--garmin',type=Path,default=Path('H:/Garmin'));parser.add_argument('--lastfm',type=Path,default=Path('H:/Lastfm'))
    parser.add_argument('--upload',action='store_true');args=parser.parse_args()
    now=datetime.now(TZ)
    runs,monthly,coverage=garmin_data(args.garmin)
    if not runs:raise ValueError('Nenhuma corrida Garmin válida encontrada; dados online preservados.')
    doc=dict(version=1,generatedAt=now.isoformat(),runs=runs,monthly=monthly,coverage=coverage,music=music_data(args.lastfm,now))
    initial=ROOT.parent/'tweedtraining/todos.json'
    if initial.exists():doc['initialTasks']=load(initial)
    target=ROOT/'.local/data';target.mkdir(parents=True,exist_ok=True)
    content=json.dumps(doc,ensure_ascii=False,separators=(',',':')).encode()
    (target/'export.json').write_bytes(content)
    local=dict(doc);local.pop('initialTasks',None)
    (target/'dashboard.json').write_text(json.dumps(local,ensure_ascii=False),encoding='utf-8')
    if not (target/'tasks.json').exists():(target/'tasks.json').write_text(json.dumps(doc.get('initialTasks',[]),ensure_ascii=False),encoding='utf-8')
    print(f'{len(runs)} corridas; {len(monthly)} meses; {sum(bool(r["route"]) for r in runs)} trajetos GPS. Exportação privada local: {len(content)} bytes.')
    if args.upload:
        config=load(ROOT/'.local/sync.json');origin=config['url'].rstrip('/')
        if origin!='https://painel-pessoal-felipe.vercel.app':raise ValueError('Destino de sincronização não autorizado.')
        req=Request(origin+'/api/ingest',data=content,headers={'Content-Type':'application/json','Authorization':'Bearer '+config['secret']},method='POST')
        with urlopen(req,timeout=90) as response:result=json.load(response)
        if not result.get('ok'):raise ValueError('Servidor não confirmou a persistência.')
        print('Sincronização online concluída. Tarefas existentes foram preservadas.')

if __name__=='__main__':main()

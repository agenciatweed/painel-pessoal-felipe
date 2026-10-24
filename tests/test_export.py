import importlib.util,unittest,tempfile,json,csv
from pathlib import Path
from datetime import datetime,timezone
spec=importlib.util.spec_from_file_location('sync',Path(__file__).parents[1]/'scripts/sync_data.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class ExportTests(unittest.TestCase):
 def test_excludes_treadmill_virtual_and_nonrunning(self):
  base=dict(activityId=1,activityName='Corrida',distance=1000,duration=450,activityType={'typeKey':'running'},averageSpeed=1000/450)
  self.assertEqual(m.normalize(base)['pace'],450)
  for kind,name in [('treadmill_running','Corrida'),('running','Esteira'),('virtual_run','Corrida'),('cycling','Pedal')]:
   self.assertIsNone(m.normalize({**base,'activityType':{'typeKey':kind},'activityName':name}))
 def test_music_windows_are_relative_to_now_and_deduplicate(self):
  now=datetime(2026,10,24,tzinfo=timezone.utc)
  with tempfile.TemporaryDirectory() as folder:
   path=Path(folder)/'scrobbles_2026.csv'
   with path.open('w',newline='',encoding='utf-8') as f:
    w=csv.DictWriter(f,fieldnames=['uts','artist','track']);w.writeheader()
    for days in [1,1,10,40]:w.writerow(dict(uts=int(now.timestamp()-days*86400),artist='A',track='B'))
   data=m.music_data(Path(folder),now)
   self.assertEqual(data['windows']['7'][0]['plays'],1);self.assertEqual(data['windows']['30'][0]['plays'],2)
if __name__=='__main__':unittest.main()

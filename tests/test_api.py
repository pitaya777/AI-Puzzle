import io,os,tempfile
from pathlib import Path
os.environ['PYTHONHASHSEED']='0'
from fastapi.testclient import TestClient
from PIL import Image
from backend.app import app,DATA,validate_story,seedance_source
def picture():b=io.BytesIO();Image.new('RGB',(270,480),'green').save(b,'PNG');return b.getvalue()
def test_isolation_threshold_and_admin(monkeypatch):
  def fake_cartoon(source,folder):
    target=folder/'cartoon.jpg';target.write_bytes(source.read_bytes());return target
  monkeypatch.setattr('backend.app.seedream_cartoon',fake_cartoon)
  with TestClient(app) as a,TestClient(app) as b:
    a.post('/api/session');b.post('/api/session')
    r=a.post('/api/creations',files={'photo':('a.png',picture(),'image/png')},data={'rows':3,'columns':3});assert r.status_code==201;cid=r.json()['id']
    assert b.get('/api/creations/'+cid).status_code==404
    assert a.put(f'/api/creations/{cid}/answer',json={'index':0,'text':'校园'}).status_code==422
    for i in range(3):assert a.post(f'/api/creations/{cid}/place',json={'piece':i,'target':i}).status_code==200
    assert a.put(f'/api/creations/{cid}/answer',json={'index':0,'text':'图书馆'}).status_code==200
    assert a.put(f'/api/creations/{cid}/answer',json={'index':1,'text':'老师'}).status_code==422
    assert a.get('/api/admin/stats').status_code==401
    password=(DATA/'admin-password.txt').read_text().strip();assert a.post('/api/admin/login',json={'password':password}).status_code==200;assert a.get('/api/admin/stats').status_code==200
def test_bad_file_and_csrf():
  with TestClient(app) as c:
    c.post('/api/session');assert c.post('/api/creations',files={'photo':('a.png',b'bad','image/png')}).status_code==422
    assert c.post('/api/session',headers={'Origin':'https://evil.example'}).status_code==403

def test_story_validation_contract():
  intervals=[(0,3),(3,7),(7,11),(11,16),(16,21),(21,25),(25,30)]
  scenes=[{'start':start,'end':end,'visual':'校园画面','performance':'主角前行','camera':'镜头跟随','music':'钢琴渐强','sound_effect':'风声','narration':'青春仍在','transition':'自然转场'} for start,end in intervals]
  prompt='。'.join(f'{start}-{end} 秒：连续的校园回忆画面' for start,end in intervals)
  valid={'title':'校园时光','story':'忆'*600,'video_prompt':prompt+'忆'*(900-len(prompt)),'scenes':scenes}
  assert validate_story(valid)
  assert not validate_story({**valid,'story':'太短'})
  assert not validate_story({**valid,'scenes':valid['scenes'][:6]})

def test_seedance_rejected_request_keeps_diagnostic_and_allows_retry(tmp_path,monkeypatch):
  class Rejected:
    is_error=True;status_code=400;text='{"error":{"message":"model not found"}}'
    def json(self):return {'error':{'message':'model not found'}}
  captured={}
  def reject(*args,**kwargs):captured.update(kwargs['json']);return Rejected()
  monkeypatch.setenv('SEEDANCE_API_KEY','test-key');monkeypatch.setenv('SEEDANCE_MODEL','test-model')
  monkeypatch.setattr('backend.app.httpx.post',reject)
  photo=tmp_path/'photo.jpg';Image.new('RGB',(9,16)).save(photo)
  import pytest
  with pytest.raises(ValueError,match='HTTP 400'):seedance_source(photo,'prompt',tmp_path,'test')
  assert captured['content'][1]['role']=='first_frame'
  assert 'ratio' not in captured
  assert (tmp_path/'provider-error.log').is_file()
  assert not (tmp_path/'provider-task-test.txt').exists()

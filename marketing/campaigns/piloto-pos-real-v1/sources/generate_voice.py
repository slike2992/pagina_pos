"""Generate the catalogue AI voice locally; model files are not distributed here."""
from pathlib import Path
import argparse,os,json
import numpy as np
import soundfile as sf
import espeakng_loader
os.environ['PHONEMIZER_ESPEAK_LIBRARY']=espeakng_loader.get_library_path()
os.environ['ESPEAK_DATA_PATH']=espeakng_loader.get_data_path()
from kokoro_onnx import Kokoro,EspeakConfig
parser=argparse.ArgumentParser()
parser.add_argument('--model-dir',required=True)
parser.add_argument('--output-dir',required=True)
args=parser.parse_args();models=Path(args.model_dir);out=Path(args.output_dir);out.mkdir(parents=True,exist_ok=True)
model=Kokoro(str(models/'kokoro-v1.0.onnx'),str(models/'voices-v1.0.bin'),espeak_config=EspeakConfig(lib_path=espeakng_loader.get_library_path(),data_path=espeakng_loader.get_data_path()))
# Accent in TTS input only guides spoken stress; on-screen brand is always Cripton.
script=['¿Volver a digitar los mismos productos?','Con Criptón, aprovecha la información que ya registraste en tu documento interno.','Genera la factura electrónica y consulta su estado desde el mismo sistema.','Menos trabajo repetido. Más claridad para tu negocio.','Escríbenos demo y conoce Criptón.']
sr=24000;cursor=.45;parts=[np.zeros(round(cursor*sr),np.float32)];timeline=[]
for i,text in enumerate(script):
    audio,sr=model.create(text,voice='ef_dora',speed=.94,lang='es')
    timeline.append({'start':round(cursor,3),'end':round(cursor+len(audio)/sr,3),'text':text})
    parts.append(audio);cursor+=len(audio)/sr
    pause=.45 if i<4 else 1.0
    parts.append(np.zeros(round(pause*sr),np.float32));cursor+=pause
sf.write(out/'locucion.wav',np.concatenate(parts),sr)
(out/'voice-timing.json').write_text(json.dumps(timeline,ensure_ascii=False,indent=2),encoding='utf-8')
print('Created AI narration:',round(cursor,3),'seconds')

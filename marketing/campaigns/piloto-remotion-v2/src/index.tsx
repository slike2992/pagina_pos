import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {Pilot} from './pilot';
registerRoot(()=> <Composition id="CriptonPilot" component={Pilot} durationInFrames={660} fps={30} width={1080} height={1920}/>);

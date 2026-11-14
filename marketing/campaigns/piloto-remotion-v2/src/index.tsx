import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {Pilot} from './pilot';
registerRoot(()=> <><Composition id="CriptonPilot" component={Pilot} durationInFrames={660} fps={30} width={1080} height={1920}/><Composition id="CriptonTrial15" component={Pilot} defaultProps={{trial15:true}} durationInFrames={660} fps={30} width={1080} height={1920}/></>);

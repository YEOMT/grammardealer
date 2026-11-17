import {resolvePresentationRegion} from '../services/presentationRegion.js';
/** Region-only presentation: every render replaces or clears the previous theme. */
export function applyStageTheme(state,document=globalThis.document){
  if(!document?.body)return;
  const stage=resolvePresentationRegion(state);
  if(['0.6.1','0.7.0','0.8.0','0.8.1','0.9.0','0.10.0','0.10.1','0.10.2','0.11.0','0.12.0','0.12.1','0.14.0'].includes(state?.version)&&/^stage\.(0[1-9]|10)$/.test(stage??''))document.body.dataset.stageTheme=stage;
  else if(['0.11.0','0.12.0','0.12.1','0.14.0'].includes(state?.version)&&stage==='stage.final')document.body.dataset.stageTheme='stage.10';
  else delete document.body.dataset.stageTheme;
}

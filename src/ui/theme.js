/** Region-only presentation: every render replaces or clears the previous theme. */
export function applyStageTheme(state,document=globalThis.document){
  if(!document?.body)return;
  const stage=state?.shop?.stageId&&state.status==='SHOP'?state.shop.stageId:state?.progress?.stageId;
  if(['0.6.1','0.7.0','0.8.0'].includes(state?.version)&&/^stage\.0[1-8]$/.test(stage??''))document.body.dataset.stageTheme=stage;
  else delete document.body.dataset.stageTheme;
}

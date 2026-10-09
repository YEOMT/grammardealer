/** Region-only presentation: every render replaces or clears the previous theme. */
export function applyStageTheme(state,document=globalThis.document){
  if(!document?.body)return;
  const stage=state?.shop?.stageId&&state.status==='SHOP'?state.shop.stageId:state?.progress?.stageId;
  if(state?.version==='0.6.1'&&/^stage\.0[1-6]$/.test(stage??''))document.body.dataset.stageTheme=stage;
  else delete document.body.dataset.stageTheme;
}

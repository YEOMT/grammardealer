/** The current NEW_RUN now creates finale fields. Historical test fixtures keep
 * their original contracts; this never migrates an existing save or changes assertions.
 */
export function removeFinaleFromHistoricalFixture(state){
 if(state.version==='0.11.0')throw Error('Historical fixture must select its original version first');
 delete state.finale;
 delete state.config.shopFlowPolicy;
 state.contentManifest.stageIds=state.contentManifest.stageIds.filter(id=>id!=='stage.final');
 if(state.contentManifest.id==='campaign.0.11')state.contentManifest.id='campaign.0.10';
 if(state.config.contentProfile==='STAGE1_TO_STAGE10_FINAL50')state.config.contentProfile='STAGE1_STAGE2_STAGE3_STAGE4_STAGE5_STAGE6_STAGE7_STAGE8_STAGE9_STAGE10';
 return state;
}

// Opt-in only for newly created runs. An absent marker keeps the saved legacy flow.
export const SHOP_FLOW_POLICY = 'BOSS_REWARD_FIRST_V1';
export const usesPostBossShop = run => run?.version === '0.11.0' && run.config?.shopFlowPolicy === SHOP_FLOW_POLICY;
export const isPreparedShopIntro = run => usesPostBossShop(run) && run.status === 'STAGE_INTRO' && run.combat === null && run.shop?.stageId === run.progress.stageId && run.shop.closed === true;

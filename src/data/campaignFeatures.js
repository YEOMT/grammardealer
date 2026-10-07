/** Explicit persisted campaign capabilities. Legacy versions never inherit new content. */
const versionOf = value => typeof value === 'string' ? value : value?.version;
export const hasTimeCampaign = value => ['0.3.0','0.4.0','0.5.0','0.5.1'].includes(versionOf(value));
export const hasSkyCampaign = value => ['0.4.0','0.5.0','0.5.1'].includes(versionOf(value));
export const hasDesertCampaign = value => ['0.5.0','0.5.1'].includes(versionOf(value));
export const campaignBattleCount = value => hasDesertCampaign(value) ? 22 : hasSkyCampaign(value) ? 17 : hasTimeCampaign(value) ? 12 : ['0.2.0','0.2.1','0.2.2'].includes(versionOf(value)) ? 7 : 3;

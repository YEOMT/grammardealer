/** Explicit persisted campaign capabilities. Legacy versions never inherit new content. */
const versionOf = value => typeof value === 'string' ? value : value?.version;
export const hasFinaleCampaign=value=>versionOf(value)==='0.11.0';
export const hasCorridorCampaign=value=>['0.10.0','0.10.1','0.10.2','0.11.0'].includes(versionOf(value));
export const hasLibraryCampaign=value=>['0.9.0','0.10.0','0.10.1','0.10.2','0.11.0'].includes(versionOf(value));
export const hasWaterwaysCampaign=value=>['0.8.0','0.8.1','0.9.0','0.10.0','0.10.1','0.10.2','0.11.0'].includes(versionOf(value));
export const hasEmberCampaign = value => ['0.7.0','0.8.0','0.8.1','0.9.0','0.10.0','0.10.1','0.10.2','0.11.0'].includes(versionOf(value));
export const hasPolishCampaign = value => ['0.6.1','0.7.0','0.8.0','0.8.1','0.9.0','0.10.0','0.10.1','0.10.2','0.11.0'].includes(versionOf(value));
export const hasSnowCampaign = value => ['0.6.0','0.6.1','0.7.0','0.8.0','0.8.1','0.9.0','0.10.0','0.10.1','0.10.2','0.11.0'].includes(versionOf(value));
export const hasTimeCampaign = value => ['0.3.0','0.4.0','0.5.0','0.5.1','0.6.0','0.6.1','0.7.0','0.8.0','0.8.1','0.9.0','0.10.0','0.10.1','0.10.2','0.11.0'].includes(versionOf(value));
export const hasSkyCampaign = value => ['0.4.0','0.5.0','0.5.1','0.6.0','0.6.1','0.7.0','0.8.0','0.8.1','0.9.0','0.10.0','0.10.1','0.10.2','0.11.0'].includes(versionOf(value));
export const hasDesertCampaign = value => ['0.5.0','0.5.1','0.6.0','0.6.1','0.7.0','0.8.0','0.8.1','0.9.0','0.10.0','0.10.1','0.10.2','0.11.0'].includes(versionOf(value));
export const campaignBattleCount = value => hasFinaleCampaign(value)?50:hasCorridorCampaign(value)?47:hasLibraryCampaign(value)?42:hasWaterwaysCampaign(value)?37:hasEmberCampaign(value)?32:hasSnowCampaign(value)?27:hasDesertCampaign(value) ? 22 : hasSkyCampaign(value) ? 17 : hasTimeCampaign(value) ? 12 : ['0.2.0','0.2.1','0.2.2'].includes(versionOf(value)) ? 7 : 3;

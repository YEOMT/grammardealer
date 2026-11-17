// Optional, immutable policy on NEW_RUN only. Language/deck/economy stay at 0.14.0.
export const PLAY_FEEDBACK_POLICY='play-feedback.0.15.0';
export const COMBAT_FIRST_TUTORIAL='guided.combat-first.v1';
export const PLAY_FEEDBACK_RULESET='syntax-atlas.0.15.0';
export const hasPlayFeedback=run=>run?.version==='0.14.0'&&run?.playFeedbackPolicy===PLAY_FEEDBACK_POLICY;
export function validatePlayFeedbackPolicy(run){
 if(run.playFeedbackPolicy!==undefined&&(!hasPlayFeedback(run)||run.contentManifest?.playFeedbackPolicy!==PLAY_FEEDBACK_POLICY))throw Error('Invalid play feedback policy');
 if(run.contentManifest?.playFeedbackPolicy!==undefined&&run.playFeedbackPolicy!==run.contentManifest.playFeedbackPolicy)throw Error('Mismatched play feedback policy');
}

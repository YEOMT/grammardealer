import {assignedWaterways,checked,assignPiles} from './waterways-state.js';
import {snapshotFromText} from '../../src/engine/grammar/index.js';
import {registryForVersion} from '../../src/data/language/index.js';
import {validateRunState} from '../../src/services/localStore.js';
import {LIBRARY_REWARD_PACK} from '../../src/data/libraryPolicy.js';
export {checked,assignPiles};
/** Assigned integration fixture. Cards are supplied before the real battle starts; not a natural reward run. */
export function assignedLibrary({round=4,seed='library.assigned',sentences=[],words=[],polish=0,runes=[],entry=false}={}){
 const c=assignedWaterways({version:'0.9.0',seed}),s=c.getState(),registry=registryForVersion(s.version);
 s.progress={stageId:'stage.09',roundIndex:round,battleNumber:38+round,contentBoundary:null};s.combat=null;s.status='STAGE_INTRO';s.milestoneIds.push('STAGE8_CLEAR');
 const packs=sentences.map(text=>snapshotFromText(text,{registry}).orderedTokens);
 let i=0;const add=cardDefId=>{const id=`qa.library.${i++}`;s.cardInstances[id]={instanceId:id,cardDefId,polishLevel:polish,specialEffectId:null};s.activeCardIds.push(id);return id;};
 const slots=packs.map(tokens=>tokens.map(t=>({cardInstanceId:add(t.cardDefId),selection:t.selectionId})));
 words.forEach(w=>add('card.'+w));
 if(runes.length){s.runes.orderedInstanceIds=runes.map((r,i)=>'qa.library.rune.'+i);s.runes.instances=Object.fromEntries(runes.map((r,i)=>[s.runes.orderedInstanceIds[i],{instanceId:s.runes.orderedInstanceIds[i],runeId:r,level:3}]));}
 c._state=s;
 if(!entry){s.eligibility.runOwnUnlocks.push(LIBRARY_REWARD_PACK);c._beginBattle(s);c._state=s;}
 validateRunState(c.getState(),registry);return {c,slots};
}
export function place(c,slots){assignPiles(c,{sentence:slots});}

// Fixed review draft, not a claim of teacher approval. Examples are never player achievements.
export const GRAMMAR_GUIDE = {
 'FRAME.SV':{label:'1형식 S+V',description:'주어와 동사를 중심으로 이루어지며 목적어와 보어가 없는 문장입니다.',examples:['I run.']},
 'FRAME.SVC':{label:'2형식 S+V+C',description:'보어가 주어의 상태나 정체를 설명합니다.',examples:['I am happy.','I am a student.']},
 'FRAME.SVO':{label:'3형식 S+V+O',description:'목적어가 동사가 나타내는 행동이나 관계의 대상을 나타냅니다.',examples:['I like books.']},
 'FRAME.SVOO':{label:'4형식 S+V+IO+DO',description:'간접목적어는 보통 받는 대상이나 수혜자를, 직접목적어는 전달하거나 제공하는 대상을 나타냅니다.',examples:['She gives me a book.']},
 'MODIFIER.ADJECTIVE':{label:'형용사 수식',description:'형용사는 명사 앞에서 명사를 수식할 수 있습니다.',examples:['I like the big dog.']},
 'MODIFIER.ADVERB':{label:'부사 수식',description:'부사는 허용된 위치에서 동사·형용사·부사를 수식합니다.',examples:['He runs very fast.']},
 'PHRASE.PP':{label:'전치사구',description:'전치사와 명사구가 함께 쓰여 위치나 대상 등의 관계를 나타냅니다.',examples:['I am at school.']},
};
export const ROLE_GUIDE={
 SUBJECT:{label:'주어 S',description:'문장에서 말하는 대상을 나타냅니다.'},
 FINITE_VERB:{label:'동사 V',description:'주어의 행동이나 상태를 나타냅니다.'},
 OBJECT:{label:'목적어 O',description:'동사가 나타내는 행동이나 관계의 대상을 나타냅니다.'},
 INDIRECT_OBJECT:{label:'간접목적어 IO',description:'주거나 보여주거나 만들어 주는 행동에서 보통 받는 대상이나 수혜자를 나타냅니다.'},
 DIRECT_OBJECT:{label:'직접목적어 DO',description:'그 행동에서 직접 전달하거나 제공하는 대상입니다.'},
 COMPLEMENT:{label:'보어 C',description:'주어나 목적어가 어떤 상태인지 또는 무엇인지를 설명합니다.'},
 PP_OBJECT:{label:'전치사의 목적어',description:'전치사와 함께 관계를 나타내는 명사구입니다.'},
};
export const DATIVE_GUIDE={description:'give/show/send는 to, make는 for를 사용한 대표 대응 표현도 만들 수 있습니다. 이때 to/for 뒤의 명사구는 전치사의 목적어입니다.',examples:['She gives a book to me.','She makes a game for me.']};
export const LOCATION_GUIDE={description:'이 게임의 학교 문형 표기에서 be와 장소 표현은 위치·존재를 나타내는 1형식으로 표시합니다.',examples:['I am at school.','He is in the room.']};
export const SUBMISSION_LABELS={VALID:'완전한 문장',VALID_WITH_ISSUES:'형태 확인 필요',INVALID_CORE:'문장 미완성 · 피해 0'};
export const PRONOUN_MEANINGS={
 I:['나(주어)','나를/나에게','나의'],you:['너/여러분(주어)','너를/너에게·여러분을/여러분에게','너의/여러분의'],
 he:['그(주어)','그를/그에게','그의'],she:['그녀(주어)','그녀를/그녀에게','그녀의'],
 it:['그것(주어)','그것을/그것에게','그것의'],we:['우리(주어)','우리를/우리에게','우리의'],they:['그들/그것들(주어)','그들을/그들에게','그들의'],
};
export function formMeaning(word,form){const group=PRONOUN_MEANINGS[word.lemma];if(!group)return form.labelKo;return group[{NOMINATIVE:0,OBJECTIVE:1,POSSESSIVE_DETERMINER:2}[form.grammaticalFeatures.case]]??'대명사 형태';}
export function verbUsage(word){
 const frames=new Set(word.frameIds);const parts=[];
 if(frames.has('frame.sv'))parts.push('주어 + 동사');
 if(frames.has('frame.beLocative'))parts.push('주어 + be + 장소 표현');
 if(frames.has('frame.svc.adj')||frames.has('frame.svc.np'))parts.push('주어 + 동사 + 주격보어');
 if(frames.has('frame.svo'))parts.push('주어 + 동사 + 목적어');
 if(frames.has('frame.svoo'))parts.push('주어 + 동사 + 간접목적어 + 직접목적어');
 if(frames.has('frame.svoc.adj'))parts.push('목적어 + 형용사 보어');
 if(frames.has('frame.svoc.np'))parts.push('목적어 + 명사 보어');
 if(frames.has('frame.svoc.to'))parts.push('목적어 + to + 동사 원형');
 if(frames.has('frame.svoc.bare'))parts.push('목적어 + 동사 원형');
 if(frames.has('frame.svo.to'))parts.push('to + 동사 원형');
 if(frames.has('frame.svo.bare'))parts.push('동사 원형');
 return parts.join(' / ');
}

import {isIngForm} from './language/desertLanguage.js';
// Fixed review draft, not a claim of teacher approval. Examples are never player achievements.
export const GRAMMAR_GUIDE = {
 'PARTICIPLE.PAST':{label:'과거분사',description:'p.p.형이 명사를 수식하거나 목적어의 상태를 설명할 수 있습니다. 과거 시제나 완료·수동태와 구분합니다.',examples:[]},
 'VOICE.PASSIVE':{label:'수동태',description:'be + p.p.로 주어가 동작의 대상임을 나타냅니다. 본동사의 원래 문형과 남은 목적어·보어를 함께 확인합니다.',examples:[]},
 'CONSTRUCTION.CAUSATIVE':{label:'사역',description:'make·have 뒤에 목적어와 동사 원형을 두어 행동을 하게 함을 나타낼 수 있습니다.',examples:[]},
 'CONSTRUCTION.ASSISTANCE':{label:'도움·준사역',description:'help 뒤에 목적어와 동사 원형 또는 to부정사를 둘 수 있습니다.',examples:[]},
 'CONSTRUCTION.PERCEPTION':{label:'지각',description:'보거나 느끼는 대상의 행동·상태를 나타냅니다. 동사별로 검수된 목적격보어 형태를 사용합니다.',examples:[]},
 'COMPARISON.COMPARATIVE':{label:'비교급',description:'형용사·부사의 비교급으로 정도를 비교합니다. than 뒤에는 비교 기준이 옵니다.',examples:[]},
 'COMPARISON.SUPERLATIVE':{label:'최상급',description:'비교 범위에서 가장 높은 정도를 나타냅니다. 형용사 최상급에는 the나 소유 한정사 등이 필요합니다.',examples:[]},
 'COMPARISON.EQUALITY':{label:'동등 비교',description:'as + 원급 + as로 정도가 같음을 나타냅니다. twice as ~ as는 두 배의 정도입니다.',examples:[]},
 'DEGREE.TOO':{label:'too + 형용사·부사',description:'지나친 정도를 나타냅니다. 뒤의 to부정사는 그 정도와 관련된 행동을 나타낼 수 있습니다.',examples:[]},
 'DEGREE.ENOUGH':{label:'형용사·부사 + enough',description:'충분한 정도를 나타냅니다. enough + 명사는 수량 표현으로 구분합니다.',examples:[]},
 'FRAME.SVOC':{label:'5형식 S+V+O+C',description:'목적격보어가 목적어의 상태·정체·행동을 설명합니다.',examples:['I want you to read books.','I make you happy.']},
 'CLAUSE.INFINITIVE':{label:'to부정사',description:'to와 동사 원형으로 행동을 문장의 재료로 쓰거나 다른 말을 설명합니다.',examples:['To read books is good.','I want to read books.']},
 'CLAUSE.GERUND':{label:'동명사',description:'-ing형으로 된 구가 주어·목적어·보어 등 명사 역할을 합니다.',examples:['Reading books is good.','I enjoy reading books.','My hobby is reading books.']},
 'PARTICIPLE.PRESENT':{label:'현재분사 수식',description:'-ing형으로 된 말이 명사를 설명할 수 있습니다. 명사 수식만으로 진행형이나 동명사가 되지는 않습니다.',examples:['The running dog is happy.']},
 'LINK.CLAUSE':{examples:['I like music and she reads books.','I think that she likes music.'],label:'절 연결',description:'주어와 동사를 중심으로 이루어진 절을 연결합니다. 대등한 절, 이유·시간·조건의 부사절, 내용 목적어절을 구분합니다.'},
 'LINK.PHRASE':{examples:['I like games and music.'],label:'단어·구 연결',description:'접속사는 단어·구·절을 연결하며, 문장에서 쓰임에 따라 역할이 달라집니다. 단어·구 연결은 독립된 두 절과 구분합니다.'},
 'TIME.PAST':{label:'과거',description:'유한 동사의 과거형은 과거의 상황을 나타냅니다. 과거분사만으로 과거절이 되지는 않습니다.',examples:['I played games.']},
 'TIME.PROGRESSIVE':{label:'진행',description:'be + -ing는 해당 시간에 진행 중인 행동을 나타냅니다. 주어와 시간에 맞는 첫 동사 형태를 고릅니다.',examples:['I am playing games.']},
 'TIME.PERFECT':{label:'완료',description:'have + 과거분사는 기준 시점 이전의 행동과 그 시점의 관계를 나타냅니다. has/have는 현재, had는 과거가 기준입니다.',examples:['I have played games.']},
 'TIME.FUTURE_WILL':{label:'will 미래',description:'will 뒤에는 동사 원형이 옵니다. will은 미래의 예상이나 의지 등을 나타낼 수 있습니다.',examples:['I will play games.']},
 'FRAME.SV':{label:'1형식 S+V',description:'주어와 동사를 중심으로 이루어지며 목적어와 보어가 없는 문장입니다.',examples:['I run.']},
 'FRAME.SVC':{label:'2형식 S+V+C',description:'보어가 주어의 상태나 정체를 설명합니다.',examples:['I am happy.','I am a student.']},
 'FRAME.SVO':{label:'3형식 S+V+O',description:'목적어가 동사가 나타내는 행동이나 관계의 대상을 나타냅니다.',examples:['I like books.']},
 'FRAME.SVOO':{label:'4형식 S+V+IO+DO',description:'간접목적어는 보통 받는 대상이나 수혜자를, 직접목적어는 전달하거나 제공하는 대상을 나타냅니다.',examples:['She gives me a book.']},
 'MODIFIER.ADJECTIVE':{label:'형용사 수식',description:'형용사는 명사 앞에서 명사를 수식할 수 있습니다.',examples:['I like the big dog.']},
 'MODIFIER.ADVERB':{label:'부사 수식',description:'부사는 허용된 위치에서 동사·형용사·부사를 수식합니다.',examples:['He runs very fast.']},
 'PHRASE.PP':{label:'전치사구',description:'전치사와 명사구가 함께 쓰여 위치나 대상 등의 관계를 나타냅니다.',examples:['I am at school.']},
};
Object.assign(GRAMMAR_GUIDE,{
 'CLAUSE.RELATIVE.SUBJECT':{label:'주격 관계절',description:'관계절 내부에서 관계사가 주어 역할을 합니다.',examples:[]},
 'CLAUSE.RELATIVE.OBJECT':{label:'목적격 관계절',description:'관계절 내부에서 앞의 명사가 목적어 자리에 연결됩니다. 관계사 생략도 가능합니다.',examples:[]},
 'CLAUSE.RELATIVE.ADVERBIAL':{label:'관계부사절',description:'앞의 장소·시간 명사를 완전한 절로 설명합니다.',examples:[]}
});
export const RELATIVE_ROLE_LABELS={SUBJECT:'주격 관계절',OBJECT:'목적격 관계절',ADVERBIAL:'관계부사절'};
export const QUESTION_ROLE_LABELS={SUBJECT:'주어 질문',OBJECT:'목적어 질문',COMPLEMENT:'보어 질문',ADVERBIAL:'장소·시간 질문'};
export const ROLE_GUIDE={
 SUBJECT:{label:'주어 S',description:'문장에서 말하는 대상을 나타냅니다.'},
 FINITE_VERB:{label:'동사 V',description:'주어의 행동이나 상태를 나타냅니다.'},
 OBJECT:{label:'목적어 O',description:'동사가 나타내는 행동이나 관계의 대상을 나타냅니다.'},
 INDIRECT_OBJECT:{label:'간접목적어 IO',description:'주거나 보여주거나 만들어 주는 행동에서 보통 받는 대상이나 수혜자를 나타냅니다.'},
 DIRECT_OBJECT:{label:'직접목적어 DO',description:'그 행동에서 직접 전달하거나 제공하는 대상입니다.'},
 COMPLEMENT:{label:'보어 C',description:'주어나 목적어가 어떤 상태인지 또는 무엇인지를 설명합니다.'},
 SUBJECT_COMPLEMENT:{label:'주격보어 C',description:'주어의 상태나 정체를 설명합니다.'},
 OBJECT_COMPLEMENT:{label:'목적격보어 C',description:'목적어의 상태·정체·행동을 설명합니다.'},
 PREPOSITION_OBJECT:{label:'전치사의 목적어',description:'전치사와 함께 관계를 나타내는 명사 역할의 구입니다.'},
 PP_OBJECT:{label:'전치사의 목적어',description:'전치사와 함께 관계를 나타내는 명사구입니다.'},
};
export const DATIVE_GUIDE={description:'give/show/send는 to, make는 for를 사용한 대표 대응 표현도 만들 수 있습니다. 이때 to/for 뒤의 명사구는 전치사의 목적어입니다.',examples:['She gives a book to me.','She makes a game for me.']};
export const LOCATION_GUIDE={description:'이 게임의 학교 문형 표기에서 be와 장소 표현은 위치·존재를 나타내는 1형식으로 표시합니다.',examples:['I am at school.','He is in the room.']};
export const SUBMISSION_LABELS={VALID:'완전한 문장',VALID_WITH_ISSUES:'형태 확인 필요',INVALID_CORE:'문장 미완성 · 피해 0'};
export const TIME_ROLE_LABELS={PAST:'과거 계열',PRESENT:'현재 계열',FUTURE:'미래 계열',PROGRESSIVE:'진행',PERFECT:'완료',WILL:'will 미래'};
export const PRONOUN_MEANINGS={
 I:['나(주어)','나를/나에게','나의'],you:['너/여러분(주어)','너를/너에게·여러분을/여러분에게','너의/여러분의'],
 he:['그(주어)','그를/그에게','그의'],she:['그녀(주어)','그녀를/그녀에게','그녀의'],
 it:['그것(주어)','그것을/그것에게','그것의'],we:['우리(주어)','우리를/우리에게','우리의'],they:['그들/그것들(주어)','그들을/그들에게','그들의'],
};
export const ING_FORM_GUIDE='-ing형은 문장 속 쓰임에 따라 동명사·분사로 사용되고, be와 결합해 진행형을 만들 수 있습니다.';
export const NONFINITE_INTERPRETATIONS={INFINITIVE:'to부정사',GERUND:'동명사',PARTICIPLE:'현재분사'};
export const NONFINITE_FUNCTIONS={SUBJECT:'주어',OBJECT:'목적어',SUBJECT_COMPLEMENT:'주격보어',PREPOSITION_OBJECT:'전치사의 목적어',NOUN_MODIFIER:'명사 수식',PURPOSE:'목적 표현',ADJECTIVE_COMPLEMENT:'형용사 연결',OBJECT_COMPLEMENT:'목적격보어'};
export function nonfiniteLabel(phrase){return [phrase.interpretation==='PARTICIPLE'&&phrase.formKind==='PP'?'과거분사':NONFINITE_INTERPRETATIONS[phrase.interpretation],NONFINITE_FUNCTIONS[phrase.function]].filter(Boolean).join(' · ');}
export function formMeaning(word,form){if(isIngForm(form))return '-ing형';const group=PRONOUN_MEANINGS[word.lemma];if(!group)return form.labelKo;return group[{NOMINATIVE:0,OBJECTIVE:1,POSSESSIVE_DETERMINER:2}[form.grammaticalFeatures.case]]??'대명사 형태';}
export function verbUsage(word){
 const frames=new Set(word.frameIds);const parts=[];
 if(frames.has('frame.sv'))parts.push('주어 + 동사');
 if(frames.has('frame.beLocative'))parts.push('주어 + be + 장소 표현');
 if(frames.has('frame.svc.adj')||frames.has('frame.svc.np'))parts.push('주어 + 동사 + 주격보어');
 if(frames.has('frame.svo.wh'))parts.push('주어 + 동사 + 간접의문절 / 의문사 + to + 동사');
 if(frames.has('frame.svoo.wh'))parts.push('주어 + 동사 + 받는 대상 + 간접의문절');
 if(frames.has('frame.svo.content'))parts.push('주어 + 동사 + (that) 내용 목적어절');
 if(frames.has('frame.svo'))parts.push('주어 + 동사 + 목적어');
 if(frames.has('frame.svoo'))parts.push('주어 + 동사 + 간접목적어 + 직접목적어');
 if(frames.has('frame.svoc.adj'))parts.push('목적어 + 형용사 보어');
 if(frames.has('frame.svoc.np'))parts.push('목적어 + 명사 보어');
 if(frames.has('frame.svoc.to'))parts.push('목적어 + to + 동사 원형');
 if(frames.has('frame.svoc.ing'))parts.push('목적어 + -ing 보어');
 if(frames.has('frame.svoc.pp'))parts.push('목적어 + p.p. 보어');
 if(frames.has('frame.svoc.bare'))parts.push('목적어 + 동사 원형');
 if(frames.has('frame.svo.to'))parts.push('to + 동사 원형');
 if([...frames].some(id=>id.startsWith('frame.svo.gerund')))parts.push('동명사(-ing) 목적어');
 if(frames.has('frame.svo.bare'))parts.push('동사 원형');
 return parts.join(' / ');
}

export function nonfiniteUsageNotes(word){return [word.lemma==='enjoy'?'enjoy 뒤에는 동명사(-ing)를 씁니다.':null,word.lemma==='need'?"need + -ing는 '~될 필요가 있다'의 뜻으로도 씁니다.":null].filter(Boolean);}

export const CLAUSE_ROLES={NONFINITE:'준동사구',MAIN:'주절',COORDINATE:'대등한 절',ADVERBIAL:'부사절',CONTENT_OBJECT:'목적어 명사절',RELATIVE:'관계절',EMBEDDED_QUESTION:'간접의문절'};
export const LINK_ROLES={COORDINATED_CLAUSES:'등위절 연결',ADVERBIAL_CLAUSE:'부사절 연결',CONTENT_CLAUSE:'내용 목적어절',SHARED_SUBJECT_VP:'주어를 공유하는 동사구',NP_COORDINATION:'명사구 연결',AP_COORDINATION:'형용사구 연결',PP_COORDINATION:'전치사구 연결',ADVP_COORDINATION:'부사구 연결'};
export const CLAUSE_GUIDE={clause:'절은 주어와 동사를 중심으로 이루어진 덩어리입니다.',coordinate:'등위절은 대등한 두 절입니다. 왼쪽 절이 계산 기준이어도 오른쪽 절이 종속절이 되지는 않습니다.',adverbial:'부사절은 이유·시간·조건 등의 정보를 주절에 덧붙입니다.',content:'명사절은 절 전체가 명사처럼 목적어 등의 자리를 맡습니다.',that:'that은 지시 한정사·대명사·관계절 연결·내용절 연결 역할을 문장 구조에 따라 맡습니다.'};

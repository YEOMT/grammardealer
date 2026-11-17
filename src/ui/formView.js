/** Display-only grouping; preserves all saved selection IDs and language candidates. */
export function formLabel(form){const f=form.grammaticalFeatures??{};return f.tense==='PAST_PARTICIPLE'?'과거분사 · p.p.':f.tense==='BASE'||f.tense==='PRESENT'&&f.number==='NON_3_SINGULAR'?'원형':form.labelKo;}
export function visibleForms(pos,forms){
 if(pos!=='PRONOUN'){
  const groups=[];
  for(const f of forms){
   // A linked noun/verb homograph has one surface button, never a hidden POS mode.
   // Past and p.p. belong to the same lexeme and deliberately remain separate.
   const old=groups.find(x=>x.surface===f.surface&&x.lexemeId!==f.lexemeId);
   if(old){old.aliasFormIds.push(f.id??f.formId);old.labelKo=old.grammaticalFeatures?.number==='PLURAL'||f.grammaticalFeatures?.number==='PLURAL'?'복수 / 3인칭 단수':'원형';}
   else groups.push({...f,aliasFormIds:[f.id??f.formId]});
  }
  return groups;
 }
 const groups=[];
 for(const form of forms){const id=form.id??form.formId,old=groups.find(f=>f.surface===form.surface&&f.lexemeId===form.lexemeId);
  if(old){old.aliasFormIds.push(id);old.labelKo=[...new Set([old.labelKo,form.labelKo])].join('·');old.aliasForms.push(form);}
  else groups.push({...form,aliasFormIds:[id],aliasForms:[form]});
 }
 return groups;
}

/** Compact dictionary labels; forms remain registry-owned and past/p.p. never merge. */
export function dictionaryForms(word,forms){
 const visible=visibleForms(word.pos,forms);
 if(visible.length===1&&visible[0].surface===word.lemma&&!['VERB','PRONOUN','NOUN'].includes(word.pos))return [];
 const groups=new Map();
 for(const form of visible){
  const f=form.grammaticalFeatures??{};
  let label=form.aliasForms?.map(x=>x.labelKo).join('·')??form.labelKo??'';
  if(label!=='복수 / 3인칭 단수'){
   if(f.tense==='PAST_PARTICIPLE')label='p.p.';
   else if(f.tense==='PRESENT_PARTICIPLE'||form.surface.endsWith('ing')&&f.aspect==='PROGRESSIVE')label='-ing';
   else if(f.tense==='PAST')label='과거';
   else if(f.tense==='BASE'||f.tense==='PRESENT'&&f.number==='NON_3_SINGULAR')label='원형';
   else if(word.lemma==='be'&&['am','is','are'].includes(form.surface))label='현재';
   else if(f.tense==='PRESENT'&&f.number==='SINGULAR')label='3인칭 단수';
  }
  if(label===form.surface||label==='기본형'||label==='연결어')label='';
  const values=groups.get(label)??new Set();values.add(form.surface);groups.set(label,values);
 }
 return [...groups].map(([label,surfaces])=>({label,surfaces:[...surfaces].join(' · ')}));
}

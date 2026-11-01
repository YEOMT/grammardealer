/** Display-only grouping; preserves all saved selection IDs and language candidates. */
export function formLabel(form){return form.grammaticalFeatures?.tense==='PAST_PARTICIPLE'?'과거분사 · p.p.':form.labelKo;}
export function visibleForms(pos,forms){
 if(pos!=='PRONOUN'){
  const groups=[];
  for(const f of forms){
   // A linked noun/verb homograph has one surface button, never a hidden POS mode.
   // Past and p.p. belong to the same lexeme and deliberately remain separate.
   const old=groups.find(x=>x.surface===f.surface&&x.lexemeId!==f.lexemeId);
   if(old){old.aliasFormIds.push(f.id??f.formId);old.labelKo=old.grammaticalFeatures?.number==='PLURAL'||f.grammaticalFeatures?.number==='PLURAL'?'복수 / 3인칭 단수':'기본형 · 문장 구조로 용법 판정';}
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

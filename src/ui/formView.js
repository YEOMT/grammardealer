/** Display-only grouping; preserves all saved selection IDs and language candidates. */
export function formLabel(form){return form.grammaticalFeatures?.tense==='PAST_PARTICIPLE'?'과거분사(p.p.)':form.labelKo;}
export function visibleForms(pos,forms){
 if(pos!=='PRONOUN')return forms.map(f=>({...f,aliasFormIds:[f.id??f.formId]}));
 const groups=[];
 for(const form of forms){const id=form.id??form.formId,old=groups.find(f=>f.surface===form.surface&&f.lexemeId===form.lexemeId);
  if(old){old.aliasFormIds.push(id);old.labelKo=[...new Set([old.labelKo,form.labelKo])].join('·');old.aliasForms.push(form);}
  else groups.push({...form,aliasFormIds:[id],aliasForms:[form]});
 }
 return groups;
}

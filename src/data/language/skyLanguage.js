/** Clone the 0.3 vocabulary; old saved runs retain its exact records and ordering. */
export function addSkyLanguage(base) {
 const data=structuredClone(base);
 data.version='0.4.0';
 for(const card of data.cards){
  card.cardKind='WORD';
  if(['card.be','card.have','card.you','card.i'].includes(card.id))card.rarity='UNCOMMON';
 }
 data.cardDefinitions=data.cards;
 data.cardById=Object.fromEntries(data.cards.map(c=>[c.id,c]));
 return data;
}

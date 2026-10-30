import {audio} from '../services/audio.js';
import {button,el,modal} from './dom.js';

let read=()=>({sfxVolume:45,bgmVolume:100,muted:false}),write=()=>{},timer=null,dirty=false;
const flush=()=>{clearTimeout(timer);if(dirty){dirty=false;void write({},true);}};
export function configureSoundControls(getSettings,updateSettings){read=getSettings;write=updateSettings;}
const label=()=>audio.muted?'음소거':audio.context?.state==='running'?'소리':'소리 켜기';
audio.subscribe(()=>(globalThis.document?.querySelectorAll('.sound-toggle')??[]).forEach(n=>{n.textContent=label();n.setAttribute('aria-label',`${label()} · 오디오 설정`);}));
export function soundButton(){return button(label(),()=>{void audio.unlock();openSoundControls();},'quiet sound-toggle',{'aria-label':`${label()} · 오디오 설정`});}
function openSoundControls(){
 const s=read(),status=el('p',{class:'sound-status',role:'status'}),notice=el('p',{class:'sound-notice',role:'status'});
 const change=patch=>{void write(patch,false);dirty=true;clearTimeout(timer);timer=setTimeout(flush,400);};
 const range=(name,key,value)=>{const out=el('output',{text:`${value}%`}),input=el('input',{type:'range',min:0,max:100,value,'aria-label':name,oninput:e=>{out.textContent=`${e.target.value}%`;change({[key]:Number(e.target.value)});}});return el('label',{class:'sound-range'},el('span',{text:name}),out,input);};
 const mute=el('input',{type:'checkbox',checked:s.muted,onchange:e=>change({muted:e.target.checked})});
 const retry=button('다시 시도',()=>{void audio.retryBgm();},'secondary');
 const check=button('소리 확인',async()=>{const ready=await audio.unlock();notice.textContent=audio.muted?'음소거 중입니다. 설정을 유지합니다.':audio.volume===0?'효과음 볼륨이 0입니다.':ready&&audio.play('card')?'짧은 확인음을 요청했습니다. 들리지 않으면 기기 음량과 출력 장치를 확인해 주세요.':'재생을 시작하지 못했습니다. 다시 탭해 주세요.';},'secondary');
 const panel=el('div',{class:'sound-controls'},range('배경음','bgmVolume',s.bgmVolume??100),range('효과음','sfxVolume',s.sfxVolume??45),el('label',{},mute,' 전체 음소거'),status,el('div',{class:'dialog-actions'},check,retry),notice);
 const refresh=()=>{const state=audio.context?.state;status.textContent=audio.bgmStatus==='ERROR'?'배경음 파일을 불러오지 못했습니다. 다시 시도할 수 있습니다.':audio.bgmStatus==='LOADING'?'배경음을 불러오는 중입니다.':state!=='running'?'소리를 시작하려면 소리 확인을 눌러 주세요.':audio.muted?'음소거 중 · 재생 위치는 유지됩니다.':'오디오 사용 가능 · 실제 기기 음량은 기기에서 확인해 주세요.';retry.hidden=audio.bgmStatus!=='ERROR';};
 const unsubscribe=audio.subscribe(refresh),view=modal('소리',panel,{onClose(){unsubscribe();flush();}});view.dialog.classList.add('sound-dialog');
 view.dialog.addEventListener('click',e=>{if(e.target===view.dialog){const r=view.dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)view.close();}});refresh();
}

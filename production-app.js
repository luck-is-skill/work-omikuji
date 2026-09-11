(function() {
  'use strict';
  const el = id => document.getElementById(id);
  const data = window.OMIKUJI_DATA;
  let current = null;
  let busy = false;
  const setText = (id, text) => { el(id).textContent = text; };
  const dateText = () => new Intl.DateTimeFormat('ja-JP', {timeZone:'Asia/Tokyo',month:'long',day:'numeric',weekday:'long'}).format(new Date());
  setText('today', dateText());
  function stars(id, count) {
    const target = el(id);
    target.replaceChildren(document.createTextNode('★'.repeat(count)));
    const empty = document.createElement('span');
    empty.className = 'empty';
    empty.textContent = '☆'.repeat(5-count);
    target.append(empty);
    target.setAttribute('role','img');
    target.setAttribute('aria-label','5段階中'+count);
  }
  function setImage(id, src, alt) {
    const target=el(id);
    target.alt=alt;
    target.src=src;
  }
  function render(result) {
    const f = result.fortune;
    setText('today',dateText());
    setText('result-title',f.name);
    setImage('fortune-image','header-'+f.id+'.png',f.name);
    setImage('benefit-frame','frame-'+f.id+'.png','');
    stars('work-stars',result.work.stars);
    stars('safety-stars',result.safety.stars);
    setText('work-message',result.work.message);
    setText('safety-message',result.safety.message);
    setText('oracle-message',result.oracle);
    setText('wear-name',result.workwear.name);
    setText('wear-message',result.workwear.message);
    setText('color-name',result.color.name);
    setText('color-message',result.color.message);
    el('color-swatch').style.backgroundColor=result.color.hex;
    const benefit=el('benefit-main');
    benefit.replaceChildren();
    if(f.discount) {
      setText('benefit-top','お好きな商品1点');
      const number=document.createElement('strong');
      number.textContent=f.discount;
      benefit.append(number,document.createTextNode('％OFF'));
      setText('terms','当日限り・1回限り・他の割引との併用不可・一部対象外商品あり');
    } else if(f.stamps) {
      setText('benefit-top','スタンプ');
      const number=document.createElement('strong');
      number.textContent=f.stamps;
      benefit.append(number,document.createTextNode('個'));
      setText('terms','スタンプ2個プレゼント');
    } else {
      setText('benefit-top','今日のお告げを');
      setText('benefit-main','お守りに');
      setText('terms','末吉はお告げのみ。割引・スタンプはありません。');
    }
    el('welcome').hidden=true;
    el('result').hidden=false;
    el('result').classList.remove('revealing');
    requestAnimationFrame(()=>el('result').classList.add('revealing'));
    el('result-title').focus({preventScroll:true});
    el('result').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
  }

  const service=window.OmikujiService, storageKey='work-omikuji-ticket-v1';
  let record;
  function display(ticket){
    current=ticket;render(ticket.result);
    setText('coupon-date','有効日：'+ticket.day+'（日本時間・当日限り）');
    const hasBenefit=Boolean(ticket.result.fortune.discount||ticket.result.fortune.stamps);
    setText('coupon-number',hasBenefit?'券番号：'+ticket.token:'');
    setText('coupon-state',!hasBenefit?'今日はお告げをお守りに。':ticket.usedAt?'使用済み（'+new Date(ticket.usedAt).toLocaleTimeString('ja-JP',{timeZone:'Asia/Tokyo'})+'）':'未使用・レジでこの画面をご提示ください');
    setText('status',ticket.usedAt?'この特典は使用済みです。':'本日の結果です。再度開いても同じ結果を表示します。');
  }
  async function perform(action){
    if(busy)return;busy=true;
    el('draw-button').disabled=true;el('again-button').disabled=true;el('error').hidden=true;
    setText('status','確認しています…');
    try{
      if(!navigator.locks)throw new Error('このブラウザでは結果を安全に保存できません。最新のSafariまたはChromeでお試しください。');
      await navigator.locks.request(storageKey,async()=>{
        const info=await service.call({action:'info'});
        let stored;
        try{stored=JSON.parse(localStorage.getItem(storageKey)||'null');}catch{throw new Error('保存した結果を読み込めません。スタッフにお声がけください。');}
        if(stored&&(!/^[a-f0-9]{32}$/.test(stored.token)||!/^\d{4}-\d{2}-\d{2}$/.test(stored.day)))throw new Error('保存した券を確認できません。スタッフにお声がけください。');
        if(action==='restore'&&(!stored||stored.day!==info.day)){setText('status','');return;}
        if(action==='status'&&(!stored||stored.day!==info.day))throw new Error('この券は期限切れです。ページを開き直して本日のおみくじを引いてください。');
        if(!stored||stored.day!==info.day){
          stored={token:service.uuid(),day:info.day};
          try{localStorage.setItem(storageKey,JSON.stringify(stored));}catch{throw new Error('結果を保存できないため抽選を開始できません。ブラウザの保存設定をご確認ください。');}
        }
        record=stored;
        display(await service.call({action:action==='status'?'status':'draw',...stored}));
      });
    }catch(error){setText('status','');setText('error',error.message);el('error').hidden=false;}
    finally{busy=false;el('draw-button').disabled=false;el('again-button').disabled=false;}
  }
  el('draw-button').addEventListener('click',()=>perform('draw'));
  el('again-button').addEventListener('click',()=>perform('status'));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&current)perform('status');});
  perform('restore');
})();

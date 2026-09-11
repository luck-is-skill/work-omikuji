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
  async function draw() {
    if(busy) return {status:'busy'};
    busy=true;
    el('draw-button').disabled=true;
    el('again-button').disabled=true;
    el('error').hidden=true;
    setText('status','おみくじを引いています…');
    try {
      const result=window.OmikujiEngine.draw(data);
      await new Promise(resolve=>setTimeout(resolve,window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:650));
      current=result;
      render(result);
      setText('status',result.fortune.name+'が出ました。');
      return {status:'drawn',fortune:result.fortune.name,work:result.work.stars,safety:result.safety.stars,oracle:result.oracle,workwear:result.workwear.name,color:result.color.name};
    } catch(error) {
      setText('status','');
      setText('error',error.message || '抽選できませんでした。もう一度お試しください。');
      el('error').hidden=false;
      return {status:'error'};
    } finally {
      busy=false;
      el('draw-button').disabled=false;
      el('again-button').disabled=false;
    }
  }
  el('draw-button').addEventListener('click',draw);
  el('again-button').addEventListener('click',draw);
  const context=document.modelContext;
  if(context && context.registerTool) {
    const lifecycle=new AbortController();
    try {
      Promise.resolve(context.registerTool({
        name:'draw_workwear_omikuji',
        title:'作業服おみくじを引く',
        description:'おためし版のおみくじを新しく抽選し、画面の結果を更新します。店頭で使えるクーポンは発行しません。',
        inputSchema:{type:'object',properties:{},additionalProperties:false},
        annotations:{readOnlyHint:false,untrustedContentHint:false},
        execute(input) {
          if(input===null || typeof input!=='object' || Array.isArray(input) || Object.keys(input).length) throw new TypeError('引数は空のオブジェクトにしてください');
          return draw();
        }
      },{signal:lifecycle.signal})).catch(()=>{});
    } catch {}
    window.addEventListener('pagehide',event=>{if(!event.persisted) lifecycle.abort();});
  }
})();

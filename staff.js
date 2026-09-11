(()=>{
  const el=id=>document.getElementById(id);let checked=null,busy=false;
  async function act(redeem){
    if(busy)return;busy=true;el('check-button').disabled=true;el('redeem-button').disabled=true;
    const token=el('token').value.trim().toLowerCase();
    try{
      if(!/^[a-f0-9]{32}$/.test(token))throw new Error('券番号は32文字です。');
      if(redeem&&checked!==token)throw new Error('変更した券の内容を先に確認してください。');
      const secret=el('secret').value;el('secret').value='';
      const t=await OmikujiService.call({action:redeem?'redeem':'status',token,...(redeem?{secret}:{})});
      checked=token;const f=t.result.fortune;
      const benefit=f.discount?'お好きな商品1点 '+f.discount+'％OFF':f.stamps?'スタンプ2個':'特典なし';
      el('result').textContent=(t.usedAt?(redeem&&!t.alreadyUsed?'使用済みにしました':'すでに使用済みです。再適用できません。'):'未使用')+'\n'+t.day+'\n'+f.name+'：'+benefit;
      el('redeem').hidden=Boolean(t.usedAt)||(!f.discount&&!f.stamps);
    }catch(e){el('result').textContent=e.message;el('redeem').hidden=true;checked=null;}
    finally{busy=false;el('check-button').disabled=false;el('redeem-button').disabled=false;}
  }
  el('token').addEventListener('input',()=>{checked=null;el('redeem').hidden=true;});
  el('check').addEventListener('submit',e=>{e.preventDefault();act(false);});
  el('redeem').addEventListener('submit',e=>{e.preventDefault();if(confirm('確認した特典を使用済みにします。よろしいですか？'))act(true);});
})();

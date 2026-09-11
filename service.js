window.OmikujiService = (()=>{
  let bridge, origin, pending=new Map(), ready;
  const uuid=()=>Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,'0')).join('');
  function connect(){
    if(ready) return ready;
    ready=new Promise((resolve,reject)=>{
      if(!/^https:\/\/script.google.com\/macros\/s\/[^/]+\/exec$/.test(window.OMIKUJI_SERVICE_URL||'')) {reject(new Error('ただいま準備中です。'));return;}
      const channel=uuid(), iframe=document.createElement('iframe');
      iframe.hidden=true; iframe.title='券の状態確認'; iframe.referrerPolicy='no-referrer';
      iframe.src=window.OMIKUJI_SERVICE_URL+'?channel='+channel;
      const timer=setTimeout(()=>reject(new Error('接続できません。通信状態を確認してページを開き直してください。')),30000);
      window.addEventListener('message',event=>{
        if(!event.data || event.data.channel!==channel || !/^https:\/\/[a-z0-9-]+\.googleusercontent\.com$/.test(event.origin)) return;
        if(event.data.type==='ready'&&!bridge){bridge=event.source;origin=event.origin;clearTimeout(timer);resolve(channel);}
        if(event.source!==bridge||event.origin!==origin||event.data.type!=='response')return;
        const task=pending.get(event.data.id); if(!task)return;
        pending.delete(event.data.id); clearTimeout(task.timer);
        event.data.error?task.reject(new Error(event.data.error)):task.resolve(event.data.result);
      });
      document.body.append(iframe);
    });return ready;
  }
  async function call(request){
    const channel=await connect(), id=uuid();
    return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{pending.delete(id);reject(new Error('通信結果を確認できません。同じ操作でもう一度確認してください。'));},30000);
      pending.set(id,{resolve,reject,timer}); bridge.postMessage({channel,type:'request',id,request},origin);
    });
  }
  return {call,uuid};
})();

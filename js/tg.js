(function(){
  const w = window;
  const safe = {
    ready: ()=>{},
    expand: ()=>{},
    HapticFeedback:{ impactOccurred: ()=>{} },
    showAlert: (msg)=>{ try{ alert(msg); }catch(e){} }
  };
  const wa = w.Telegram && w.Telegram.WebApp ? w.Telegram.WebApp : safe;
  wa.ready(); wa.expand();
  w.tg = wa; // глобально
})();

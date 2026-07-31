/*
 * Fenêtre de réservation Cal.com.
 * Les liens HTTPS restent présents dans le HTML : si l'intégration échoue ou si
 * JavaScript est désactivé, la page Cal.com s'ouvre normalement.
 */
(function(C,A,L){
  'use strict';
  var p=function(a,ar){a.q.push(ar);};
  var d=C.document;
  C.Cal=C.Cal||function(){
    var cal=C.Cal;
    var ar=arguments;
    if(!cal.loaded){
      cal.ns={};
      cal.q=cal.q||[];
      var script=d.createElement('script');
      d.head.appendChild(script).src=A;
      cal.loaded=true;
    }
    if(ar[0]===L){
      var api=function(){p(api,arguments);};
      var namespace=ar[1];
      api.q=api.q||[];
      if(typeof namespace==='string'){
        cal.ns[namespace]=cal.ns[namespace]||api;
        p(cal.ns[namespace],ar);
        p(cal,['initNamespace',namespace]);
      }else{p(cal,ar);}
      return;
    }
    p(cal,ar);
  };
})(window,'https://app.cal.com/embed/embed.js','init');

Cal('init','appel-confiance-offert',{origin:'https://app.cal.com'});
Cal.config=Cal.config||{};
Cal.config.forwardQueryParams=true;
Cal.ns['appel-confiance-offert']('ui',{
  hideEventTypeDetails:false,
  layout:'month_view'
});
Cal.ns['appel-confiance-offert']('preload',{
  calLink:'allan-figfsv/appel-confiance-offert'
});
document.addEventListener('click',function(event){
  var trigger=event.target.closest('[data-cal-link]');
  if(!trigger){return;}
  event.preventDefault();
  event.stopImmediatePropagation();
  if(typeof window.amTrack==='function'){
    window.amTrack('cal_click',{placement:trigger.getAttribute('data-analytics-placement')||trigger.id||'sans-id'});
  }
  var config={layout:'month_view'};
  try{config=JSON.parse(trigger.getAttribute('data-cal-config')||'{}');}catch(error){}
  Cal.ns['appel-confiance-offert']('modal',{
    calLink:trigger.getAttribute('data-cal-link'),
    calOrigin:'https://app.cal.com',
    config:config
  });
},true);
Cal.ns['appel-confiance-offert']('on',{
  action:'bookingSuccessfulV2',
  callback:function(){
    if(typeof window.amTrack==='function'){ window.amTrack('cal_booking_success'); }
    window.setTimeout(function(){ window.location.assign('merci.html'); },180);
  }
});

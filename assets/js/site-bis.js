(function(){
  var allowed = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'];
  var current = new URLSearchParams(window.location.search);

  document.querySelectorAll('a[href*="cal.com/"]').forEach(function(link,index){
    var url = new URL(link.href);
    allowed.forEach(function(key){
      if(current.get(key)){ url.searchParams.set(key,current.get(key)); }
    });
    if(!url.searchParams.get('utm_content')){
      url.searchParams.set('utm_content',link.getAttribute('data-analytics-placement') || ('bis-cta-' + (index + 1)));
    }
    link.href = url.toString();
  });

  document.querySelectorAll('a[href^="quiz.html"]').forEach(function(link){
    var url = new URL(link.href,window.location.href);
    allowed.forEach(function(key){
      if(current.get(key)){ url.searchParams.set(key,current.get(key)); }
    });
    link.href = url.toString();
  });

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));

  if(reducedMotion || !('IntersectionObserver' in window)){
    reveals.forEach(function(element){ element.classList.add('in'); });
  }else{
    document.documentElement.classList.add('motion-enabled');
    var revealObserver = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('in');
          revealObserver.unobserve(entry.target);
        }
      });
    },{threshold:.08,rootMargin:'0px 0px -7% 0px'});
    reveals.forEach(function(element){ revealObserver.observe(element); });
  }

  var nav = document.querySelector('.nav');
  var sentinel = document.querySelector('.nav-sentinel');
  if(nav && sentinel && 'IntersectionObserver' in window){
    new IntersectionObserver(function(entries){
      nav.classList.toggle('is-scrolled',!entries[0].isIntersecting);
    },{threshold:0}).observe(sentinel);
  }

  var sticky = document.getElementById('stickyCtaBis');
  var hero = document.querySelector('.hero');
  var finalCta = document.getElementById('final-cta-bis');
  var priceCta = document.querySelector('.price .btn');
  if(sticky && hero && finalCta && priceCta && 'IntersectionObserver' in window){
    var heroVisible = true;
    var finalVisible = false;
    var priceVisible = false;
    function refreshSticky(){
      sticky.classList.toggle('show',!heroVisible && !priceVisible && !finalVisible);
    }
    new IntersectionObserver(function(entries){
      heroVisible = entries[0].isIntersecting;
      refreshSticky();
    },{threshold:.02}).observe(hero);
    new IntersectionObserver(function(entries){
      priceVisible = entries[0].isIntersecting;
      refreshSticky();
    },{threshold:.2}).observe(priceCta);
    new IntersectionObserver(function(entries){
      finalVisible = entries[0].isIntersecting;
      refreshSticky();
    },{threshold:.12}).observe(finalCta);
  }
})();

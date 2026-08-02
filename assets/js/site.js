/* Pas de script Cal au chargement. Les vrais liens restent rapides et traçables. */
function trackEvent(name,properties){
  if(typeof window.amTrack === 'function'){ window.amTrack(name,properties || {}); }
}

(function(){
  var allowed = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'];
  var current = new URLSearchParams(window.location.search);
  document.querySelectorAll('a[href*="cal.com/"]').forEach(function(link,index){
    var url = new URL(link.href);
    allowed.forEach(function(key){ if(current.get(key)){ url.searchParams.set(key,current.get(key)); } });
    if(!url.searchParams.get('utm_content')){ url.searchParams.set('utm_content',link.id || ('cta-' + (index + 1))); }
    link.href = url.toString();
  });
})();

(function(){
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!reduce){ document.documentElement.classList.add('motion-enabled'); }

  var reveals = document.querySelectorAll('.reveal,[data-photo-reveal]');
  var photoReveals = Array.prototype.slice.call(document.querySelectorAll('[data-photo-reveal]'));
  if(reduce || !('IntersectionObserver' in window)){
    reveals.forEach(function(el){el.classList.add('in')});
    photoReveals.forEach(function(el){el.style.setProperty('--photo-progress','1')});
  } else {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target);} });
    }, {threshold:0.08, rootMargin:'0px 0px -6% 0px'});
    reveals.forEach(function(el){io.observe(el)});
  }

  /* Les trois scènes de douleur pilotent un seul indicateur, sans scroll-jacking. */
  var painScenes = Array.prototype.slice.call(document.querySelectorAll('.pain-scene'));
  var painIndicator = document.querySelector('.pain-indicator');
  var painCount = document.querySelector('[data-pain-count]');
  var painPlace = document.querySelector('[data-pain-place-active]');
  var painState = document.querySelector('[data-pain-state-active]');
  var painOffsets = [277.5,144.8,0];
  var currentPainIndex = -1;
  function activatePain(scene,index){
    if(index === currentPainIndex){ return; }
    currentPainIndex = index;
    painScenes.forEach(function(item){ item.classList.toggle('is-active',item === scene); });
    if(!painIndicator){ return; }
    painIndicator.style.setProperty('--pain-offset',String(painOffsets[index] || 0));
    painCount.textContent = String(index + 1).padStart(2,'0');
    painPlace.textContent = scene.getAttribute('data-pain-place');
    painState.textContent = scene.getAttribute('data-pain-state');
  }
  if(painScenes.length){
    activatePain(painScenes[0],0);
  }

  /* Timeline : la ligne se remplit au rythme du parcours visible. */
  var nav = document.querySelector('.nav');
  var journey = document.getElementById('immersionJourney');
  var journeySteps = journey ? Array.prototype.slice.call(journey.querySelectorAll('[data-journey-step]')) : [];
  var scrubFigure = document.querySelector('[data-scroll-video]');
  var scrubVideo = scrubFigure ? scrubFigure.querySelector('video') : null;
  var scrubStartRatio = scrubFigure ? Number(scrubFigure.getAttribute('data-scroll-start')) || .88 : .88;
  var scrubEndRatio = scrubFigure ? Number(scrubFigure.getAttribute('data-scroll-end')) || .36 : .36;
  var scrubLastTime = -1;
  var scrubWantedTime = -1;
  var journeyLastProgress = -1;
  function applyScrubSeek(){
    if(!scrubVideo || scrubVideo.readyState < 1 || !isFinite(scrubVideo.duration) || scrubWantedTime < 0 || scrubVideo.seeking){ return; }
    var target = Math.max(0,Math.min(scrubVideo.duration - .04,scrubWantedTime));
    if(Math.abs(target - scrubVideo.currentTime) <= .04){ scrubLastTime = target; return; }
    scrubVideo.currentTime = target;
    scrubLastTime = target;
  }
  function loadScrubVideo(){
    if(!scrubVideo || scrubVideo.dataset.loaded === 'true'){ return; }
    var source = scrubVideo.querySelector('source[data-src]');
    if(source){ source.src = source.dataset.src; }
    scrubVideo.dataset.loaded = 'true';
    scrubVideo.load();
  }
  if(scrubVideo){
    scrubVideo.pause();
    scrubVideo.addEventListener('loadedmetadata',queueScrollMotion);
    scrubVideo.addEventListener('seeked',applyScrubSeek);
    if('IntersectionObserver' in window){
      new IntersectionObserver(function(entries,observer){
        if(entries[0].isIntersecting){ loadScrubVideo(); observer.disconnect(); }
      },{rootMargin:'700px 0px'}).observe(scrubFigure);
    }else{ loadScrubVideo(); }
  }
  var scrollQueued = false;
  function updateScrollMotion(){
    scrollQueued = false;
    if(nav){ nav.classList.toggle('is-scrolled',window.scrollY > 12); }
    var viewport = window.innerHeight || document.documentElement.clientHeight;
    if(painScenes.length){
      var target = viewport * (window.innerWidth <= 720 ? .38 : .48);
      var nearestIndex = 0;
      var nearestDistance = Infinity;
      painScenes.forEach(function(scene,index){
        var sceneRect = scene.getBoundingClientRect();
        var distance = Math.abs((sceneRect.top + sceneRect.height * .5) - target);
        if(distance < nearestDistance){ nearestDistance = distance; nearestIndex = index; }
      });
      activatePain(painScenes[nearestIndex],nearestIndex);
    }
    if(!reduce){
      photoReveals.forEach(function(photo){
        var photoRect = photo.getBoundingClientRect();
        var span = Math.max(150,Math.min(viewport * .48,photoRect.height * .68));
        var photoRaw = (viewport * .92 - photoRect.top) / span;
        var photoProgress = Math.max(0,Math.min(1,photoRaw));
        photo.style.setProperty('--photo-progress',photoProgress.toFixed(3));
        photo.style.setProperty('--photo-scale',(1.045 - photoProgress * .045).toFixed(3));
      });
      if(scrubFigure){
        var scrubRect = scrubFigure.getBoundingClientRect();
        var scrubStart = viewport * scrubStartRatio;
        var scrubEnd = viewport * scrubEndRatio;
        var scrubProgress = Math.max(0,Math.min(1,(scrubStart - scrubRect.top) / Math.max(1,scrubStart - scrubEnd)));
        scrubFigure.style.setProperty('--scrub-progress',(scrubProgress * 100).toFixed(2) + '%');
        if(scrubVideo && scrubVideo.readyState >= 1 && isFinite(scrubVideo.duration)){
          var scrubTarget = scrubProgress * Math.max(0,scrubVideo.duration - .08);
          if(Math.abs(scrubTarget - scrubLastTime) > .04){
            scrubWantedTime = scrubTarget;
            applyScrubSeek();
          }
        }
      }
    }
    if(!journey || reduce){ return; }
    var rect = journey.getBoundingClientRect();
    var raw = (viewport * .68 - rect.top) / Math.max(1,rect.height + viewport * .18);
    var progress = Math.max(0,Math.min(1,raw));
    if(Math.abs(progress - journeyLastProgress) > .001){
      journey.style.setProperty('--journey-progress',progress.toFixed(3));
      journeyLastProgress = progress;
    }
    journeySteps.forEach(function(step){
      var stepTop = step.getBoundingClientRect().top;
      var isPast = step.classList.contains('is-past');
      if(!isPast && stepTop < viewport * .58){ step.classList.add('is-past'); }
      else if(isPast && stepTop > viewport * .72){ step.classList.remove('is-past'); }
    });
  }
  function queueScrollMotion(){
    if(scrollQueued){ return; }
    scrollQueued = true;
    window.requestAnimationFrame(updateScrollMotion);
  }
  window.addEventListener('scroll',queueScrollMotion,{passive:true});
  window.addEventListener('resize',queueScrollMotion);
  updateScrollMotion();

  /* Waveform calculée à partir du vrai MP3 de Kilian. */
  var audio = document.getElementById('kilianAudio');
  if(audio){
    var audioWrap = audio.closest('.kaudio-wrap');
    var player = audioWrap.querySelector('.voice-player');
    var toggle = audioWrap.querySelector('.voice-toggle');
    var seek = audioWrap.querySelector('.wave-seek');
    var played = audioWrap.querySelector('.wave-played');
    var currentLabel = audioWrap.querySelector('[data-audio-current]');
    var durationLabel = audioWrap.querySelector('[data-audio-duration]');
    var speedButtons = Array.prototype.slice.call(audioWrap.querySelectorAll('[data-audio-speed]'));
    var audioStarted = false;
    var audioMilestones = {25:false,50:false,75:false,100:false};
    var waveData = [100,85,92,93,87,85,89,80,90,80,84,78,76,79,85,88,89,82,94,99,80,78,91,79,83,80,90,81,86,83,72,70,82,83,90,79,86,81,87,83,82,76,79,88,86,87,76,75,87,90,78,83,81,73,79,72,82,84,77,81,74,83,78,76,73,67,90,82,81,77,79,73,73,82,78,69,95,72,87,76,86,70,76,83,51,89,73,72];
    audioWrap.querySelectorAll('[data-wave-layer]').forEach(function(layer){
      var fragment = document.createDocumentFragment();
      waveData.forEach(function(height,index){
        var bar = document.createElement('span');
        bar.style.setProperty('--bar',height);
        bar.style.setProperty('--delay',(-index * 18) + 'ms');
        fragment.appendChild(bar);
      });
      layer.appendChild(fragment);
    });
    function formatTime(seconds){
      if(!isFinite(seconds)){ return '0:00'; }
      var minutes = Math.floor(seconds / 60);
      var rest = Math.floor(seconds % 60);
      return minutes + ':' + String(rest).padStart(2,'0');
    }
    function updateAudio(){
      var duration = isFinite(audio.duration) ? audio.duration : 253;
      var ratio = duration ? audio.currentTime / duration : 0;
      seek.value = String(Math.round(ratio * 1000));
      played.style.setProperty('--played',(ratio * 100).toFixed(2) + '%');
      currentLabel.textContent = formatTime(audio.currentTime);
      durationLabel.textContent = formatTime(duration);
    }
    player.hidden = false;
    audioWrap.classList.add('audio-enhanced');
    toggle.addEventListener('click',function(){
      if(audio.paused){
        var playPromise = audio.play();
        if(playPromise && playPromise.catch){ playPromise.catch(function(){ audioWrap.classList.remove('audio-enhanced'); }); }
      } else {
        audio.pause();
      }
    });
    seek.addEventListener('input',function(){
      if(isFinite(audio.duration)){ audio.currentTime = (Number(seek.value) / 1000) * audio.duration; }
      updateAudio();
    });
    speedButtons.forEach(function(button){
      button.addEventListener('click',function(){
        var rate = Number(button.getAttribute('data-audio-speed')) || 1;
        audio.playbackRate = rate;
        audio.defaultPlaybackRate = rate;
        speedButtons.forEach(function(item){
          item.setAttribute('aria-pressed',item === button ? 'true' : 'false');
        });
        trackEvent('kilian_audio_speed',{speed:rate});
      });
    });
    audio.addEventListener('play',function(){
      if(!audioStarted){ audioStarted = true; trackEvent('kilian_audio_play'); }
      toggle.classList.add('is-playing');
      audioWrap.classList.add('is-playing');
      toggle.setAttribute('aria-label','Mettre en pause le témoignage de Kilian');
    });
    audio.addEventListener('pause',function(){
      toggle.classList.remove('is-playing');
      audioWrap.classList.remove('is-playing');
      toggle.setAttribute('aria-label','Lire le témoignage de Kilian');
    });
    audio.addEventListener('timeupdate',function(){
      updateAudio();
      if(!isFinite(audio.duration) || !audio.duration){ return; }
      var percent = Math.floor((audio.currentTime / audio.duration) * 100);
      [25,50,75].forEach(function(milestone){
        if(percent >= milestone && !audioMilestones[milestone]){
          audioMilestones[milestone] = true;
          trackEvent('kilian_audio_progress',{percent:milestone});
        }
      });
    });
    audio.addEventListener('durationchange',updateAudio);
    audio.addEventListener('ended',function(){
      if(!audioMilestones[100]){ audioMilestones[100] = true; trackEvent('kilian_audio_progress',{percent:100}); }
      audioWrap.classList.remove('is-playing'); audio.currentTime = 0; updateAudio();
    });
    audio.addEventListener('error',function(){ audioWrap.classList.remove('audio-enhanced'); });
    updateAudio();
  }

  var testimonialVideo = document.getElementById('theophileVideo');
  if(testimonialVideo){
    var videoSpeedButtons = Array.prototype.slice.call(document.querySelectorAll('[data-video-speed]'));
    var videoStarted = false;
    videoSpeedButtons.forEach(function(button){
      button.addEventListener('click',function(){
        var rate = Number(button.getAttribute('data-video-speed')) || 1;
        testimonialVideo.playbackRate = rate;
        testimonialVideo.defaultPlaybackRate = rate;
        videoSpeedButtons.forEach(function(item){
          item.setAttribute('aria-pressed',item === button ? 'true' : 'false');
        });
        trackEvent('theophile_video_speed',{speed:rate});
      });
    });
    testimonialVideo.addEventListener('play',function(){
      if(!videoStarted){ videoStarted = true; trackEvent('theophile_video_play'); }
    });
  }

  var sticky = document.getElementById('stickyCta');
  var hero = document.querySelector('.hero');
  var finalCta = document.getElementById('final-cta');
  var pastHero = false, finalVisible = false;
  function refresh(){
    if(pastHero && !finalVisible){ sticky.classList.add('show'); }
    else { sticky.classList.remove('show'); }
  }
  if('IntersectionObserver' in window && sticky && hero && finalCta){
    new IntersectionObserver(function(en){ pastHero = !en[0].isIntersecting; refresh(); },{threshold:0}).observe(hero);
    new IntersectionObserver(function(en){ finalVisible = en[0].isIntersecting; refresh(); },{threshold:0.1}).observe(finalCta);
  }
})();

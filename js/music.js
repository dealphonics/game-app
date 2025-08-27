window.Music = (function(){
  // Настройте при необходимости (если файлы в другом каталоге)
  const baseRepo = 'dealphonics/game-app';
  const basePaths = [
    (rel)=>`https://raw.githubusercontent.com/${baseRepo}/main/${rel}`,
    (rel)=>`https://dealphonics.github.io/game-app/${rel}`,
    (rel)=>`https://raw.githubusercontent.com/${baseRepo}/master/${rel}`
  ];

  // Два альбома c реальными названиями и относительными путями к mp3
  const albums = {
    karmageddon: {
      title:'Karmageddon', artist:'Kizaru',
      tracks: [
        {id:'k_dezhavu', title:'Дежавю', artist:'Kizaru', path:'karmageddon/dezhavu.mp3'},
        {id:'k_top_dog', title:'Top Dog', artist:'Kizaru', path:'karmageddon/top_dog.mp3'},
        {id:'k_vodopad', title:'Водопад', artist:'Kizaru', path:'karmageddon/vodopad.mp3'},
        {id:'k_derzhu_raion', title:'Держу район', artist:'Kizaru', path:'karmageddon/derzhu_raion.mp3'},
        {id:'k_money_long', title:'MONEY LONG', artist:'Kizaru', path:'karmageddon/money_long.mp3'},
        {id:'k_deep_end', title:'Deep End', artist:'Kizaru', path:'karmageddon/deep_end.mp3'},
        {id:'k_smooth_operator', title:'Smooth operator', artist:'Kizaru', path:'karmageddon/smooth_operator.mp3'},
        {id:'k_psihopat_lunatik', title:'Психопат-лунатик', artist:'Kizaru', path:'karmageddon/psihopat_lunatik.mp3'},
        {id:'k_sim_salabim', title:'Сим салабим', artist:'Kizaru', path:'karmageddon/sim_salabim.mp3'},
        {id:'k_vse_chto_ugodno', title:'Все что угодно', artist:'Kizaru', path:'karmageddon/vse_chto_ugodno.mp3'}
      ]
    },
    psychi: {
      title:'Психи попадают в топ', artist:'Макс Корж',
      tracks: [
        {id:'p_snadobye', title:'Снадобье', artist:'Макс Корж', path:'psychi/snadobye.mp3'},
        {id:'p_afgan', title:'Афган', artist:'Макс Корж', path:'psychi/afgan.mp3'},
        {id:'p_sozhzheny', title:'Сожжены', artist:'Макс Корж', path:'psychi/sozhzheny.mp3'},
        {id:'p_luchshiy_vaib', title:'Лучший вайб', artist:'Макс Корж', path:'psychi/luchshiy_vaib.mp3'},
        {id:'p_young_haze', title:'Young haze', artist:'Макс Корж', path:'psychi/young_haze.mp3'},
        {id:'p_ulitsy_bez_fonarey', title:'Улицы без фонарей', artist:'Макс Корж', path:'psychi/ulitsy_bez_fonarey.mp3'},
        {id:'p_tak_i_znal', title:'Так и знал', artist:'Макс Корж', path:'psychi/tak_i_znal.mp3'},
        {id:'p_na_domu', title:'На дому', artist:'Макс Корж', path:'psychi/na_domu.mp3'},
        {id:'p_animals', title:'Animals', artist:'Макс Корж', path:'psychi/animals.mp3'},
        {id:'p_zapravka', title:'Заправка', artist:'Макс Корж', path:'psychi/zapravka.mp3'}
      ]
    }
  };

  function renderTracks(targetEl, albumKey, unlocked, onPlay){
    const album = albums[albumKey] || albums.karmageddon;
    const list = album.tracks;
    targetEl.innerHTML = '';
    list.forEach(track=>{
      const isUnlocked = unlocked.includes(track.id);
      const row = document.createElement('div');
      row.className = 'track' + (isUnlocked?'':' locked');
      row.innerHTML = `
        <div class="info">
          <div class="title">${isUnlocked?'🎵':'🔒'} ${track.title}</div>
          <div class="artist">${track.artist} · ${album.title}</div>
        </div>
        <button class="play" ${isUnlocked?'':'disabled'}>▶️</button>`;
      row.querySelector('.play')?.addEventListener('click', ()=> onPlay(track, albumKey));
      targetEl.appendChild(row);
    });
  }

  async function playAudio(track){
    try{ window.__currentAudio?.pause(); }catch(e){}
    window.__currentAudio = null;

    // Пробуем цепочку URL (raw main → pages → raw master)
    const candidates = basePaths.map(f => f(track.path));

    for (let i=0;i<candidates.length;i++){
      const url = candidates[i];
      try{
        const audio = new Audio();
        audio.src = url;
        audio.preload = 'auto';
        audio.crossOrigin = 'anonymous';
        audio.volume = 0.9;
        await audio.play();
        window.__currentAudio = audio;
        audio.onended = ()=> window.__currentAudio = null;
        audio.onerror = ()=> {/* попробуем следующий */};
        return; // успех
      }catch(e){
        // пробуем следующий источник
      }
    }

    // Фолбэк: beep и предупреждение
    try{
      const AC = window.AudioContext || window.webkitAudioContext;
      const ctx = new AC();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 520; gain.gain.value = 0.15;
      osc.start(); setTimeout(()=>{ osc.stop(); ctx.close(); }, 500);
    }catch(e){}
    tg.showAlert('Не удалось воспроизвести трек с GitHub. Проверьте пути/ветку или включите GitHub Pages.\nФайл: '+track.path);
  }

  return { albums, renderTracks, playAudio };
})();

/* audio.js — adaptive BGM per area + SFX, using supplied .wav files. */
var RHE = window.RHE || {};
RHE.Audio = {
  bgm:null, bgmName:"", sfxCache:{}, muted:false, musicVol:1, voiceOn:true,
  BGM:{title:"assets/bgm/Main_menu.mp3",outpost:"assets/bgm/Greenwood outpost.mp3",
    forest:"assets/bgm/Whispering Greenwood and corrputed hollow.mp3",
    hollow:"assets/bgm/Whispering Greenwood and corrputed hollow.mp3",
    cave:"assets/bgm/Hidden_lyra_passage.mp3",gate:"assets/bgm/Silverwall Gate.mp3",
    spire:"assets/bgm/Ashen Approach (volcanic road).mp3",
    spirecity:"assets/bgm/Spire Capital (Ruby's court).mp3",sky:"assets/bgm/mountain.wav",
    plains:"assets/bgm/plains.wav",marsh:"assets/bgm/marsh.wav",silverwall:"assets/bgm/town.wav",
    starlia:"assets/bgm/idle.wav",pit:"assets/bgm/Altar Depths (finale dungeon).mp3",
    combat:"assets/bgm/combat.mp3",night:"assets/bgm/esc_menu and night and ending.mp3",
    menu:"assets/bgm/esc_menu and night and ending.mp3"},
  playBGM(name,vol){
    if(this.muted) return;
    if(this.bgmName===name) return;
    try{
      if(this.bgm){this.bgm.pause();}
      this.bgm = new Audio(name); this.bgm.loop=true;
      this.bgmBase=(vol===undefined?0.45:vol);
      this.bgm.volume=this.bgmBase*this.musicVol;
      this.bgmName=name; this.bgm.play().catch(()=>{});
    }catch(e){}
  },
  sfx(file,vol){
    if(this.muted) return;
    try{ var a=new Audio(file); a.volume=vol||0.5; a.play().catch(()=>{});}catch(e){}
  },
  hit(){this.sfx("assets/sfx/hit.wav",0.5);}, bow(){this.sfx("assets/sfx/bow.wav",0.4);},
  ui(){this.sfx("assets/sfx/ui.wav",0.4);}, chime(){this.sfx("assets/sfx/chime.wav",0.6);},
  thunder(){this.sfx("assets/sfx/thunder.wav",0.35);},
  voiceFile:null,
  voice(file){ // spoken lines (pre-generated mp3s) — missing file = silent skip.
    // The freshest toast liveth as long as the audio (duration + tail).
    if(this.muted||!this.voiceOn||!file)return;
    try{ if(this.voiceFile){try{this.voiceFile.pause();}catch(e){}}
      var a=new Audio(file); a.volume=0.9; this.voiceFile=a;
      a.onloadedmetadata=function(){ try{
        var dur=a.duration;
        if(!isFinite(dur)||dur<=0||dur>90)return;
        var st=document.getElementById("toast-stack");
        var last=st&&st.lastChild;
        if(last&&last._born&&Date.now()-last._born<2000){
          clearTimeout(last._t);
          last._t=setTimeout(function(){last.remove();},Math.round(dur*1000)+800);
        }}catch(e){} };
      a.play().catch(()=>{});}catch(e){}
  },
  updateMute(m){this.muted=m; if(m&&this.bgm){this.bgm.pause();this.bgmName="";}},
  applyMusic(){try{if(this.bgm)this.bgm.volume=(this.bgmBase===undefined?0.45:this.bgmBase)*this.musicVol;}catch(e){}},
  saveSettings(){try{localStorage.setItem("rehevane_settings",JSON.stringify({muted:this.muted,musicVol:this.musicVol,voiceOn:this.voiceOn,textSpeed:RHE.textSpeed||1}));}catch(e){}},
  loadSettings(){try{var s=JSON.parse(localStorage.getItem("rehevane_settings")||"{}");if(s.muted!==undefined)this.muted=!!s.muted;if(s.musicVol!==undefined)this.musicVol=Math.max(0,Math.min(1,+s.musicVol));if(s.voiceOn!==undefined)this.voiceOn=!!s.voiceOn;if(s.textSpeed)RHE.textSpeed=+s.textSpeed||1;}catch(e){}},
};

function setCurrentYear(){
  const yearTarget=document.getElementById("year");
  if(yearTarget){
    yearTarget.textContent=new Date().getFullYear();
  }
}

function initMobileNav() {
  const toggle = document.querySelector('.nav-toggle');
  const list = document.querySelector('.nav-list');
  
  if(toggle && list) {
    toggle.addEventListener('click', () => {
      const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', !isExpanded);
      list.classList.toggle('is-open');
    });
  }
}

async function loadTranslations(lang){
  try{
    const res=await fetch(`i18n/${lang}.json`);
    if(!res.ok) throw new Error(`Unable to load translations for ${lang}`);
    const dict=await res.json();
    document.querySelectorAll("[data-i18n]").forEach(el=>{
      const key=el.dataset.i18n;
      const translation=dict[key];
      if(translation===undefined) return;
      const attrTarget=el.dataset.i18nAttr;
      if(attrTarget){
        el.setAttribute(attrTarget,translation);
      }else{
        el.innerHTML=translation;
      }
    });
    document.documentElement.lang=lang;
    localStorage.setItem("preferredLang",lang);
    document.dispatchEvent(new CustomEvent("translations:loaded",{detail:{lang,dict}}));
  }catch(err){
    console.error(err);
  }
}

class LanguageSwitcher extends HTMLElement{
  connectedCallback(){
    this.classList.add("language-switcher");
    this.currentLang=localStorage.getItem("preferredLang")||"en";
    this.isOpen=false;
    this.render();
    this.cacheElements();
    this.bindEvents();
    this.updateMenuSelection();
    this.updateButtonLabel();
    loadTranslations(this.currentLang);
  }

  disconnectedCallback(){
    document.removeEventListener("click",this.handleDocumentClick);
    document.removeEventListener("keydown",this.handleGlobalKeyDown);
    document.removeEventListener("translations:loaded",this.handleTranslationsLoaded);
  }

  render(){
    this.innerHTML=`
      <button type="button" class="language-switcher__button" aria-haspopup="true" aria-expanded="false">
        <span class="language-switcher__label" data-lang-label>EN</span>
      </button>
      <ul class="language-switcher__menu" role="menu" hidden>
        <li><button type="button" role="menuitemradio" aria-checked="false" data-lang="en" data-i18n="lang_en">English</button></li>
        <li><button type="button" role="menuitemradio" aria-checked="false" data-lang="es" data-i18n="lang_es">Español</button></li>
        <li><button type="button" role="menuitemradio" aria-checked="false" data-lang="qu" data-i18n="lang_qu">Runasimi</button></li>
      </ul>
    `;
  }

  cacheElements(){
    this.button=this.querySelector(".language-switcher__button");
    this.buttonLabel=this.querySelector("[data-lang-label]");
    this.menu=this.querySelector(".language-switcher__menu");
    this.menuButtons=Array.from(this.querySelectorAll('[role="menuitemradio"]'));
  }

  bindEvents(){
    this.handleButtonClick=this.handleButtonClick.bind(this);
    this.handleDocumentClick=this.handleDocumentClick.bind(this);
    this.handleGlobalKeyDown=this.handleGlobalKeyDown.bind(this);
    this.handleTranslationsLoaded=this.handleTranslationsLoaded.bind(this);

    this.button.addEventListener("click",this.handleButtonClick);
    this.button.addEventListener("keydown",event=>this.handleButtonKeydown(event));
    this.menuButtons.forEach(btn=>{
      btn.addEventListener("click",()=>this.selectLanguage(btn.dataset.lang));
      btn.addEventListener("keydown",event=>this.handleMenuItemKeydown(event,btn));
    });
    document.addEventListener("click",this.handleDocumentClick);
    document.addEventListener("keydown",this.handleGlobalKeyDown);
    document.addEventListener("translations:loaded",this.handleTranslationsLoaded);
  }

  handleButtonClick(event){
    event.stopPropagation();
    this.toggleMenu();
  }

  handleButtonKeydown(event){
    if(event.key==="ArrowDown"||event.key==="Enter"||event.key===" "){
      event.preventDefault();
      if(!this.isOpen){
        this.openMenu();
      }
      this.focusMenuItem(0);
    }else if(event.key==="ArrowUp"){
      event.preventDefault();
      if(!this.isOpen){
        this.openMenu();
      }
      this.focusMenuItem(this.menuButtons.length-1);
    }
  }

  handleMenuItemKeydown(event,btn){
    switch(event.key){
      case "ArrowDown":
        event.preventDefault();
        this.focusNext(btn);
        break;
      case "ArrowUp":
        event.preventDefault();
        this.focusPrevious(btn);
        break;
      case "Home":
        event.preventDefault();
        this.focusMenuItem(0);
        break;
      case "End":
        event.preventDefault();
        this.focusMenuItem(this.menuButtons.length-1);
        break;
      case "Escape":
        event.preventDefault();
        this.closeMenu();
        this.button.focus();
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        this.selectLanguage(btn.dataset.lang);
        break;
      default:
        break;
    }
  }

  handleDocumentClick(event){
    if(this.isOpen && !this.contains(event.target)){
      this.closeMenu();
    }
  }

  handleGlobalKeyDown(event){
    if(event.key==="Escape" && this.isOpen){
      this.closeMenu();
      this.button.focus();
    }
  }

  handleTranslationsLoaded(event){
    const {lang}=event.detail||{};
    if(lang===this.currentLang){
      this.updateMenuSelection();
      this.updateButtonLabel();
    }
  }

  toggleMenu(){
    this.isOpen?this.closeMenu():this.openMenu();
  }

  openMenu(){
    this.isOpen=true;
    this.menu.hidden=false;
    this.button.setAttribute("aria-expanded","true");
  }

  closeMenu(){
    this.isOpen=false;
    this.menu.hidden=true;
    this.button.setAttribute("aria-expanded","false");
  }

  focusMenuItem(index){
    const target=this.menuButtons[index];
    if(target){
      target.focus();
    }
  }

  focusNext(current){
    const idx=this.menuButtons.indexOf(current);
    const nextIndex=(idx+1)%this.menuButtons.length;
    this.focusMenuItem(nextIndex);
  }

  focusPrevious(current){
    const idx=this.menuButtons.indexOf(current);
    const prevIndex=(idx-1+this.menuButtons.length)%this.menuButtons.length;
    this.focusMenuItem(prevIndex);
  }

  selectLanguage(lang){
    if(lang===this.currentLang){
      this.closeMenu();
      return;
    }
    this.currentLang=lang;
    localStorage.setItem("preferredLang",lang);
    this.updateMenuSelection();
    this.closeMenu();
    this.button.focus();
    loadTranslations(lang);
  }

  updateMenuSelection(){
    if(!this.menuButtons) return;
    this.menuButtons.forEach(btn=>{
      const isActive=btn.dataset.lang===this.currentLang;
      btn.setAttribute("aria-checked",String(isActive));
    });
  }

  updateButtonLabel(){
    if(!this.buttonLabel||!this.menuButtons) return;
    const active=this.menuButtons.find(btn=>btn.dataset.lang===this.currentLang);
    if(active){
      // Short label (EN/ES/QU)
      const fullText = active.textContent.trim();
      this.buttonLabel.textContent = fullText.substring(0,2).toUpperCase();
    }
  }
}

customElements.define("language-switcher",LanguageSwitcher);

document.addEventListener("DOMContentLoaded",()=>{
  setCurrentYear();
  initMobileNav();
});

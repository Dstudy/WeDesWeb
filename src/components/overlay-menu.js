// /src/components/overlay-menu.js
class OverlayMenu extends HTMLElement {
  static get observedAttributes() {
    return ["open"];
  }

  constructor() {
    super();
    const root = this.attachShadow({ mode: "open" });
    root.innerHTML = `
        <style>
          :host{
            --bg: #fff;
            --fg: #0b0b0b;
            --mg: #0b0b0b;
            --line: #bdbdbd;
            --hover-bg: #000;
            --hover-fg: #fff;
            --item-pt:   clamp(12px, 2.6vh, 20px); /* top padding per item */
            --item-pb:   clamp(12px, 2.6vh, 20px); /* bottom padding per item */
            --pad-x: 50px;
            position: relative;
            z-index: 100000; /* above GSAP pins etc. */

            --btn:    clamp(32px, 8vw, 40px);
            --icon-w: clamp(16px, 6vw, 22px);
            --icon-h: clamp(1.2px, .45vw, 3px);
            --bar-gap: calc(var(--btn) * .14);
            --overlay-top-pad: 65px; 

            font-family: 'Unbounded';
            position: relative; z-index: 100000;    
          }
          /* Hamburger */
  .menu-btn{
    position: fixed; top:25px; left:24px; z-index:100001;
    width: var(--btn); height: var(--btn);
    display:grid; place-items:center; background:transparent; border:0; cursor:pointer;
  }
  .menu-btn span, .menu-btn::before, .menu-btn::after{
    content:""; display:block; width: var(--icon-w); height: var(--icon-h); background: var(--mg);
    transition: transform .25s ease, opacity .2s ease, background .2s ease;
    
  }
  .menu-btn::before{ transform: translateY(calc(-1 * var(--bar-gap))); }
  .menu-btn::after{  transform: translateY(var(--bar-gap)); }
  :host([open]) .menu-btn span{ opacity:0; }
  :host([open]) .menu-btn::before{ transform: rotate(45deg); }
  :host([open]) .menu-btn::after{  transform: rotate(-45deg); }

  /* Overlay */
  .menu-overlay{
    position: fixed; inset: 0; z-index: 100000; background: var(--bg);
    transform: translateY(-100%); opacity: 0;
    transition: transform .35s cubic-bezier(.22,.61,.36,1), opacity .3s ease;
    display:flex; flex-direction:column;
    padding-top: calc(env(safe-area-inset-top, 0) + var(--overlay-top-pad));
  padding-bottom: env(safe-area-inset-bottom, 0);
  }
  :host([open]) .menu-overlay{ transform: translateY(0); opacity:1; }

  nav{ width:100%; }
  .menu-list{ list-style:none; margin:0; padding: 0; border-top:1px solid var(--line); }
  .menu-item{ 
  border-bottom:2px solid var(--line); }
  .menu-item:first-child { border-top: 0 !important; }
  .menu-list:first-child { border-top: 0 !important; }
  .menu-link{
    display:flex; align-items:center;
    text-decoration:none;
    padding:0 var(--pad-x); 
    padding-top: var(--item-pt);
    padding-bottom: var(--item-pb);
    color:var(--fg); text-transform:uppercase; font-weight:500; letter-spacing:.5px;
    font-size: var(--link-size);
    transition: background-color .25s ease, color .25s ease;
  }
  .menu-link:hover, .menu-link:focus-visible{ background:var(--hover-bg); color:var(--hover-fg); outline:none; }
  
  
          @media (max-width:480px) and (orientation:portrait){
            :host{
            --btn:       clamp(30px, 9vw, 36px);
            --icon-w:    clamp(14px, 6vw, 18px);
            --icon-h:    clamp(1px, .5vw, 1.6px);
            --bar-gap:   calc(var(--btn) * .26);
            --row-h:     clamp(52px, 12vh, 76px);
            --pad-x:     clamp(14px, 6vw, 22px);
            --link-size: clamp(13px, 4vw, 22px);
        }       
          }
          @media (max-height:420px) and (orientation: landscape){
             :host{
      --btn:       clamp(28px, 7vw, 34px);
      --icon-w:    clamp(14px, 5vw, 18px);
      --icon-h:    clamp(1px, .35vw, 1.4px);
      --bar-gap:   calc(var(--btn) * .1);
      --row-h:     clamp(46px, 14vh, 100px);
      --pad-x:     clamp(12px, 5vw, 20px);
      --link-size: clamp(12px, 3.2vw, 18px);
      --overlay-top-pad: 50px; 
    }
          }
        </style>
  
        <button class="menu-btn" aria-label="Mở menu" aria-controls="overlay-menu" aria-expanded="false">
          <span></span>
        </button>
  
        <div class="menu-overlay" id="overlay-menu" aria-hidden="true">
          <nav role="navigation">
            <ul class="menu-list">
            <li class="menu-item"><a class="menu-link" href="/WeDesWeb/index.html">Trang chủ</a></li>
              <li class="menu-item"><a class="menu-link" href="/WeDesWeb/src/page2.html">GIỚI THIỆU</a></li>
              <li class="menu-item"><a class="menu-link" href="/WeDesWeb/src/showcase.html">SHOWCASE</a></li>
              <li class="menu-item"><a class="menu-link" href="/WeDesWeb/src/bonding.html">TEAMBONDING</a></li>
              <li class="menu-item"><a class="menu-link" href="/WeDesWeb/src/reason.html">LÝ DO NÊN THAM GIA</a></li>
              <li class="menu-item"><a class="menu-link" href="/WeDesWeb/src/page3.html">CẢM NHẬN CÁC THÀNH VIÊN</a></li>
              <li class="menu-item"><a class="menu-link" href="/WeDesWeb/src/page4.html">ĐỊNH HƯỚNG TƯƠNG LAI</a></li>
            </ul>
          </nav>
        </div>
      `;

    this._btn = root.querySelector(".menu-btn");
    this._overlay = root.querySelector(".menu-overlay");
    this._onKey = (e) => {
      if (e.key === "Escape") this.open = false;
    };
    this._onClickLink = (e) => {
      if (e.target.closest(".menu-link")) this.open = false;
    };
  }

  connectedCallback() {
    this._btn.addEventListener("click", () => (this.open = !this.open));
    this._overlay.addEventListener("click", this._onClickLink);
    window.addEventListener("keydown", this._onKey);
  }

  disconnectedCallback() {
    this._overlay.removeEventListener("click", this._onClickLink);
    window.removeEventListener("keydown", this._onKey);
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name !== "open") return;
    const isOpen = this.hasAttribute("open");
    this._btn?.setAttribute("aria-expanded", String(isOpen));
    this._overlay?.setAttribute("aria-hidden", String(!isOpen));
    document.body.style.overflow = isOpen ? "hidden" : ""; // lock/unlock scroll
  }

  get open() {
    return this.hasAttribute("open");
  }
  set open(v) {
    v ? this.setAttribute("open", "") : this.removeAttribute("open");
  }
}

customElements.define("overlay-menu", OverlayMenu);

/* BMO'nun konuşma balonu: görünen metin harf harf; ekran okuyucuya tek seferde (liveEl) */
export function createSpeech({ bubbleEl, textEl, liveEl, anchorEl, onBlip, onTalk, isNarrow }) {
  let timer = 0;

  function place() {
    if (isNarrow()) { bubbleEl.style.left = ""; bubbleEl.style.top = ""; bubbleEl.classList.add("docked"); return; }
    bubbleEl.classList.remove("docked");
    const r = anchorEl.getBoundingClientRect();
    bubbleEl.style.left = Math.min(r.right - r.width * 0.08, innerWidth - bubbleEl.offsetWidth - 16) + "px";
    bubbleEl.style.top = Math.max(84, r.top - bubbleEl.offsetHeight + r.height * 0.1) + "px";
  }

  function stop() { clearInterval(timer); onTalk(false); }

  function say(text) {
    clearInterval(timer);
    liveEl.textContent = text;
    textEl.textContent = "";
    bubbleEl.hidden = false;
    place();
    let i = 0;
    onTalk(true);
    timer = setInterval(() => {
      textEl.textContent = text.slice(0, ++i);
      if (i % 3 === 0) onBlip();
      if (i >= text.length) { clearInterval(timer); onTalk(false); place(); }
    }, 28);
  }

  return { say, stop, place };
}

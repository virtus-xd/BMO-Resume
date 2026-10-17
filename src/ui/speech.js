/* BMO'nun terminal tarzı diyalog kutusu (altta ortada, CSS'te): görünen metin harf harf;
   ekran okuyucuya konuşanla birlikte tek seferde (liveEl). Replik bittikten REST ms sonra kutu dinlenir
   (soluklaşır) ki ön sıradaki kasetleri kapatmasın. tip(): BMO'nun bir tuşunun üstündeyken o tuşun işi alt satırda. */
const REST = 6000, TIP_REST = 2000;
export function createSpeech({ bubbleEl, textEl, liveEl, tipEl, onBlip, onTalk }) {
  let timer = 0, restT = 0, typing = false, tipping = false;

  function stop() { clearInterval(timer); typing = false; onTalk(false); }
  const restIn = (ms) => { clearTimeout(restT); restT = setTimeout(() => bubbleEl.classList.add("rest"), ms); };

  function say(text) {
    clearInterval(timer); clearTimeout(restT);
    liveEl.textContent = "BMO: " + text;
    textEl.textContent = "";
    bubbleEl.hidden = false;
    bubbleEl.classList.remove("rest");
    let i = 0;
    typing = true;
    onTalk(true);
    timer = setInterval(() => {
      textEl.textContent = text.slice(0, ++i);
      if (i % 3 === 0) onBlip();
      if (i >= text.length) {
        clearInterval(timer); typing = false; onTalk(false);
        if (!tipping) restIn(REST);
      }
    }, 28);
  }

  function tip(text) {
    if (!tipEl) return;
    tipping = !!text;
    tipEl.hidden = !text;
    tipEl.textContent = text || "";
    bubbleEl.classList.toggle("tipping", tipping);
    if (tipping) {
      clearTimeout(restT);
      bubbleEl.hidden = false;
      bubbleEl.classList.remove("rest");
    } else if (!typing) restIn(TIP_REST);
  }

  return { say, stop, tip };
}

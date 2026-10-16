/* BMO'nun terminal tarzı diyalog kutusu (altta ortada, CSS'te): görünen metin harf harf;
   ekran okuyucuya konuşanla birlikte tek seferde (liveEl). Replik bittikten REST ms sonra kutu dinlenir
   (soluklaşır) ki ön sıradaki kasetleri kapatmasın. */
const REST = 6000;
export function createSpeech({ bubbleEl, textEl, liveEl, onBlip, onTalk }) {
  let timer = 0, restT = 0;

  function stop() { clearInterval(timer); onTalk(false); }

  function say(text) {
    clearInterval(timer); clearTimeout(restT);
    liveEl.textContent = "BMO: " + text;
    textEl.textContent = "";
    bubbleEl.hidden = false;
    bubbleEl.classList.remove("rest");
    let i = 0;
    onTalk(true);
    timer = setInterval(() => {
      textEl.textContent = text.slice(0, ++i);
      if (i % 3 === 0) onBlip();
      if (i >= text.length) {
        clearInterval(timer); onTalk(false);
        restT = setTimeout(() => bubbleEl.classList.add("rest"), REST);
      }
    }, 28);
  }

  return { say, stop };
}

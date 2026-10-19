// Search engine of the demo: BM25 over document sections with a light Russian
// stemmer, then the answer is assembled from the best matching sentences.
// In a production build the same retrieved fragments go to an LLM that writes
// the answer in its own words; retrieval and citations stay exactly like this.

const STOP = new Set(
  ('и в во не что он на я с со как а то все она так его но да ты к у же вы за бы по только ее мне было вот от меня еще нет о из ему теперь когда даже ну ли если уже или ни быть был него до вас нибудь уж вам ведь там потом себя ничего ей может они тут где есть надо ней для мы тебя их чем была сам чтоб без чего раз тоже себе под будет ж тогда кто этот того потому этого какой здесь этом один мой тем чтобы нее сейчас были куда зачем всех можно при об другой хоть после над больше тот через эти нас про всего них какая много разве эту моя свою этой перед лучше чуть том нельзя такой им более всегда всю между сколько какие каких нужно надо мне скажите подскажите расскажи расскажите хочу хочет хотим нам наш наша наше это ваш ваша вашей вас который которые приходит приходят придет придут нужны нужен нужна если делать сделать будет бывает')
    .split(' '),
);

// Words people use vs. words written in the documents.
const SYN = [
  [/^(верн|возвра)/, 'возвр'],
  [/^(зарплат|заработ|зп$|оклад|получк)/, 'зарпл'],
  [/^(больнич|боле|заболе|нетрудосп)/, 'больн'],
  [/^(отпуск|отгул)/, 'отпус'],
  [/^(повреж|разбит|сломан|помят|побит|испорч)/, 'повре'],
  [/^(опозд|задерж)/, 'опозд'],
  [/^(доверен)/, 'довер'],
  [/^(претенз|жалоб|компенс)/, 'претз'],
  [/^(стоим|стои|цен|тариф|прайс|почем)/, 'стоим'],
  [/^(ноч)/, 'ночн'],
  [/^(страх)/, 'страх'],
  [/^(упаков|обрешет|паллет|стретч)/, 'упак'],
  [/^(отслеж|трек|статус)/, 'отслж'],
  [/^(оплат|плат|заплат)/, 'оплат'],
  [/^(холод|охлажд|температур|заморож)/, 'холод'],
  [/^(суббот|воскрес|выходн)/, 'выход'],
  [/^(питан|обед|еда)/, 'питан'],
  [/^(сверхуроч|переработ)/, 'сверх'],
  [/^(забор|забра|заберет|приед)/, 'забор'],
  [/^(москв)/, 'москв'],
  [/^(ехат|едет|идет|доставк|доставля|везт|срок)/, 'срок'],
  [/^(водител|шофер)/, 'водит'],
  [/^(оформ|акт$|акта$|акте$|актом$)/, 'акт'],
  [/^(документ|бумаг|накладн|ттн|упд)/, 'докум'],
];

const ENDINGS = [
  'иями', 'ями', 'ами', 'ией', 'ием', 'иях', 'ого', 'его', 'ому', 'ему', 'ыми', 'ими',
  'ее', 'ие', 'ые', 'ое', 'ей', 'ий', 'ый', 'ой', 'ом', 'ем', 'ам', 'ям', 'ах', 'ях',
  'ую', 'юю', 'ая', 'яя', 'ов', 'ев', 'ет', 'ют', 'ут', 'ит', 'ат', 'ят', 'ть', 'ти',
  'ия', 'ья', 'ь', 'а', 'я', 'о', 'е', 'ы', 'и', 'у', 'ю', 'й',
];

export function stem(raw) {
  let w = raw.toLowerCase().replace(/ё/g, 'е');
  for (const [re, s] of SYN) if (re.test(w)) return s;
  if (/^\d/.test(w)) return w;
  w = w.replace(/(ся|сь)$/, '');
  for (const e of ENDINGS) {
    if (w.length - e.length >= 3 && w.endsWith(e)) {
      w = w.slice(0, -e.length);
      break;
    }
  }
  return w.slice(0, 6);
}

export function tokens(text) {
  const out = [];
  for (const m of text.toLowerCase().replace(/ё/g, 'е').matchAll(/[a-zа-я0-9]+/g)) {
    const w = m[0];
    if (STOP.has(w) || (w.length < 2 && !/\d/.test(w))) continue;
    out.push(stem(w));
  }
  return out;
}

export function sentences(text) {
  return text.match(/[^.!?]+(?:[.!?]+|$)/g)?.map((s) => s.trim()).filter(Boolean) ?? [text];
}

export class Index {
  constructor() {
    this.chunks = [];
  }

  add(doc) {
    doc.sections.forEach((s, i) => {
      const tf = new Map();
      const toks = tokens(s.h + ' ' + s.h + ' ' + s.t); // heading counts twice
      for (const t of toks) tf.set(t, (tf.get(t) || 0) + 1);
      this.chunks.push({ doc, i, sec: s, tf, len: toks.length });
    });
    this.#stats();
  }

  remove(docId) {
    this.chunks = this.chunks.filter((c) => c.doc.id !== docId);
    this.#stats();
  }

  #stats() {
    this.df = new Map();
    let total = 0;
    for (const c of this.chunks) {
      total += c.len;
      for (const t of c.tf.keys()) this.df.set(t, (this.df.get(t) || 0) + 1);
    }
    this.avg = total / Math.max(1, this.chunks.length);
  }

  idf(t) {
    const n = this.chunks.length;
    const d = this.df.get(t) || 0;
    return Math.log(1 + (n - d + 0.5) / (d + 0.5));
  }

  /** @returns {{answer: {text:string, cite:number}[], sources: object[]} | null} */
  ask(question, scope) {
    const text = question.replace(/где\s+(мой|моя|мое|наш|наша)?\s*(груз|посылк|заказ|отправк)/i, 'отследить груз');
    const q = [...new Set(tokens(text))];
    if (!q.length) return null;
    const pool = this.chunks.filter((c) => !scope || scope.has(c.doc.id));
    const k1 = 1.4;
    const b = 0.6;
    const qWeight = q.reduce((a, t) => a + this.idf(t), 0);

    const scored = pool
      .map((c) => {
        let score = 0;
        let hit = 0;
        for (const t of q) {
          const f = c.tf.get(t);
          if (!f) continue;
          const idf = this.idf(t);
          hit += idf;
          score += (idf * f * (k1 + 1)) / (f + k1 * (1 - b + (b * c.len) / this.avg));
        }
        return { c, score, cover: hit / qWeight };
      })
      .filter((r) => r.score > 0)
      .sort((a, b2) => b2.score - a.score);

    const top = scored[0];
    // Refuse instead of guessing: weak or partial matches are "not found".
    if (!top || top.score < 1.6 || top.cover < 0.34) return null;

    const picked = [top];
    const second = scored.find((r) => r.c.doc.id !== top.c.doc.id);
    if (second && second.score > top.score * 0.8 && second.cover >= 0.5) picked.push(second);

    const answer = [];
    const sources = picked.map((r, n) => {
      const sents = sentences(r.c.sec.t).map((s, idx) => {
        const st = new Set(tokens(s));
        let w = 0;
        for (const t of q) if (st.has(t)) w += this.idf(t);
        return { s, idx, w };
      });
      const best = [...sents].sort((a, b2) => b2.w - a.w);
      const take = [best[0]];
      const room = n === 0 ? 2 : 1;
      for (const s of best.slice(1)) {
        if (take.length >= room) break;
        if (s.w > 0 && s.w >= best[0].w * 0.45) take.push(s);
      }
      // A section's opening sentence often carries the rule: keep it if nothing matched.
      if (!take[0].w) take[0] = sents[0];
      take.sort((a, b2) => a.idx - b2.idx);
      answer.push({ text: take.map((s) => s.s).join(' '), cite: n + 1 });
      return { doc: r.c.doc, i: r.c.i, sec: r.c.sec, marks: take.map((s) => s.s) };
    });

    return { answer, sources };
  }
}

/** Split plain text from an uploaded file into titled sections. */
export function sectionize(text) {
  const lines = text.replace(/\r/g, '').split('\n').map((l) => l.trim());
  const sections = [];
  let head = 'Начало документа';
  let buf = [];
  const flush = () => {
    const body = buf.join(' ').replace(/\s+/g, ' ').trim();
    buf = [];
    if (!body) return;
    // long paragraphs are cut into ~600 char pieces on sentence borders
    let piece = '';
    let part = 1;
    for (const s of sentences(body)) {
      if (piece.length + s.length > 650 && piece) {
        sections.push({ h: part > 1 ? `${head} (${part})` : head, t: piece.trim() });
        piece = '';
        part++;
      }
      piece += ' ' + s;
    }
    if (piece.trim()) sections.push({ h: part > 1 ? `${head} (${part})` : head, t: piece.trim() });
  };
  for (const l of lines) {
    if (!l) {
      flush();
      continue;
    }
    const looksLikeHeading = l.length < 80 && !/[.,;:]$/.test(l) && /[a-zа-яё]/i.test(l) && l.split(' ').length <= 10;
    if (looksLikeHeading && (buf.length === 0 || /^(\d+[.)]|[IVX]+\.|глава|раздел|статья)/i.test(l))) {
      flush();
      head = l.replace(/^\d+[.)]\s*/, '');
      continue;
    }
    buf.push(l);
  }
  flush();
  return sections;
}

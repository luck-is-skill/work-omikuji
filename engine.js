(function(root) {
  'use strict';
  function randomUnit() {
    if (!root.crypto || !root.crypto.getRandomValues) throw new Error('このブラウザーでは抽選できません。別のブラウザーでお試しください。');
    const value = new Uint32Array(1);
    root.crypto.getRandomValues(value);
    return value[0] / 4294967296;
  }
  function checkedRandom(random) {
    const value = random();
    if (!Number.isFinite(value) || value < 0 || value >= 1) throw new RangeError('乱数は0以上1未満です');
    return value;
  }
  function weighted(list, random = randomUnit) {
    if (!list.length || list.some(x => !Number.isFinite(x.weight) || x.weight <= 0)) throw new TypeError('抽選設定を確認してください');
    const total = list.reduce((sum, item) => sum + item.weight, 0);
    let position = checkedRandom(random) * total;
    for (const item of list) {
      if (position < item.weight) return item;
      position -= item.weight;
    }
    return list[list.length - 1];
  }
  function pick(list, random = randomUnit) {
    if (!list.length) throw new TypeError('抽選候補がありません');
    return list[Math.floor(checkedRandom(random) * list.length)];
  }
  function draw(data, random = randomUnit) {
    return {
      fortune: weighted(data.fortunes, random),
      work: weighted(data.work, random),
      safety: weighted(data.safety, random),
      oracle: pick(data.oracles, random),
      workwear: pick(data.workwear, random),
      color: pick(data.colors, random)
    };
  }
  root.OmikujiEngine = { weighted, pick, draw };
})(globalThis);

// 한글 조사 · 부르는 말. 시안(39차)의 josa · withWa · withKke와 같다.

export function hasBatchim(word: string): boolean {
  const c = word.charCodeAt(word.length - 1) - 0xac00;
  return c >= 0 && c <= 11171 && c % 28 !== 0;
}

/** 받침이 있으면 앞의 것, 없으면 뒤의 것: josa('엄마', '이', '가') → '엄마가' */
export function josa(word: string, withFinal: string, withoutFinal: string): string {
  return word + (hasBatchim(word) ? withFinal : withoutFinal);
}

/** '엄마와' · '아영이와' */
export function withWa(name: string): string {
  return hasBatchim(name) ? name + "이와" : name + "와";
}

/** 엄마 · 아빠는 '엄마께', 자녀는 '아영이에게' */
export function withKke(name: string): string {
  if (name === "엄마" || name === "아빠") return name + "께";
  return (hasBatchim(name) ? name + "이" : name) + "에게";
}

/** 부모님이 자녀를 부를 때: '아영' → '아영이', '민지' → '민지' */
export function callName(name: string): string {
  return hasBatchim(name) ? name + "이" : name;
}

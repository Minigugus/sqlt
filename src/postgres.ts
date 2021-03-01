export const placeholder = (index: number) => `$${index}`;

// From https://github.com/porsager/postgres
export function escape(identifier: string) {
  let result = ''
  let q = Number(identifier[0]) < 10 || identifier[0] === '$'
  let last = 0
  let c

  for (let i = 0; i < identifier.length; i++) {
    c = identifier[i].charCodeAt(0)
    if (identifier[i] === '"') {
      q = true
      result += identifier.slice(last, i) + '"'
      last = i
    } else if (c === 96 || (c !== 36 && c <= 47) || (c >= 58 && c <= 64)
      || (c >= 91 && c <= 94) || (c >= 123 && c <= 128)) {
      q = true
    }
  }

  if (q)
    return `"${result + identifier.slice(last, identifier.length)}"`;
  return identifier;
}

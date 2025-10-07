import { helper } from '@ember/component/helper';

export function sum(numbers) {
  return numbers.reduce((a, b) => Number(a) + Number(b), 0);
}

export default helper(sum);

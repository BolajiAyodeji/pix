import { helper } from '@ember/component/helper';

export function multiply(numbers) {
  return numbers.reduce((a, b) => Number(a) * Number(b), 1);
}

export default helper(multiply);

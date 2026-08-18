/**
 * Input: n - any integer, result always < Number.MAX_SAFE_INTEGER
 * Output: summation to n, e.g. sum_to_n(5) === 1 + 2 + 3 + 4 + 5 === 15
 *
 * Also handles negative n by summing the mirrored range,
 * e.g. sum_to_n(-3) === -1 + -2 + -3 === -6
 */

// A: iterative loop — O(n) time, O(1) space
var sum_to_n_a = function (n) {
  const step = n >= 0 ? 1 : -1;
  let sum = 0;
  for (let i = step; i !== n + step; i += step) {
    sum += i;
  }
  return sum;
};

// B: closed-form arithmetic series formula — O(1) time, O(1) space
var sum_to_n_b = function (n) {
  const sign = n >= 0 ? 1 : -1;
  const abs = Math.abs(n);
  return sign * ((abs * (abs + 1)) / 2);
};

// C: recursion — O(n) time, O(n) space (call stack)
var sum_to_n_c = function (n) {
  if (n === 0) return 0;
  const step = n >= 0 ? 1 : -1;
  return n + sum_to_n_c(n - step);
};

module.exports = { sum_to_n_a, sum_to_n_b, sum_to_n_c };

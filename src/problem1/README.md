# Problem 1: Three ways to sum to n

Three implementations of `sum_to_n(n)` in `sum_to_n.js`:

- **`sum_to_n_a`** — iterative loop. O(n) time, O(1) space. Straightforward and safe for any n within the stated bound.
- **`sum_to_n_b`** — closed-form formula (`n(n+1)/2`). O(1) time, O(1) space. Fastest option, preferred when n can be large.
- **`sum_to_n_c`** — recursion. O(n) time, O(n) space due to the call stack. Included for completeness; not recommended for very large n since it can blow the stack.

All three also handle negative integers by summing the mirrored range (e.g. `sum_to_n(-3) === -6`), since the task specifies `n` can be "any integer".

Run `node sum_to_n.test.js` to verify all three agree.

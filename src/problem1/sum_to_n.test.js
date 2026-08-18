const { sum_to_n_a, sum_to_n_b, sum_to_n_c } = require("./sum_to_n");

const cases = [0, 1, 5, 10, -3, 100];

for (const n of cases) {
  const results = [sum_to_n_a(n), sum_to_n_b(n), sum_to_n_c(n)];
  const allMatch = results.every((r) => r === results[0]);
  console.log(`n=${n} -> ${results.join(", ")} ${allMatch ? "OK" : "MISMATCH"}`);
  if (!allMatch) process.exitCode = 1;
}

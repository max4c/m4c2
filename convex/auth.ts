export function requireToken(
  actual: string,
  role: "service" | "dashboard" = "service",
) {
  const expected =
    process.env[
      role === "service" ? "CONVEX_SERVICE_TOKEN" : "DASHBOARD_TOKEN"
    ];
  if (!expected || expected.length < 32 || actual.length !== expected.length)
    throw new Error("Unauthorized");
  let diff = 0;
  for (let i = 0; i < expected.length; i++)
    diff |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
  if (diff !== 0) throw new Error("Unauthorized");
}

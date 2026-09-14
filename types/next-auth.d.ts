import "next-auth";
declare module "next-auth" { interface User { role?: "SUPER_ADMIN" | "OPERATOR" } interface Session { user: { id: string; role: "SUPER_ADMIN" | "OPERATOR" } & NonNullable<Session["user"]> } }
declare module "next-auth/jwt" { interface JWT { role?: "SUPER_ADMIN" | "OPERATOR" } }

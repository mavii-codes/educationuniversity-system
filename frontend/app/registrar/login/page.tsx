import { redirect } from "next/navigation";

/**
 * Legacy Registrar portal alias. Staff/admin sign-in now lives on
 * /admin/login; legacy registrar credentials resolve to the Librarian role.
 */
export default function RegistrarLoginPage() {
  redirect("/admin/login");
}

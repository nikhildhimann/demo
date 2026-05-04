import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Registration Disabled",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RegisterPage() {
  redirect("/login");
}

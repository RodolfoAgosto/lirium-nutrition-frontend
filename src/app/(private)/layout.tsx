import { PrivateLayout } from "@/components/layout/private-layout";

// Every authenticated screen lives under this route group and gets the sidebar for free.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <PrivateLayout>{children}</PrivateLayout>;
}

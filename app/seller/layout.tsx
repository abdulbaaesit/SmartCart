import SellerNavbar from "../components/SellerNavbar";

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <SellerNavbar />
      <main>{children}</main>
    </div>
  );
}

import { Navbar } from "@/components/common/Navbar";
import { Sidebar } from "@/components/common/Sidebar";
export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <div className="app-shell"><Sidebar /><div className="main-shell"><Navbar /><main className="page-content">{children}</main></div></div>; }
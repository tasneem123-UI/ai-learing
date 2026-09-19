"use client";
import { useState } from "react";
import { FilePlus2, Search } from "lucide-react";
import { DocumentList } from "@/components/documents/DocumentList";
import { UploadModal } from "@/components/documents/UploadModal";
import { documents } from "@/lib/documentService";
export default function DocumentsPage() { const [open, setOpen] = useState(false); return <div><div className="page-title-row"><div><p className="eyebrow">مكتبتك الخاصة</p><h1>مستنداتي</h1><p className="subheading">كل ما تحتاجه للتعلم في مكان واحد.</p></div><button className="primary-button" onClick={() => setOpen(true)}><FilePlus2 size={18} /> إضافة مستند</button></div><div className="library-tools"><div className="search-box"><Search size={18} /><input placeholder="ابحث عن مستند..." /></div><div className="filter-pills"><button className="pill active">الكل</button><button className="pill">PDF</button><button className="pill">DOCX</button></div></div><DocumentList documents={documents} />{open && <UploadModal onClose={() => setOpen(false)} />}</div>; }
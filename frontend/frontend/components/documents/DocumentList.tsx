import type { Document } from "@/types/document";
import { DocumentCard } from "./DocumentCard";
export function DocumentList({ documents }: { documents: Document[] }) { return <div className="document-grid">{documents.map((document) => <DocumentCard document={document} key={document.id} />)}</div>; }
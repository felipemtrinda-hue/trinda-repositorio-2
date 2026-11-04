import { FileText, ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DocActions } from "./doc-actions";
import { DOC_KIND_LABEL } from "@/lib/documents";
import { date, monthYear } from "@/lib/format";

export type DocRow = { id: string; title: string; kind: string; mime_type: string; size_bytes: number; published_at: string | null; base_year: number | null; competence: string | null };

const size = (b: number) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

/** Lista de documentos para inquilino/proprietário (a RLS já filtrou). */
export function DocList({ docs }: { docs: DocRow[] }) {
  return (
    <ul className="divide-y divide-cream">
      {docs.map((d) => (
        <li key={d.id} className="flex flex-wrap items-center gap-3 px-5 py-4 md:px-6">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-rose-mist text-bordo">
            {d.mime_type === "application/pdf" ? <FileText className="size-5" aria-hidden /> : <ImageIcon className="size-5" aria-hidden />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="line-clamp-2 font-semibold leading-snug">{d.title}</span>
            <span className="block text-xs text-stone">
              {DOC_KIND_LABEL[d.kind]}
              {d.base_year ? ` · ano-base ${d.base_year}` : ""}
              {d.competence ? ` · ${monthYear(d.competence)}` : ""}
              {` · ${size(d.size_bytes)} · ${date(d.published_at)}`}
            </span>
          </span>
          <DocActions id={d.id} />
        </li>
      ))}
    </ul>
  );
}

export function KindBadge({ kind }: { kind: string }) {
  return <Badge tone={kind === "income_tax" ? "brand" : "neutral"}>{DOC_KIND_LABEL[kind] ?? kind}</Badge>;
}

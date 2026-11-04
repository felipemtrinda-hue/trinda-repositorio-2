import { PeopleList } from "@/components/admin/people-list";
export const metadata = { title: "Proprietários" };
export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  return <PeopleList role="owner" q={q} />;
}

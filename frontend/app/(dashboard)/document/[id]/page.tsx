import { auth } from "@clerk/nextjs/server";
import { documentsApi } from "@/lib/api";
import { DocumentView } from "@/components/document/DocumentView";
import { notFound } from "next/navigation";

interface Props {
  params: { id: string };
}

export default async function DocumentPage({ params }: Props) {
  const { getToken } = await auth();
  const token = await getToken();

  let doc;
  let related;
  try {
    [doc, related] = await Promise.all([
      documentsApi.get(params.id, token ?? undefined),
      documentsApi.related(params.id, token ?? undefined),
    ]);
  } catch {
    notFound();
  }

  return <DocumentView doc={doc} related={related} />;
}

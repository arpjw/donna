import { auth } from "@clerk/nextjs/server";
import { digestsApi } from "@/lib/api";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

interface Props {
  params: { id: string };
}

export default async function DigestDetailPage({ params }: Props) {
  const { getToken } = await auth();
  const token = await getToken();

  let digest;
  try {
    digest = await digestsApi.get(params.id, token ?? undefined);
  } catch {
    notFound();
  }

  return (
    <div className="max-w-[860px] mx-auto px-8 py-8">
      <Link
        href="/digests"
        className="font-mono uppercase tracking-wider mb-8 inline-block transition-colors"
        style={{ fontSize: 10, color: "#9E9890" }}
      >
        ← Back to digests
      </Link>
      <div className="pb-5 mb-8" style={{ borderBottom: "1px solid #E2DDD5" }}>
        <p className="font-mono mb-2" style={{ fontSize: 11, color: "#9E9890" }}>
          {formatDate(digest.period_start)} — {formatDate(digest.period_end)}
        </p>
        <h1 className="font-display" style={{ fontSize: 26, color: "#1C1814" }}>
          {digest.headline}
        </h1>
        {digest.sent_at && (
          <p className="font-mono mt-2" style={{ fontSize: 11, color: "#9E9890" }}>
            Sent {formatDate(digest.sent_at)}
          </p>
        )}
      </div>

      <div
        className="font-sans leading-relaxed"
        style={{ color: "#6B655C", fontSize: 14, fontWeight: 300 }}
        dangerouslySetInnerHTML={{ __html: digest.assembled_html }}
      />
    </div>
  );
}

import { Suspense } from "react";
import { connection } from "next/server";
import SharedWorld from "@/components/portal/SharedWorld";

interface Props {
  params: Promise<{ slug: string }>;
}

async function EmbeddedWalkthrough({ params }: Props) {
  await connection();
  const { slug } = await params;
  return <SharedWorld slug={slug} chrome={false} />;
}

export default function EmbeddedWalkthroughPage(props: Props) {
  return (
    <Suspense fallback={null}>
      <EmbeddedWalkthrough {...props} />
    </Suspense>
  );
}

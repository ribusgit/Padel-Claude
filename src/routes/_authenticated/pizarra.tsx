import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { CourtWhiteboard } from "@/components/court-whiteboard";

export const Route = createFileRoute("/_authenticated/pizarra")({
  head: () => ({
    meta: [
      { title: "Pizarra táctica — Escuela de Pádel" },
      {
        name: "description",
        content: "Dibuja jugadas y correcciones sobre una pista de pádel con Apple Pencil o con el dedo.",
      },
      { property: "og:title", content: "Pizarra táctica — Escuela de Pádel" },
      {
        property: "og:description",
        content: "Dibuja jugadas y correcciones sobre una pista de pádel con Apple Pencil o con el dedo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WhiteboardPage,
});

function WhiteboardPage() {
  return (
    <>
      <PageHeader
        title="Pizarra táctica"
        subtitle="Explica posiciones, recorridos y correcciones dibujando sobre la pista."
      />
      <CourtWhiteboard />
    </>
  );
}

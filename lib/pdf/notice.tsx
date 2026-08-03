import React from "react";
import { Document, Page, Text, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { CORPUS_VERSION } from "@/lib/corpus/manifest";
import type { Citation } from "@/lib/agent/types";

const styles = StyleSheet.create({
  page: { padding: 56, fontFamily: "Times-Roman", fontSize: 11, lineHeight: 1.5 },
  h1: {
    fontSize: 14,
    fontWeight: 700,
    textAlign: "center",
    marginBottom: 18,
    fontFamily: "Times-Bold",
  },
  paragraph: { marginBottom: 8, textAlign: "justify" },
  citationsHeader: { marginTop: 18, marginBottom: 6, fontFamily: "Times-Bold" },
  citation: { fontSize: 10, marginBottom: 2 },
  footer: { fontSize: 9, color: "#666", marginTop: 24 },
});

export type NoticeDocumentProps = {
  body: string;
  citations: Citation[];
  corpus_version?: string;
  generated_at?: string;
};

export function NoticeDocument({
  body,
  citations,
  corpus_version = CORPUS_VERSION,
  generated_at,
}: NoticeDocumentProps) {
  const paras = body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  return (
    <Document title="Legal Notice — Return of Security Deposit">
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>LEGAL NOTICE</Text>
        {paras.map((p, i) => (
          <Text key={i} style={styles.paragraph}>
            {p}
          </Text>
        ))}
        {citations.length > 0 ? (
          <>
            <Text style={styles.citationsHeader}>Statutory references:</Text>
            {citations.map((c, i) => (
              <Text key={i} style={styles.citation}>
                • Section {c.section}, {c.act}
              </Text>
            ))}
          </>
        ) : null}
        <Text style={styles.footer}>
          Drafted with Recourse (informational tool; not legal advice). Corpus{" "}
          {corpus_version}
          {generated_at ? ` · Generated ${generated_at}` : ""}.
        </Text>
      </Page>
    </Document>
  );
}

export async function renderNoticePdf(input: {
  body: string;
  citations: Citation[];
  generated_at?: string;
}): Promise<Buffer> {
  return renderToBuffer(
    <NoticeDocument
      body={input.body}
      citations={input.citations}
      generated_at={input.generated_at}
    />,
  );
}

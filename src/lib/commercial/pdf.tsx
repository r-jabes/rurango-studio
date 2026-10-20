import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { CommercialSnapshot } from "@/db/schema/commercial";
import { typeLabels } from "@/lib/commercial/meta";
import { formatMoney, minorToMajorString } from "@/lib/money";
import { getStorage } from "@/lib/storage";

/** Brand tokens aligned with Studio / portfolio (docs/02). */
const brand = {
  green: "#B8F500",
  charcoal: "#191C1B",
  charcoalRaised: "#252A28",
  offWhite: "#F2F4F0",
  muted: "#5C635E",
  border: "#D5D9D4",
  rowBorder: "#E8EBE6",
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 0,
    paddingBottom: 56,
    paddingHorizontal: 0,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: brand.charcoal,
    backgroundColor: "#FFFFFF",
  },
  accentBar: {
    height: 6,
    backgroundColor: brand.green,
  },
  headerBand: {
    backgroundColor: brand.charcoal,
    paddingTop: 22,
    paddingBottom: 22,
    paddingHorizontal: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  brandBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    maxWidth: "62%",
  },
  logo: {
    width: 108,
    height: 32,
    objectFit: "contain",
  },
  brandFallback: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.4,
    color: brand.offWhite,
  },
  brandSub: {
    marginTop: 4,
    fontSize: 8,
    color: "#9AA39A",
  },
  docTypeBadge: {
    alignSelf: "flex-start",
    backgroundColor: brand.green,
    color: brand.charcoal,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    letterSpacing: 1,
    paddingVertical: 5,
    paddingHorizontal: 10,
    textAlign: "right",
  },
  docMetaRight: {
    marginTop: 8,
    color: brand.offWhite,
    fontSize: 10,
    textAlign: "right",
  },
  docMetaMuted: {
    marginTop: 3,
    color: "#9AA39A",
    fontSize: 8,
    textAlign: "right",
  },
  body: {
    paddingHorizontal: 40,
    paddingTop: 28,
  },
  titleBlock: {
    marginBottom: 20,
  },
  docTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
    color: brand.charcoal,
  },
  legalLine: {
    fontSize: 8,
    color: brand.muted,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 22,
    gap: 24,
  },
  metaCol: {
    flexGrow: 1,
    flexBasis: 0,
  },
  label: {
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 0.9,
    color: brand.muted,
    marginBottom: 5,
    fontFamily: "Helvetica-Bold",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: brand.charcoalRaised,
    paddingVertical: 7,
    paddingHorizontal: 8,
  },
  tableHeaderText: {
    color: brand.offWhite,
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    letterSpacing: 0.4,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: brand.rowBorder,
  },
  colDesc: { width: "38%" },
  colQty: { width: "12%", textAlign: "right" },
  colUnit: { width: "18%", textAlign: "right" },
  colTax: { width: "12%", textAlign: "right" },
  colTotal: { width: "20%", textAlign: "right" },
  bold: { fontFamily: "Helvetica-Bold" },
  totals: {
    marginTop: 16,
    alignSelf: "flex-end",
    width: "44%",
    backgroundColor: brand.offWhite,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderLeftWidth: 3,
    borderLeftColor: brand.green,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  grandTotal: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: brand.charcoal,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  section: {
    marginTop: 22,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: brand.border,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  footerAccent: {
    height: 4,
    backgroundColor: brand.green,
  },
  footerInner: {
    paddingHorizontal: 40,
    paddingVertical: 10,
    backgroundColor: brand.offWhite,
    fontSize: 7,
    color: brand.muted,
  },
});

function formatAddress(address: Record<string, string> | null | undefined) {
  if (!address) return [];
  return [address.line1, address.line2, address.city, address.country].filter(
    Boolean,
  );
}

function CommercialPdfDocument({
  snapshot,
  logoSrc,
}: {
  snapshot: CommercialSnapshot;
  logoSrc?: string | null;
}) {
  const typeLabel =
    typeLabels[snapshot.document.type as keyof typeof typeLabels] ??
    snapshot.document.type;
  const addressLines = formatAddress(snapshot.company.address);

  return (
    <Document
      title={`${snapshot.document.number} · ${snapshot.document.title}`}
      author={snapshot.company.tradingName}
      subject={typeLabel}
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.accentBar} />

        <View style={styles.headerBand}>
          <View style={styles.brandBlock}>
            {logoSrc ? (
              // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image
              <Image src={logoSrc} style={styles.logo} />
            ) : (
              <View>
                <Text style={styles.brandFallback}>
                  {snapshot.company.tradingName}
                </Text>
              </View>
            )}
            <View>
              {logoSrc ? (
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: "Helvetica-Bold",
                    color: brand.offWhite,
                    letterSpacing: 0.6,
                  }}
                >
                  {snapshot.company.tradingName}
                </Text>
              ) : null}
              {snapshot.company.legalName !== snapshot.company.tradingName ? (
                <Text style={styles.brandSub}>{snapshot.company.legalName}</Text>
              ) : null}
              {snapshot.company.supportEmail ? (
                <Text style={styles.brandSub}>
                  {snapshot.company.supportEmail}
                </Text>
              ) : null}
              {addressLines.map((line) => (
                <Text key={line} style={styles.brandSub}>
                  {line}
                </Text>
              ))}
              {snapshot.company.taxId ? (
                <Text style={styles.brandSub}>
                  Tax ID: {snapshot.company.taxId}
                </Text>
              ) : null}
            </View>
          </View>

          <View>
            <Text style={styles.docTypeBadge}>{typeLabel.toUpperCase()}</Text>
            <Text style={styles.docMetaRight}>{snapshot.document.number}</Text>
            {snapshot.document.issueDate ? (
              <Text style={styles.docMetaMuted}>
                Issued {snapshot.document.issueDate}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.titleBlock}>
            <Text style={styles.docTitle}>{snapshot.document.title}</Text>
            <Text style={styles.legalLine}>
              Prepared for {snapshot.client.name}
              {snapshot.project ? ` · ${snapshot.project.name}` : ""}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaCol}>
              <Text style={styles.label}>Bill to</Text>
              <Text style={styles.bold}>{snapshot.client.name}</Text>
              {snapshot.client.legalName ? (
                <Text style={{ color: brand.muted, marginTop: 2 }}>
                  {snapshot.client.legalName}
                </Text>
              ) : null}
              {snapshot.client.email ? (
                <Text style={{ color: brand.muted, marginTop: 2 }}>
                  {snapshot.client.email}
                </Text>
              ) : null}
              {snapshot.client.phone ? (
                <Text style={{ color: brand.muted, marginTop: 2 }}>
                  {snapshot.client.phone}
                </Text>
              ) : null}
            </View>
            <View style={styles.metaCol}>
              <Text style={styles.label}>Document details</Text>
              {snapshot.project ? (
                <Text>
                  Project: {snapshot.project.name}
                  {snapshot.project.code ? ` (${snapshot.project.code})` : ""}
                </Text>
              ) : null}
              {snapshot.document.dueDate ? (
                <Text style={{ marginTop: 2 }}>
                  Due: {snapshot.document.dueDate}
                </Text>
              ) : null}
              {snapshot.document.expiryDate ? (
                <Text style={{ marginTop: 2 }}>
                  Valid until: {snapshot.document.expiryDate}
                </Text>
              ) : null}
              {snapshot.document.paymentTerms ? (
                <Text style={{ marginTop: 2 }}>
                  Terms: {snapshot.document.paymentTerms}
                </Text>
              ) : null}
              <Text style={{ marginTop: 2 }}>
                Currency: {snapshot.document.currency}
              </Text>
            </View>
          </View>

          {snapshot.document.bodyHtml ? (
            <View style={{ marginBottom: 18 }}>
              <Text style={styles.label}>Scope / narrative</Text>
              <Text>{snapshot.document.bodyHtml}</Text>
            </View>
          ) : null}

          <View style={styles.tableHeader}>
            <Text style={[styles.colDesc, styles.tableHeaderText]}>
              Description
            </Text>
            <Text style={[styles.colQty, styles.tableHeaderText]}>Qty</Text>
            <Text style={[styles.colUnit, styles.tableHeaderText]}>Unit</Text>
            <Text style={[styles.colTax, styles.tableHeaderText]}>Tax %</Text>
            <Text style={[styles.colTotal, styles.tableHeaderText]}>
              Amount
            </Text>
          </View>

          {snapshot.lineItems.map((line, index) => (
            <View key={index} style={styles.tableRow} wrap={false}>
              <Text style={styles.colDesc}>{line.description}</Text>
              <Text style={styles.colQty}>{line.quantity}</Text>
              <Text style={styles.colUnit}>
                {minorToMajorString(line.unitAmountMinor)}
              </Text>
              <Text style={styles.colTax}>
                {(line.taxRateBps / 100).toFixed(1)}
              </Text>
              <Text style={styles.colTotal}>
                {minorToMajorString(line.lineNetMinor + line.lineTaxMinor)}
              </Text>
            </View>
          ))}

          <View style={styles.totals}>
            <View style={styles.totalRow}>
              <Text>Subtotal</Text>
              <Text>
                {formatMoney(
                  snapshot.totals.subtotalMinor,
                  snapshot.document.currency,
                )}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text>Tax</Text>
              <Text>
                {formatMoney(
                  snapshot.totals.taxMinor,
                  snapshot.document.currency,
                )}
              </Text>
            </View>
            <View style={styles.grandTotal}>
              <Text style={styles.bold}>Total</Text>
              <Text style={styles.bold}>
                {formatMoney(
                  snapshot.totals.totalMinor,
                  snapshot.document.currency,
                )}
              </Text>
            </View>
          </View>

          {snapshot.document.notes ? (
            <View style={styles.section}>
              <Text style={styles.label}>Notes</Text>
              <Text>{snapshot.document.notes}</Text>
            </View>
          ) : null}

          {snapshot.document.type === "invoice" &&
          snapshot.company.invoicePaymentDetails?.trim() ? (
            <View style={styles.section}>
              <Text style={styles.label}>Payment details</Text>
              {snapshot.company.invoicePaymentDetails
                .trim()
                .split(/\r?\n/)
                .map((line, index) => (
                  <Text key={index} style={{ marginTop: index === 0 ? 0 : 2 }}>
                    {line.length > 0 ? line : " "}
                  </Text>
                ))}
            </View>
          ) : null}
        </View>

        <View style={styles.footer} fixed>
          <View style={styles.footerAccent} />
          <View style={styles.footerInner}>
            <Text>
              {snapshot.company.tradingName} · {snapshot.document.number} ·
              Issued {snapshot.issuedAt.slice(0, 10)}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

async function resolveLogoSrc(
  logoStorageKey: string | null | undefined,
): Promise<string | null> {
  if (!logoStorageKey) return null;
  try {
    const object = await getStorage().getObject(logoStorageKey);
    const contentType =
      object.contentType && object.contentType.startsWith("image/")
        ? object.contentType
        : "image/png";
    return `data:${contentType};base64,${object.body.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function renderCommercialPdf(
  snapshot: CommercialSnapshot,
): Promise<Buffer> {
  const logoSrc = await resolveLogoSrc(snapshot.company.logoStorageKey);
  const buffer = await renderToBuffer(
    <CommercialPdfDocument snapshot={snapshot} logoSrc={logoSrc} />,
  );
  return Buffer.from(buffer);
}

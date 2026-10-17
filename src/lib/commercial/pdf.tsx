import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { CommercialSnapshot } from "@/db/schema/commercial";
import { typeLabels } from "@/lib/commercial/meta";
import { formatMoney, minorToMajorString } from "@/lib/money";

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 48,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#191C1B",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 28,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#D5D9D4",
  },
  brand: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
  },
  muted: {
    color: "#5C635E",
    marginTop: 2,
  },
  titleBlock: {
    marginBottom: 24,
  },
  docTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 24,
  },
  metaCol: {
    flexGrow: 1,
    flexBasis: 0,
  },
  label: {
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "#5C635E",
    marginBottom: 4,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F2F4F0",
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#D5D9D4",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#E8EBE6",
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
    width: "42%",
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
    borderTopColor: "#191C1B",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  notes: {
    marginTop: 28,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#D5D9D4",
  },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 48,
    right: 48,
    fontSize: 8,
    color: "#5C635E",
  },
});

function CommercialPdfDocument({ snapshot }: { snapshot: CommercialSnapshot }) {
  const typeLabel =
    typeLabels[snapshot.document.type as keyof typeof typeLabels] ??
    snapshot.document.type;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>{snapshot.company.tradingName}</Text>
            <Text style={styles.muted}>{snapshot.company.legalName}</Text>
            {snapshot.company.taxId ? (
              <Text style={styles.muted}>Tax ID: {snapshot.company.taxId}</Text>
            ) : null}
          </View>
          <View>
            <Text style={[styles.bold, { textAlign: "right" }]}>
              {typeLabel.toUpperCase()}
            </Text>
            <Text style={{ textAlign: "right", marginTop: 4 }}>
              {snapshot.document.number}
            </Text>
            {snapshot.document.issueDate ? (
              <Text style={[styles.muted, { textAlign: "right" }]}>
                Issued {snapshot.document.issueDate}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.docTitle}>{snapshot.document.title}</Text>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaCol}>
            <Text style={styles.label}>Bill to</Text>
            <Text style={styles.bold}>{snapshot.client.name}</Text>
            {snapshot.client.legalName ? (
              <Text style={styles.muted}>{snapshot.client.legalName}</Text>
            ) : null}
            {snapshot.client.email ? (
              <Text style={styles.muted}>{snapshot.client.email}</Text>
            ) : null}
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.label}>Details</Text>
            {snapshot.project ? (
              <Text>Project: {snapshot.project.name}</Text>
            ) : null}
            {snapshot.document.dueDate ? (
              <Text>Due: {snapshot.document.dueDate}</Text>
            ) : null}
            {snapshot.document.expiryDate ? (
              <Text>Expires: {snapshot.document.expiryDate}</Text>
            ) : null}
            {snapshot.document.paymentTerms ? (
              <Text>Terms: {snapshot.document.paymentTerms}</Text>
            ) : null}
            <Text>Currency: {snapshot.document.currency}</Text>
          </View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.colDesc, styles.bold]}>Description</Text>
          <Text style={[styles.colQty, styles.bold]}>Qty</Text>
          <Text style={[styles.colUnit, styles.bold]}>Unit</Text>
          <Text style={[styles.colTax, styles.bold]}>Tax %</Text>
          <Text style={[styles.colTotal, styles.bold]}>Amount</Text>
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
              {formatMoney(snapshot.totals.taxMinor, snapshot.document.currency)}
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
          <View style={styles.notes}>
            <Text style={styles.label}>Notes</Text>
            <Text>{snapshot.document.notes}</Text>
          </View>
        ) : null}

        <Text style={styles.footer}>
          Snapshot issued {snapshot.issuedAt.slice(0, 10)}. This PDF reflects
          the frozen commercial record — not a legally binding electronic
          signature.
        </Text>
      </Page>
    </Document>
  );
}

export async function renderCommercialPdf(
  snapshot: CommercialSnapshot,
): Promise<Buffer> {
  const buffer = await renderToBuffer(
    <CommercialPdfDocument snapshot={snapshot} />,
  );
  return Buffer.from(buffer);
}

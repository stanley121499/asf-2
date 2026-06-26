import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useProductReportContext } from "@/context/product/ProductReportContext";
import { useProductContext } from "@/context/product/ProductContext";
import { C, reportBadge, REPORT_STATUSES } from "../_lib/stockTokens";

// ─── Types ────────────────────────────────────────────────────────────────────
type ReportStatus = (typeof REPORT_STATUSES)[number];

// ─── Sub-components ───────────────────────────────────────────────────────────
function SectionLabel({ text }: Readonly<{ text: string }>): React.ReactElement {
  return (
    <Text
      style={{
        fontSize: 12,
        fontWeight: "600",
        color: C.muted,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 8,
      }}
    >
      {text}
    </Text>
  );
}

interface EditRowProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  first?: boolean;
}

function EditRow({
  label,
  value,
  onChange,
  placeholder = "",
  multiline = false,
  first = false,
}: Readonly<EditRowProps>): React.ReactElement {
  return (
    <View
      style={{
        backgroundColor: C.panel,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: C.border,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: multiline ? "column" : "row",
        alignItems: multiline ? "flex-start" : "center",
        justifyContent: "space-between",
        gap: multiline ? 8 : 12,
      }}
    >
      <Text style={{ fontSize: 14, color: C.muted, flexShrink: 0 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={C.muted}
        multiline={multiline}
        style={{
          fontSize: 15,
          color: C.text,
          textAlign: multiline ? "left" : "right",
          flex: multiline ? undefined : 1,
          width: multiline ? "100%" : undefined,
          minHeight: multiline ? 72 : undefined,
          textAlignVertical: multiline ? "top" : undefined,
        }}
      />
    </View>
  );
}

interface InfoRowProps {
  label: string;
  value: string | null;
  first?: boolean;
}

function InfoRow({ label, value, first = false }: Readonly<InfoRowProps>): React.ReactElement {
  return (
    <View
      style={{
        backgroundColor: C.panel,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: C.border,
        paddingHorizontal: 16,
        paddingVertical: 13,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <Text style={{ fontSize: 14, color: C.muted, flexShrink: 0 }}>{label}</Text>
      <Text
        style={{ fontSize: 14, color: C.text, fontWeight: "500", flex: 1, textAlign: "right" }}
      >
        {value !== null && value.length > 0 ? value : "—"}
      </Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function StockReportDetailScreen(): React.ReactElement {
  const { reportId } = useLocalSearchParams<{ reportId: string }>();
  const router = useRouter();

  const { product_reports, updateProductReport, deleteProductReport, loading } =
    useProductReportContext();
  const { products } = useProductContext();

  const report = useMemo(
    () => product_reports.find((r) => r.id === reportId) ?? null,
    [product_reports, reportId]
  );

  // Editable fields
  const [status, setStatus] = useState<ReportStatus>("pending");
  const [company, setCompany] = useState("");
  const [department, setDepartment] = useState("");
  const [personInCharge, setPersonInCharge] = useState("");
  const [reason, setReason] = useState("");
  const [ocName, setOcName] = useState("");
  const [ocDepartment, setOcDepartment] = useState("");

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  /** Seed form when report loads */
  useEffect(() => {
    if (report === null) return;
    const raw = report.status;
    setStatus(REPORT_STATUSES.includes(raw as ReportStatus) ? (raw as ReportStatus) : "pending");
    setCompany(report.company ?? "");
    setDepartment(report.department ?? "");
    setPersonInCharge(report.person_in_charge ?? "");
    setReason(report.reason ?? "");
    setOcName(report.oc_name ?? "");
    setOcDepartment(report.oc_department ?? "");
  }, [report]);

  const isDirty = useMemo(() => {
    if (report === null) return false;
    return (
      status !== report.status ||
      company !== (report.company ?? "") ||
      department !== (report.department ?? "") ||
      personInCharge !== (report.person_in_charge ?? "") ||
      reason !== (report.reason ?? "") ||
      ocName !== (report.oc_name ?? "") ||
      ocDepartment !== (report.oc_department ?? "")
    );
  }, [report, status, company, department, personInCharge, reason, ocName, ocDepartment]);

  const productName = useMemo(() => {
    if (report === null) return "";
    return products.find((p) => p.id === report.product_id)?.name ?? report.product_id;
  }, [report, products]);

  const handleSave = useCallback(async (): Promise<void> => {
    if (report === null || reportId === undefined) return;
    setSaving(true);
    try {
      await updateProductReport({
        id: reportId,
        status,
        company: company.trim().length > 0 ? company.trim() : null,
        department: department.trim().length > 0 ? department.trim() : null,
        person_in_charge: personInCharge.trim().length > 0 ? personInCharge.trim() : null,
        reason: reason.trim().length > 0 ? reason.trim() : null,
        oc_name: ocName.trim().length > 0 ? ocName.trim() : null,
        oc_department: ocDepartment.trim().length > 0 ? ocDepartment.trim() : null,
      });
    } finally {
      setSaving(false);
    }
  }, [report, reportId, status, company, department, personInCharge, reason, ocName, ocDepartment, updateProductReport]);

  const handleDelete = useCallback((): void => {
    if (reportId === undefined) return;
    Alert.alert("删除报告", "确定要永久删除此盘点报告吗？", [
      { text: "取消", style: "cancel" },
      {
        text: "删除",
        style: "destructive",
        onPress: () => {
          setDeleting(true);
          void deleteProductReport(reportId).finally(() => {
            setDeleting(false);
            router.back();
          });
        },
      },
    ]);
  }, [reportId, deleteProductReport, router]);

  if (loading && report === null) {
    return (
      <SafeAreaView
        edges={["top"]}
        style={{ flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" }}
      >
        <ActivityIndicator color={C.accent} size="large" />
      </SafeAreaView>
    );
  }

  if (report === null) {
    return (
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 20, alignItems: "center" }}>
          <Text style={{ fontSize: 17, color: C.text }}>报告不存在。</Text>
          <Pressable onPress={() => router.back()} style={{ marginTop: 12 }}>
            <Text style={{ color: C.accent, fontSize: 15 }}>返回</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const badge = reportBadge(status);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: C.bg }}>
      {/* ── Header ── */}
      <View
        style={{
          backgroundColor: C.panel,
          borderBottomWidth: 1,
          borderBottomColor: C.border,
          paddingHorizontal: 16,
          paddingVertical: 14,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: "600", color: C.text, flex: 1 }} numberOfLines={1}>
          {productName}
        </Text>
        {isDirty && (
          <Pressable onPress={() => void handleSave()} disabled={saving}>
            <View
              style={{
                backgroundColor: C.accent,
                borderRadius: 10,
                paddingHorizontal: 14,
                paddingVertical: 8,
                alignItems: "center",
              }}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#FFFFFF" }}>保存</Text>
              )}
            </View>
          </Pressable>
        )}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 60 }}>
        {/* ── Status chip row ── */}
        <View
          style={{
            backgroundColor: C.panel,
            borderBottomWidth: 1,
            borderBottomColor: C.border,
            paddingHorizontal: 16,
            paddingVertical: 12,
            flexDirection: "row",
            gap: 8,
          }}
        >
          {REPORT_STATUSES.map((s) => {
            const active = status === s;
            const b = reportBadge(s);
            return (
              <Pressable
                key={s}
                onPress={() => setStatus(s)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderRadius: 20,
                  backgroundColor: active ? b.bg : "#F3F4F6",
                  borderWidth: active ? 1 : 0,
                  borderColor: active ? b.color : "transparent",
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: active ? b.color : C.muted,
                  }}
                >
                  {b.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── Summary (read-only) ── */}
        <SectionLabel text="概要" />
        <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border }}>
          <InfoRow label="商品" value={productName} first />
          <InfoRow label="状态" value={badge.label} />
          <InfoRow
            label="创建时间"
            value={new Date(report.created_at).toLocaleDateString("zh-CN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          />
        </View>

        {/* ── Organisation (editable) ── */}
        <SectionLabel text="机构信息" />
        <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border }}>
          <EditRow label="公司" value={company} onChange={setCompany} placeholder="公司名称" first />
          <EditRow label="部门" value={department} onChange={setDepartment} placeholder="部门" />
          <EditRow
            label="负责人"
            value={personInCharge}
            onChange={setPersonInCharge}
            placeholder="全名"
          />
        </View>

        {/* ── OC Info (editable) ── */}
        <SectionLabel text="OC信息" />
        <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border }}>
          <EditRow label="OC姓名" value={ocName} onChange={setOcName} placeholder="OC全名" first />
          <EditRow label="OC部门" value={ocDepartment} onChange={setOcDepartment} placeholder="OC部门" />
        </View>

        {/* ── Reason (editable) ── */}
        <SectionLabel text="原因" />
        <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border }}>
          <EditRow
            label="原因"
            value={reason}
            onChange={setReason}
            placeholder="说明此次报告的原因…"
            multiline
            first
          />
        </View>

        {/* ── Info ── */}
        <SectionLabel text="信息" />
        <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border }}>
          <View
            style={{
              backgroundColor: C.panel,
              paddingHorizontal: 16,
              paddingVertical: 13,
            }}
          >
            <Text style={{ fontSize: 12, color: C.muted }}>报告ID</Text>
            <Text style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{report.id}</Text>
          </View>
        </View>

        {/* ── Danger Zone ── */}
        <SectionLabel text="危险操作" />
        <Pressable onPress={handleDelete} disabled={deleting} style={({ pressed }) => ({ opacity: pressed || deleting ? 0.7 : 1 })}>
          <View
            style={{
              marginHorizontal: 16,
              backgroundColor: C.danger,
              borderRadius: 14,
              paddingVertical: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {deleting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
                <Text style={{ fontSize: 15, fontWeight: "700", color: "#FFFFFF" }}>
                  删除报告
                </Text>
              </>
            )}
          </View>
        </Pressable>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

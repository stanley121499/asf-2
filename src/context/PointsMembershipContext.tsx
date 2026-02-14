import React, { createContext, useCallback, useContext, useMemo } from "react"
import { supabase } from "../utils/supabaseClient"
import type { Tables, TablesInsert, TablesUpdate } from "../../database.types"

/**
 * PointsMembershipContext provides typed CRUD utilities for the points & membership system.
 * Includes operations for `user_points`, `user_points_logs`, and `membership_tiers` tables.
 */
type UserPointsRow = Tables<"user_points">
type UserPointsInsert = TablesInsert<"user_points">
type UserPointsUpdate = TablesUpdate<"user_points">

type UserPointsLogRow = Tables<"user_points_logs">
type UserPointsLogInsert = TablesInsert<"user_points_logs">
type UserPointsLogUpdate = TablesUpdate<"user_points_logs">

type MembershipTierRow = Tables<"membership_tiers">
type MembershipTierInsert = TablesInsert<"membership_tiers">
type MembershipTierUpdate = TablesUpdate<"membership_tiers">

/**
 * Basic validation helpers to ensure runtime safety in addition to TypeScript checks.
 */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean"
}

/**
 * Public API for the context
 */
type PointsMembershipAPI = {
  // user_points
  getUserPointsById: (id: string) => Promise<UserPointsRow | null>
  getUserPointsByUserId: (userId: string) => Promise<UserPointsRow | null>
  listUserPoints: (limit?: number) => Promise<UserPointsRow[]>
  createUserPoints: (payload: UserPointsInsert) => Promise<UserPointsRow>
  updateUserPoints: (id: string, payload: UserPointsUpdate) => Promise<UserPointsRow>
  deleteUserPoints: (id: string) => Promise<void>

  // user_points_logs
  getUserPointsLogById: (id: number) => Promise<UserPointsLogRow | null>
  listUserPointsLogsByPointId: (pointId: string, limit?: number) => Promise<UserPointsLogRow[]>
  createUserPointsLog: (payload: UserPointsLogInsert) => Promise<UserPointsLogRow>
  updateUserPointsLog: (id: number, payload: UserPointsLogUpdate) => Promise<UserPointsLogRow>
  deleteUserPointsLog: (id: number) => Promise<void>

  // membership_tiers
  getMembershipTierById: (id: string) => Promise<MembershipTierRow | null>
  listMembershipTiers: (onlyActive?: boolean) => Promise<MembershipTierRow[]>
  createMembershipTier: (payload: MembershipTierInsert) => Promise<MembershipTierRow>
  updateMembershipTier: (id: string, payload: MembershipTierUpdate) => Promise<MembershipTierRow>
  deleteMembershipTier: (id: string) => Promise<void>
}

const PointsMembershipContext = createContext<PointsMembershipAPI | null>(null)

export const PointsMembershipProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  /**
   * user_points
   */
  const getUserPointsById = useCallback(async (id: string): Promise<UserPointsRow | null> => {
    if (!isNonEmptyString(id)) {
      throw new Error("Invalid id: must be a non-empty string")
    }
    const { data, error } = await supabase.from("user_points").select("*").eq("id", id).maybeSingle()
    if (error) {
      throw new Error(`Failed to fetch user_points by id: ${error.message}`)
    }
    return data
  }, [])

  const getUserPointsByUserId = useCallback(async (userId: string): Promise<UserPointsRow | null> => {
    if (!isNonEmptyString(userId)) {
      throw new Error("Invalid userId: must be a non-empty string")
    }
    const { data, error } = await supabase.from("user_points").select("*").eq("user_id", userId).maybeSingle()
    if (error) {
      throw new Error(`Failed to fetch user_points by user_id: ${error.message}`)
    }
    return data
  }, [])

  const listUserPoints = useCallback(async (limit?: number): Promise<UserPointsRow[]> => {
    const query = supabase.from("user_points").select("*")
    if (typeof limit === "number" && Number.isInteger(limit) && limit > 0) {
      query.limit(limit)
    }
    const { data, error } = await query
    if (error) {
      throw new Error(`Failed to list user_points: ${error.message}`)
    }
    return data ?? []
  }, [])

  const createUserPoints = useCallback(async (payload: UserPointsInsert): Promise<UserPointsRow> => {
    // Validate minimal semantics per schema
    if (payload.user_id !== undefined && payload.user_id !== null && !isNonEmptyString(payload.user_id)) {
      throw new Error("Invalid user_id: must be a non-empty string when provided")
    }
    if (payload.amount !== undefined && payload.amount !== null && !isNumber(payload.amount)) {
      throw new Error("Invalid amount: must be a finite number when provided")
    }
    const { data, error } = await supabase.from("user_points").insert(payload).select("*").single()
    if (error) {
      throw new Error(`Failed to create user_points: ${error.message}`)
    }
    return data
  }, [])

  const updateUserPoints = useCallback(async (id: string, payload: UserPointsUpdate): Promise<UserPointsRow> => {
    if (!isNonEmptyString(id)) {
      throw new Error("Invalid id: must be a non-empty string")
    }
    if (payload.user_id !== undefined && payload.user_id !== null && !isNonEmptyString(payload.user_id)) {
      throw new Error("Invalid user_id: must be a non-empty string when provided")
    }
    if (payload.amount !== undefined && payload.amount !== null && !isNumber(payload.amount)) {
      throw new Error("Invalid amount: must be a finite number when provided")
    }
    const { data, error } = await supabase.from("user_points").update(payload).eq("id", id).select("*").single()
    if (error) {
      throw new Error(`Failed to update user_points: ${error.message}`)
    }
    return data
  }, [])

  const deleteUserPoints = useCallback(async (id: string): Promise<void> => {
    if (!isNonEmptyString(id)) {
      throw new Error("Invalid id: must be a non-empty string")
    }
    const { error } = await supabase.from("user_points").delete().eq("id", id)
    if (error) {
      throw new Error(`Failed to delete user_points: ${error.message}`)
    }
  }, [])

  /**
   * user_points_logs
   */
  const getUserPointsLogById = useCallback(async (id: number): Promise<UserPointsLogRow | null> => {
    if (!isNumber(id)) {
      throw new Error("Invalid id: must be a finite number")
    }
    const { data, error } = await supabase.from("user_points_logs").select("*").eq("id", id).maybeSingle()
    if (error) {
      throw new Error(`Failed to fetch user_points_logs by id: ${error.message}`)
    }
    return data
  }, [])

  const listUserPointsLogsByPointId = useCallback(async (pointId: string, limit?: number): Promise<UserPointsLogRow[]> => {
    if (!isNonEmptyString(pointId)) {
      throw new Error("Invalid pointId: must be a non-empty string")
    }
    const query = supabase.from("user_points_logs").select("*").eq("point_id", pointId).order("created_at", { ascending: false })
    if (typeof limit === "number" && Number.isInteger(limit) && limit > 0) {
      query.limit(limit)
    }
    const { data, error } = await query
    if (error) {
      throw new Error(`Failed to list user_points_logs: ${error.message}`)
    }
    return data ?? []
  }, [])

  const createUserPointsLog = useCallback(async (payload: UserPointsLogInsert): Promise<UserPointsLogRow> => {
    if (payload.point_id !== undefined && payload.point_id !== null && !isNonEmptyString(payload.point_id)) {
      throw new Error("Invalid point_id: must be a non-empty string when provided")
    }
    if (payload.amount !== undefined && payload.amount !== null && !isNumber(payload.amount)) {
      throw new Error("Invalid amount: must be a finite number when provided")
    }
    if (payload.type !== undefined && payload.type !== null && !isNonEmptyString(payload.type)) {
      throw new Error("Invalid type: must be a non-empty string when provided")
    }
    const { data, error } = await supabase.from("user_points_logs").insert(payload).select("*").single()
    if (error) {
      throw new Error(`Failed to create user_points_log: ${error.message}`)
    }
    return data
  }, [])

  const updateUserPointsLog = useCallback(async (id: number, payload: UserPointsLogUpdate): Promise<UserPointsLogRow> => {
    if (!isNumber(id)) {
      throw new Error("Invalid id: must be a finite number")
    }
    if (payload.point_id !== undefined && payload.point_id !== null && !isNonEmptyString(payload.point_id)) {
      throw new Error("Invalid point_id: must be a non-empty string when provided")
    }
    if (payload.amount !== undefined && payload.amount !== null && !isNumber(payload.amount)) {
      throw new Error("Invalid amount: must be a finite number when provided")
    }
    if (payload.type !== undefined && payload.type !== null && !isNonEmptyString(payload.type)) {
      throw new Error("Invalid type: must be a non-empty string when provided")
    }
    const { data, error } = await supabase.from("user_points_logs").update(payload).eq("id", id).select("*").single()
    if (error) {
      throw new Error(`Failed to update user_points_log: ${error.message}`)
    }
    return data
  }, [])

  const deleteUserPointsLog = useCallback(async (id: number): Promise<void> => {
    if (!isNumber(id)) {
      throw new Error("Invalid id: must be a finite number")
    }
    const { error } = await supabase.from("user_points_logs").delete().eq("id", id)
    if (error) {
      throw new Error(`Failed to delete user_points_log: ${error.message}`)
    }
  }, [])

  /**
   * membership_tiers
   */
  const getMembershipTierById = useCallback(async (id: string): Promise<MembershipTierRow | null> => {
    if (!isNonEmptyString(id)) {
      throw new Error("Invalid id: must be a non-empty string")
    }
    const { data, error } = await supabase.from("membership_tiers").select("*").eq("id", id).maybeSingle()
    if (error) {
      throw new Error(`Failed to fetch membership_tiers by id: ${error.message}`)
    }
    return data
  }, [])

  const listMembershipTiers = useCallback(async (onlyActive?: boolean): Promise<MembershipTierRow[]> => {
    let query = supabase.from("membership_tiers").select("*").order("point_required", { ascending: true })
    if (isBoolean(onlyActive) && onlyActive) {
      query = query.eq("active", true)
    }
    const { data, error } = await query
    if (error) {
      throw new Error(`Failed to list membership_tiers: ${error.message}`)
    }
    return data ?? []
  }, [])

  const createMembershipTier = useCallback(async (payload: MembershipTierInsert): Promise<MembershipTierRow> => {
    if (payload.name !== undefined && payload.name !== null && !isNonEmptyString(payload.name)) {
      throw new Error("Invalid name: must be a non-empty string when provided")
    }
    if (payload.point_required !== undefined && payload.point_required !== null && !isNumber(payload.point_required)) {
      throw new Error("Invalid point_required: must be a finite number when provided")
    }
    if (payload.active !== undefined && payload.active !== null && !isBoolean(payload.active)) {
      throw new Error("Invalid active: must be a boolean when provided")
    }
    const { data, error } = await supabase.from("membership_tiers").insert(payload).select("*").single()
    if (error) {
      throw new Error(`Failed to create membership_tier: ${error.message}`)
    }
    return data
  }, [])

  const updateMembershipTier = useCallback(async (id: string, payload: MembershipTierUpdate): Promise<MembershipTierRow> => {
    if (!isNonEmptyString(id)) {
      throw new Error("Invalid id: must be a non-empty string")
    }
    if (payload.name !== undefined && payload.name !== null && !isNonEmptyString(payload.name)) {
      throw new Error("Invalid name: must be a non-empty string when provided")
    }
    if (payload.point_required !== undefined && payload.point_required !== null && !isNumber(payload.point_required)) {
      throw new Error("Invalid point_required: must be a finite number when provided")
    }
    if (payload.active !== undefined && payload.active !== null && !isBoolean(payload.active)) {
      throw new Error("Invalid active: must be a boolean when provided")
    }
    const { data, error } = await supabase.from("membership_tiers").update(payload).eq("id", id).select("*").single()
    if (error) {
      throw new Error(`Failed to update membership_tier: ${error.message}`)
    }
    return data
  }, [])

  const deleteMembershipTier = useCallback(async (id: string): Promise<void> => {
    if (!isNonEmptyString(id)) {
      throw new Error("Invalid id: must be a non-empty string")
    }
    const { error } = await supabase.from("membership_tiers").delete().eq("id", id)
    if (error) {
      throw new Error(`Failed to delete membership_tier: ${error.message}`)
    }
  }, [])

  /**
   * Memoize the public API object so consumers only re-render when needed.
   */
  const api = useMemo<PointsMembershipAPI>(() => {
    return {
      // user_points
      getUserPointsById,
      getUserPointsByUserId,
      listUserPoints,
      createUserPoints,
      updateUserPoints,
      deleteUserPoints,

      // user_points_logs
      getUserPointsLogById,
      listUserPointsLogsByPointId,
      createUserPointsLog,
      updateUserPointsLog,
      deleteUserPointsLog,

      // membership_tiers
      getMembershipTierById,
      listMembershipTiers,
      createMembershipTier,
      updateMembershipTier,
      deleteMembershipTier,
    }
  }, [
    getUserPointsById,
    getUserPointsByUserId,
    listUserPoints,
    createUserPoints,
    updateUserPoints,
    deleteUserPoints,
    getUserPointsLogById,
    listUserPointsLogsByPointId,
    createUserPointsLog,
    updateUserPointsLog,
    deleteUserPointsLog,
    getMembershipTierById,
    listMembershipTiers,
    createMembershipTier,
    updateMembershipTier,
    deleteMembershipTier,
  ])

  return (
    <PointsMembershipContext.Provider value={api}>
      {children}
    </PointsMembershipContext.Provider>
  )
}

/**
 * Hook to access the PointsMembership context.
 */
export function usePointsMembership(): PointsMembershipAPI {
  const ctx = useContext(PointsMembershipContext)
  if (ctx === null) {
    throw new Error("usePointsMembership must be used within PointsMembershipProvider")
  }
  return ctx
}

export default PointsMembershipContext



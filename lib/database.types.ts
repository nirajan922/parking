export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AppRole = "user" | "admin";
export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed" | "expired";
export type ParkingAreaStatus = "open" | "busy" | "full" | "maintenance";
export type ParkingSlotStatus = "available" | "occupied" | "reserved" | "maintenance";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          phone: string | null;
          role: AppRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          role?: AppRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          role?: AppRole;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      parking_areas: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          address: string | null;
          latitude: number | null;
          longitude: number | null;
          total_slots: number;
          status: ParkingAreaStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          total_slots?: number;
          status?: ParkingAreaStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          total_slots?: number;
          status?: ParkingAreaStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      parking_slots: {
        Row: {
          id: string;
          parking_area_id: string;
          slot_number: string;
          level: string | null;
          status: ParkingSlotStatus;
          is_accessible: boolean;
          has_ev_charger: boolean;
          hourly_rate: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          parking_area_id: string;
          slot_number: string;
          level?: string | null;
          status?: ParkingSlotStatus;
          is_accessible?: boolean;
          has_ev_charger?: boolean;
          hourly_rate?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          parking_area_id?: string;
          slot_number?: string;
          level?: string | null;
          status?: ParkingSlotStatus;
          is_accessible?: boolean;
          has_ev_charger?: boolean;
          hourly_rate?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "parking_slots_parking_area_id_fkey";
            columns: ["parking_area_id"];
            referencedRelation: "parking_areas";
            referencedColumns: ["id"];
          },
        ];
      };
      bookings: {
        Row: {
          id: string;
          user_id: string;
          parking_area_id: string;
          parking_slot_id: string;
          vehicle_plate: string;
          start_time: string;
          end_time: string;
          status: BookingStatus;
          total_price: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          parking_area_id: string;
          parking_slot_id: string;
          vehicle_plate: string;
          start_time: string;
          end_time: string;
          status?: BookingStatus;
          total_price?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          parking_area_id?: string;
          parking_slot_id?: string;
          vehicle_plate?: string;
          start_time?: string;
          end_time?: string;
          status?: BookingStatus;
          total_price?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_parking_area_id_fkey";
            columns: ["parking_area_id"];
            referencedRelation: "parking_areas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_parking_slot_id_fkey";
            columns: ["parking_slot_id"];
            referencedRelation: "parking_slots";
            referencedColumns: ["id"];
          },
        ];
      };
      predictions: {
        Row: {
          id: string;
          parking_area_id: string;
          predicted_available_slots: number;
          confidence_score: number;
          prediction_window_start: string;
          prediction_window_end: string;
          model_version: string | null;
          metadata: Json;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          parking_area_id: string;
          predicted_available_slots: number;
          confidence_score: number;
          prediction_window_start: string;
          prediction_window_end: string;
          model_version?: string | null;
          metadata?: Json;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          parking_area_id?: string;
          predicted_available_slots?: number;
          confidence_score?: number;
          prediction_window_start?: string;
          prediction_window_end?: string;
          model_version?: string | null;
          metadata?: Json;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "predictions_parking_area_id_fkey";
            columns: ["parking_area_id"];
            referencedRelation: "parking_areas";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ParkingArea = Database["public"]["Tables"]["parking_areas"]["Row"];
export type ParkingSlot = Database["public"]["Tables"]["parking_slots"]["Row"];
export type Booking = Database["public"]["Tables"]["bookings"]["Row"];
export type Prediction = Database["public"]["Tables"]["predictions"]["Row"];

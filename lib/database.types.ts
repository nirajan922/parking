export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";
export type ParkingZoneStatus = "open" | "busy" | "full" | "maintenance";

export type Database = {
  public: {
    Tables: {
      parking_zones: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          address: string | null;
          latitude: number | null;
          longitude: number | null;
          total_spaces: number;
          available_spaces: number;
          status: ParkingZoneStatus;
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
          total_spaces: number;
          available_spaces?: number;
          status?: ParkingZoneStatus;
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
          total_spaces?: number;
          available_spaces?: number;
          status?: ParkingZoneStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      bookings: {
        Row: {
          id: string;
          user_id: string;
          parking_zone_id: string;
          vehicle_plate: string;
          start_time: string;
          end_time: string;
          status: BookingStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          parking_zone_id: string;
          vehicle_plate: string;
          start_time: string;
          end_time: string;
          status?: BookingStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          parking_zone_id?: string;
          vehicle_plate?: string;
          start_time?: string;
          end_time?: string;
          status?: BookingStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_parking_zone_id_fkey";
            columns: ["parking_zone_id"];
            referencedRelation: "parking_zones";
            referencedColumns: ["id"];
          },
        ];
      };
      predictions: {
        Row: {
          id: string;
          parking_zone_id: string;
          predicted_available_spaces: number;
          confidence_score: number;
          prediction_window_start: string;
          prediction_window_end: string;
          model_version: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          parking_zone_id: string;
          predicted_available_spaces: number;
          confidence_score: number;
          prediction_window_start: string;
          prediction_window_end: string;
          model_version?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          parking_zone_id?: string;
          predicted_available_spaces?: number;
          confidence_score?: number;
          prediction_window_start?: string;
          prediction_window_end?: string;
          model_version?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "predictions_parking_zone_id_fkey";
            columns: ["parking_zone_id"];
            referencedRelation: "parking_zones";
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

export type ParkingZone = Database["public"]["Tables"]["parking_zones"]["Row"];
export type Booking = Database["public"]["Tables"]["bookings"]["Row"];
export type Prediction = Database["public"]["Tables"]["predictions"]["Row"];

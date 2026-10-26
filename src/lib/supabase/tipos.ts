
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "alertas": {
                  Row: {
                    "creada": string,"id": number,"leida": boolean,"mensaje": string,"monto": number | null,"producto_id": string | null,"tienda_id": string | null,"tipo": string,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "creada"?: string,"id"?: number,"leida"?: boolean,"mensaje": string,"monto"?: number | null,"producto_id"?: string | null,"tienda_id"?: string | null,"tipo": string,"user_id"?: string | null
                  }
                  Update: {
                    "creada"?: string,"id"?: number,"leida"?: boolean,"mensaje"?: string,"monto"?: number | null,"producto_id"?: string | null,"tienda_id"?: string | null,"tipo"?: string,"user_id"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"anotados": {
                  Row: {
                    "autor": string | null,"fecha": string,"precio": number,"producto_id": string,"tienda_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "autor"?: string | null,"fecha"?: string,"precio": number,"producto_id": string,"tienda_id": string
                  }
                  Update: {
                    "autor"?: string | null,"fecha"?: string,"precio"?: number,"producto_id"?: string,"tienda_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "anotados_producto_id_fkey"
      columns: ["producto_id"]
isOneToOne: false
      referencedRelation: "productos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "anotados_tienda_id_fkey"
      columns: ["tienda_id"]
isOneToOne: false
      referencedRelation: "tiendas"
      referencedColumns: ["id"]
    }
                  ]
                },"clima_causas": {
                  Row: {
                    "es_clima": boolean,"fecha": string,"fuente_url": string | null,"producto_id": string,"texto": string
                  }
                  ComputedFields: never
                  Insert: {
                    "es_clima": boolean,"fecha": string,"fuente_url"?: string | null,"producto_id": string,"texto": string
                  }
                  Update: {
                    "es_clima"?: boolean,"fecha"?: string,"fuente_url"?: string | null,"producto_id"?: string,"texto"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "clima_causas_producto_id_fkey"
      columns: ["producto_id"]
isOneToOne: false
      referencedRelation: "productos"
      referencedColumns: ["id"]
    }
                  ]
                },"corridas": {
                  Row: {
                    "conteos": Json | null,"fin": string | null,"fuentes": Json | null,"id": number,"inicio": string,"notas": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "conteos"?: Json | null,"fin"?: string | null,"fuentes"?: Json | null,"id"?: number,"inicio"?: string,"notas"?: string | null
                  }
                  Update: {
                    "conteos"?: Json | null,"fin"?: string | null,"fuentes"?: Json | null,"id"?: number,"inicio"?: string,"notas"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"listas": {
                  Row: {
                    "items": NonNullable<Json>,"tienda_preferida": string | null,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "items"?: NonNullable<Json>,"tienda_preferida"?: string | null,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "items"?: NonNullable<Json>,"tienda_preferida"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "listas_tienda_preferida_fkey"
      columns: ["tienda_preferida"]
isOneToOne: false
      referencedRelation: "tiendas"
      referencedColumns: ["id"]
    }
                  ]
                },"precios_actuales": {
                  Row: {
                    "estado": Database["public"]['Enums']["estado_precio"],"fecha": string,"fuente": string | null,"nota": string | null,"precio": number | null,"producto_id": string,"revisar": boolean,"tienda_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "estado": Database["public"]['Enums']["estado_precio"],"fecha": string,"fuente"?: string | null,"nota"?: string | null,"precio"?: number | null,"producto_id": string,"revisar"?: boolean,"tienda_id": string,"updated_at"?: string
                  }
                  Update: {
                    "estado"?: Database["public"]['Enums']["estado_precio"],"fecha"?: string,"fuente"?: string | null,"nota"?: string | null,"precio"?: number | null,"producto_id"?: string,"revisar"?: boolean,"tienda_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "precios_actuales_producto_id_fkey"
      columns: ["producto_id"]
isOneToOne: false
      referencedRelation: "productos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "precios_actuales_tienda_id_fkey"
      columns: ["tienda_id"]
isOneToOne: false
      referencedRelation: "tiendas"
      referencedColumns: ["id"]
    }
                  ]
                },"precios_historial": {
                  Row: {
                    "estado": Database["public"]['Enums']["estado_precio"],"fecha": string,"id": number,"precio": number | null,"producto_id": string | null,"tienda_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "estado": Database["public"]['Enums']["estado_precio"],"fecha": string,"id"?: number,"precio"?: number | null,"producto_id"?: string | null,"tienda_id"?: string | null
                  }
                  Update: {
                    "estado"?: Database["public"]['Enums']["estado_precio"],"fecha"?: string,"id"?: number,"precio"?: number | null,"producto_id"?: string | null,"tienda_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "precios_historial_producto_id_fkey"
      columns: ["producto_id"]
isOneToOne: false
      referencedRelation: "productos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "precios_historial_tienda_id_fkey"
      columns: ["tienda_id"]
isOneToOne: false
      referencedRelation: "tiendas"
      referencedColumns: ["id"]
    }
                  ]
                },"preferencias_notif": {
                  Row: {
                    "umbral_ahorro": number,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "umbral_ahorro"?: number,"user_id": string
                  }
                  Update: {
                    "umbral_ahorro"?: number,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"producto_fuente": {
                  Row: {
                    "activo": boolean,"factor": number | null,"producto_id": string,"sku": string | null,"termino": string | null,"tienda_id": string,"url": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "activo"?: boolean,"factor"?: number | null,"producto_id": string,"sku"?: string | null,"termino"?: string | null,"tienda_id": string,"url"?: string | null
                  }
                  Update: {
                    "activo"?: boolean,"factor"?: number | null,"producto_id"?: string,"sku"?: string | null,"termino"?: string | null,"tienda_id"?: string,"url"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "producto_fuente_producto_id_fkey"
      columns: ["producto_id"]
isOneToOne: false
      referencedRelation: "productos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "producto_fuente_tienda_id_fkey"
      columns: ["tienda_id"]
isOneToOne: false
      referencedRelation: "tiendas"
      referencedColumns: ["id"]
    }
                  ]
                },"productos": {
                  Row: {
                    "cantidad_base": number,"emoji": string | null,"frecuencia": string,"grupo": string,"id": string,"nombre": string,"unidad": string,"unidad_base": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cantidad_base": number,"emoji"?: string | null,"frecuencia": string,"grupo": string,"id": string,"nombre": string,"unidad": string,"unidad_base": string
                  }
                  Update: {
                    "cantidad_base"?: number,"emoji"?: string | null,"frecuencia"?: string,"grupo"?: string,"id"?: string,"nombre"?: string,"unidad"?: string,"unidad_base"?: string
                  }
                  Relationships: [
                    
                  ]
                },"tienda_estado": {
                  Row: {
                    "estado": Database["public"]['Enums']["estado_fuente"] | null,"tienda_id": string,"ultimo_ok": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "estado"?: Database["public"]['Enums']["estado_fuente"] | null,"tienda_id": string,"ultimo_ok"?: string | null
                  }
                  Update: {
                    "estado"?: Database["public"]['Enums']["estado_fuente"] | null,"tienda_id"?: string,"ultimo_ok"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "tienda_estado_tienda_id_fkey"
      columns: ["tienda_id"]
isOneToOne: true
      referencedRelation: "tiendas"
      referencedColumns: ["id"]
    }
                  ]
                },"tiendas": {
                  Row: {
                    "color": string,"id": string,"manual": boolean,"nombre": string,"nota": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "color": string,"id": string,"manual"?: boolean,"nombre": string,"nota"?: string | null
                  }
                  Update: {
                    "color"?: string,"id"?: string,"manual"?: boolean,"nombre"?: string,"nota"?: string | null
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            "historial_minimo": {
                  Row: {
                    "fecha": string | null,"precio": number | null,"producto_id": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "precios_historial_producto_id_fkey"
      columns: ["producto_id"]
isOneToOne: false
      referencedRelation: "productos"
      referencedColumns: ["id"]
    }
                  ]
                },"precio_efectivo": {
                  Row: {
                    "estado": string | null,"fecha": string | null,"fuente": string | null,"precio": number | null,"producto_id": string | null,"revisar": boolean | null,"tienda_id": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                }
          }
          Functions: {
            [_ in never]: never
          }
          Enums: {
            "estado_fuente": "ok"|"parcial"|"fallo","estado_precio": "real"|"estimado"|"sin_dato"|"simulado"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "estado_fuente": ["ok", "parcial", "fallo"],"estado_precio": ["real", "estimado", "sin_dato", "simulado"]
          }
        }
} as const

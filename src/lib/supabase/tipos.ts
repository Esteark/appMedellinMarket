
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
                },"catalogo_tienda": {
                  Row: {
                    "activo": boolean,"autor": string | null,"creado": string,"orden": number,"producto_id": string,"tienda_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "activo"?: boolean,"autor"?: string | null,"creado"?: string,"orden"?: number,"producto_id": string,"tienda_id"?: string
                  }
                  Update: {
                    "activo"?: boolean,"autor"?: string | null,"creado"?: string,"orden"?: number,"producto_id"?: string,"tienda_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "catalogo_tienda_producto_id_fkey"
      columns: ["producto_id"]
isOneToOne: false
      referencedRelation: "productos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "catalogo_tienda_tienda_id_fkey"
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
                },"contexto_mercado": {
                  Row: {
                    "actualizado": string,"fuente": string,"fuente_url": string | null,"ipc_alimentos": number | null,"ipc_alimentos_anual": number | null,"mes": string
                  }
                  ComputedFields: never
                  Insert: {
                    "actualizado"?: string,"fuente"?: string,"fuente_url"?: string | null,"ipc_alimentos"?: number | null,"ipc_alimentos_anual"?: number | null,"mes": string
                  }
                  Update: {
                    "actualizado"?: string,"fuente"?: string,"fuente_url"?: string | null,"ipc_alimentos"?: number | null,"ipc_alimentos_anual"?: number | null,"mes"?: string
                  }
                  Relationships: [
                    
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
                },"fusiones_productos": {
                  Row: {
                    "autor": string | null,"creado": string,"destino": string,"id": number,"origen": string
                  }
                  ComputedFields: never
                  Insert: {
                    "autor"?: string | null,"creado"?: string,"destino": string,"id"?: number,"origen": string
                  }
                  Update: {
                    "autor"?: string | null,"creado"?: string,"destino"?: string,"id"?: number,"origen"?: string
                  }
                  Relationships: [
                    
                  ]
                },"gastos_reales": {
                  Row: {
                    "cantidad": number | null,"created_at": string,"descripcion": string | null,"fecha": string,"id": string,"lote_importacion": string | null,"mes": string,"monto": number,"nota": string | null,"origen": string,"producto_id": string | null,"rubro": string,"tienda_id": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cantidad"?: number | null,"created_at"?: string,"descripcion"?: string | null,"fecha"?: string,"id"?: string,"lote_importacion"?: string | null,"mes": string,"monto": number,"nota"?: string | null,"origen": string,"producto_id"?: string | null,"rubro": string,"tienda_id"?: string | null,"user_id": string
                  }
                  Update: {
                    "cantidad"?: number | null,"created_at"?: string,"descripcion"?: string | null,"fecha"?: string,"id"?: string,"lote_importacion"?: string | null,"mes"?: string,"monto"?: number,"nota"?: string | null,"origen"?: string,"producto_id"?: string | null,"rubro"?: string,"tienda_id"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "gastos_reales_lote_importacion_fkey"
      columns: ["lote_importacion"]
isOneToOne: false
      referencedRelation: "importaciones_gastos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "gastos_reales_producto_id_fkey"
      columns: ["producto_id"]
isOneToOne: false
      referencedRelation: "productos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "gastos_reales_tienda_id_fkey"
      columns: ["tienda_id"]
isOneToOne: false
      referencedRelation: "tiendas"
      referencedColumns: ["id"]
    }
                  ]
                },"importacion_cambios": {
                  Row: {
                    "anotado_fecha": string | null,"anotado_precio": number | null,"creado": string,"fecha": string,"historial_origen": string | null,"historial_precio": number | null,"historial_promocion": boolean | null,"id": number,"importacion_id": string,"precio_nuevo": number,"producto_id": string,"promocion": boolean,"tienda_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "anotado_fecha"?: string | null,"anotado_precio"?: number | null,"creado"?: string,"fecha": string,"historial_origen"?: string | null,"historial_precio"?: number | null,"historial_promocion"?: boolean | null,"id"?: number,"importacion_id": string,"precio_nuevo": number,"producto_id": string,"promocion"?: boolean,"tienda_id": string
                  }
                  Update: {
                    "anotado_fecha"?: string | null,"anotado_precio"?: number | null,"creado"?: string,"fecha"?: string,"historial_origen"?: string | null,"historial_precio"?: number | null,"historial_promocion"?: boolean | null,"id"?: number,"importacion_id"?: string,"precio_nuevo"?: number,"producto_id"?: string,"promocion"?: boolean,"tienda_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "importacion_cambios_importacion_id_fkey"
      columns: ["importacion_id"]
isOneToOne: false
      referencedRelation: "importaciones_gastos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "importacion_cambios_producto_id_fkey"
      columns: ["producto_id"]
isOneToOne: false
      referencedRelation: "productos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "importacion_cambios_tienda_id_fkey"
      columns: ["tienda_id"]
isOneToOne: false
      referencedRelation: "tiendas"
      referencedColumns: ["id"]
    }
                  ]
                },"importaciones_gastos": {
                  Row: {
                    "archivo": string | null,"creado": string,"deshecho": string | null,"fecha_lote": string,"filas": number,"hash": string,"id": string,"total": number,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "archivo"?: string | null,"creado"?: string,"deshecho"?: string | null,"fecha_lote": string,"filas": number,"hash": string,"id"?: string,"total"?: number,"user_id": string
                  }
                  Update: {
                    "archivo"?: string | null,"creado"?: string,"deshecho"?: string | null,"fecha_lote"?: string,"filas"?: number,"hash"?: string,"id"?: string,"total"?: number,"user_id"?: string
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
                },"listas_guardadas": {
                  Row: {
                    "actualizada": string,"creada": string,"id": string,"items": NonNullable<Json>,"nombre": string,"nombre_clave": string | null,"tienda_preferida": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "actualizada"?: string,"creada"?: string,"id"?: string,"items"?: NonNullable<Json>,"nombre": string,"nombre_clave"?: never,"tienda_preferida"?: string | null,"user_id": string
                  }
                  Update: {
                    "actualizada"?: string,"creada"?: string,"id"?: string,"items"?: NonNullable<Json>,"nombre"?: string,"nombre_clave"?: never,"tienda_preferida"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "listas_guardadas_tienda_preferida_fkey"
      columns: ["tienda_preferida"]
isOneToOne: false
      referencedRelation: "tiendas"
      referencedColumns: ["id"]
    }
                  ]
                },"planes_guardados": {
                  Row: {
                    "actualizada": string,"config": NonNullable<Json>,"id": string,"nombre": string,"nombre_clave": string | null,"tipo": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "actualizada"?: string,"config": NonNullable<Json>,"id"?: string,"nombre": string,"nombre_clave"?: never,"tipo": string,"user_id": string
                  }
                  Update: {
                    "actualizada"?: string,"config"?: NonNullable<Json>,"id"?: string,"nombre"?: string,"nombre_clave"?: never,"tipo"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"planes_usuario": {
                  Row: {
                    "actualizada": string,"config": NonNullable<Json>,"tipo": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "actualizada"?: string,"config": NonNullable<Json>,"tipo": string,"user_id": string
                  }
                  Update: {
                    "actualizada"?: string,"config"?: NonNullable<Json>,"tipo"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
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
                },"precios_manuales_historial": {
                  Row: {
                    "autor": string | null,"cantidad": number | null,"creado": string,"fecha": string,"id": number,"importacion_id": string | null,"origen": string,"precio": number,"producto_id": string,"promocion": boolean,"tienda_id": string,"total": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "autor"?: string | null,"cantidad"?: number | null,"creado"?: string,"fecha"?: string,"id"?: number,"importacion_id"?: string | null,"origen"?: string,"precio": number,"producto_id": string,"promocion"?: boolean,"tienda_id": string,"total"?: number | null
                  }
                  Update: {
                    "autor"?: string | null,"cantidad"?: number | null,"creado"?: string,"fecha"?: string,"id"?: number,"importacion_id"?: string | null,"origen"?: string,"precio"?: number,"producto_id"?: string,"promocion"?: boolean,"tienda_id"?: string,"total"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "precios_manuales_historial_importacion_id_fkey"
      columns: ["importacion_id"]
isOneToOne: false
      referencedRelation: "importaciones_gastos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "precios_manuales_historial_producto_id_fkey"
      columns: ["producto_id"]
isOneToOne: false
      referencedRelation: "productos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "precios_manuales_historial_tienda_id_fkey"
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
                },"presupuestos_cierres": {
                  Row: {
                    "ahorro": number,"created_at": string,"id": string,"mes": string,"por_rubro": NonNullable<Json>,"total_gastado": number,"total_presupuestado": number,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "ahorro"?: number,"created_at"?: string,"id"?: string,"mes": string,"por_rubro"?: NonNullable<Json>,"total_gastado"?: number,"total_presupuestado"?: number,"user_id": string
                  }
                  Update: {
                    "ahorro"?: number,"created_at"?: string,"id"?: string,"mes"?: string,"por_rubro"?: NonNullable<Json>,"total_gastado"?: number,"total_presupuestado"?: number,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"presupuestos_historial": {
                  Row: {
                    "creado": string,"id": number,"mes": string,"monto_anterior": number | null,"monto_nuevo": number | null,"rubro": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "creado"?: string,"id"?: number,"mes": string,"monto_anterior"?: number | null,"monto_nuevo"?: number | null,"rubro": string,"user_id": string
                  }
                  Update: {
                    "creado"?: string,"id"?: number,"mes"?: string,"monto_anterior"?: number | null,"monto_nuevo"?: number | null,"rubro"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"presupuestos_mensuales": {
                  Row: {
                    "created_at": string,"id": string,"mes": string,"monto": number,"orden": number,"rubro": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"mes": string,"monto": number,"orden"?: number,"rubro": string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"mes"?: string,"monto"?: number,"orden"?: number,"rubro"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"producto_alias": {
                  Row: {
                    "alias_norm": string,"creado": string,"creado_por": string | null,"id": number,"producto_id": string,"tienda_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "alias_norm": string,"creado"?: string,"creado_por"?: string | null,"id"?: number,"producto_id": string,"tienda_id"?: string | null
                  }
                  Update: {
                    "alias_norm"?: string,"creado"?: string,"creado_por"?: string | null,"id"?: number,"producto_id"?: string,"tienda_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "producto_alias_producto_id_fkey"
      columns: ["producto_id"]
isOneToOne: false
      referencedRelation: "productos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "producto_alias_tienda_id_fkey"
      columns: ["tienda_id"]
isOneToOne: false
      referencedRelation: "tiendas"
      referencedColumns: ["id"]
    }
                  ]
                },"producto_codigo": {
                  Row: {
                    "codigo": string,"creado": string,"creado_por": string | null,"producto_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "codigo": string,"creado"?: string,"creado_por"?: string | null,"producto_id": string
                  }
                  Update: {
                    "codigo"?: string,"creado"?: string,"creado_por"?: string | null,"producto_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "producto_codigo_producto_id_fkey"
      columns: ["producto_id"]
isOneToOne: false
      referencedRelation: "productos"
      referencedColumns: ["id"]
    }
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
                    "cantidad_base": number,"creado": string,"creado_por": string | null,"emoji": string | null,"frecuencia": string,"grupo": string,"id": string,"nombre": string,"nombre_norm": string | null,"origen": string,"revisado": boolean,"unidad": string,"unidad_base": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cantidad_base": number,"creado"?: string,"creado_por"?: string | null,"emoji"?: string | null,"frecuencia": string,"grupo": string,"id": string,"nombre": string,"nombre_norm"?: never,"origen"?: string,"revisado"?: boolean,"unidad": string,"unidad_base": string
                  }
                  Update: {
                    "cantidad_base"?: number,"creado"?: string,"creado_por"?: string | null,"emoji"?: string | null,"frecuencia"?: string,"grupo"?: string,"id"?: string,"nombre"?: string,"nombre_norm"?: never,"origen"?: string,"revisado"?: boolean,"unidad"?: string,"unidad_base"?: string
                  }
                  Relationships: [
                    
                  ]
                },"tienda_alias": {
                  Row: {
                    "alias_norm": string,"creado": string,"creado_por": string | null,"tienda_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "alias_norm": string,"creado"?: string,"creado_por"?: string | null,"tienda_id": string
                  }
                  Update: {
                    "alias_norm"?: string,"creado"?: string,"creado_por"?: string | null,"tienda_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "tienda_alias_tienda_id_fkey"
      columns: ["tienda_id"]
isOneToOne: false
      referencedRelation: "tiendas"
      referencedColumns: ["id"]
    }
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
                    "color": string,"creado": string,"creado_por": string | null,"id": string,"manual": boolean,"nombre": string,"nombre_norm": string | null,"nota": string | null,"origen": string
                  }
                  ComputedFields: never
                  Insert: {
                    "color": string,"creado"?: string,"creado_por"?: string | null,"id": string,"manual"?: boolean,"nombre": string,"nombre_norm"?: never,"nota"?: string | null,"origen"?: string
                  }
                  Update: {
                    "color"?: string,"creado"?: string,"creado_por"?: string | null,"id"?: string,"manual"?: boolean,"nombre"?: string,"nombre_norm"?: never,"nota"?: string | null,"origen"?: string
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
                    
                  ]
                },"precio_catalogo": {
                  Row: {
                    "estado": string | null,"fecha": string | null,"fuente": string | null,"precio": number | null,"producto_id": string | null,"revisar": boolean | null,"tienda_id": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"precio_efectivo": {
                  Row: {
                    "estado": string | null,"fecha": string | null,"fuente": string | null,"precio": number | null,"producto_id": string | null,"revisar": boolean | null,"tienda_id": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"serie_pronostico": {
                  Row: {
                    "producto_id": string | null,"puntos": Json | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                }
          }
          Functions: {
            "agregar_a_tienda":
{ Args: { "p_producto": string,"p_tiendas": (string)[] }; Returns: number
                           },
"corregir_precio":
{ Args: { "p_precio": number,"p_producto": string,"p_tienda": string }; Returns: undefined
                           },
"crear_producto":
{ Args: { "p_cantidad_base"?: number,"p_frecuencia"?: string,"p_grupo"?: string,"p_nombre": string,"p_unidad"?: string }; Returns: string
                           },
"crear_tienda":
{ Args: { "p_nombre": string }; Returns: string
                           },
"deshacer_importacion":
{ Args: { "p_id": string }; Returns: Json
                           },
"emparejar_producto":
{ Args: { "p_codigo": string,"p_nombre": string,"p_tienda": string }; Returns: string
                           },
"fusionar_productos":
{ Args: { "p_destino": string,"p_origen": string }; Returns: Json
                           },
"guardar_presupuesto_mes":
{ Args: { "p_mes": string,"p_rubros": Json }; Returns: undefined
                           },
"importar_compra":
{ Args: { "p_archivo": string,"p_fecha": string,"p_filas": Json,"p_hash": string,"p_publicar": boolean }; Returns: Json
                           },
"normalizar_nombre":
{ Args: { "p_texto": string }; Returns: string
                           },
"previsualizar_compra":
{ Args: { "p_filas": Json }; Returns: {
              "aviso": string,"grupo": string,"linea": number,"precio": number,"producto_id": string,"producto_nombre": string,"producto_nuevo": boolean,"producto_texto": string,"tienda_id": string,"tienda_nueva": boolean,"tienda_texto": string
            }[]
                           },
"quitar_correccion":
{ Args: { "p_producto": string,"p_tienda": string }; Returns: boolean
                           },
"quitar_de_tienda":
{ Args: { "p_producto": string,"p_tienda": string }; Returns: boolean
                           },
"slug_tienda":
{ Args: { "p_nombre": string }; Returns: string
                           }
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

# Documentación de la API REST y WebSockets — APITECH 2.0

- **Base URL Local**: `http://localhost:3002/api`
- **Endpoint WebSocket**: `ws://localhost:3002/ws`
- **Formato de Respuesta Estándar**:
  ```json
  {
    "success": true,
    "data": { ... }
  }
  ```

---

## 1. Salud del Sistema, Arquitectura AWS y Dashboard

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/health` | Estado del servidor, conexión PostgreSQL (`apitech2_db`), endpoint AWS IoT Core, las 6 funciones AWS Lambda, conteo de colas SQS/DLQ, estado del simulador dual (`DEMO_4S` / `OPERATIVO_30M`) y clientes WebSocket. |
| `GET` | `/api/aws/architecture-status` | Estado integral de la arquitectura AWS: flujo de 8 etapas, vista en vivo de los **7 KPIs SMART del documento PDF** (`vw_kpis_documento_pdf`), pasarelas Heltec V4, instalaciones vigentes, bitácora `registro_evento` y mensajes en `apitech2-telemetry-dlq`. |
| `GET` | `/api/dashboard` | Indicadores generales, los 7 KPIs SMART del PDF, series temporales SHT45/HX711, alertas abiertas, recomendaciones prioritarias y actividad MQTT reciente (`?apiario_id=&colmena_id=&range=1h\|6h\|24h\|7d\|30d`). |

---

## 2. Gestión de Apiarios, Colmenas, Pasarelas, Nodos e Instalaciones

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/apiarios` | Lista los apiarios con su periodo apícola activo, su pasarela Heltec V4 asignada (`pasarela_codigo`, `pasarela_thing_name`), conteo de colmenas y alertas. |
| `GET` | `/api/apiarios/:id` | Detalle de un apiario y listado de sus colmenas. |
| `POST` | `/api/apiarios` | Registra un nuevo apiario con coordenadas simuladas editables. |
| `PUT` | `/api/apiarios/:id` | Actualiza datos, coordenadas o periodo apícola de un apiario. |
| `DELETE` | `/api/apiarios/:id` | Elimina un apiario. |
| `GET` | `/api/colmenas` | Lista colmenas con su nodo Heltec V4, UUID de instalación vigente, última telemetría (`temperatura`, `humedad`, `peso_kg`, `bateria_v`, `rssi_dbm`, `snr_db`, `topic_mqtt`) y alertas. Filtros: `apiario_id`, `estado`, `search`. |
| `GET` | `/api/colmenas/:id` | Ficha técnica completa de una colmena: nodo, pasarela, instalación, 5 sensores (`SHT45`, `HX711`, `BATERIA`, `SENAL_LORA`), estadísticas 24h, telemetría reciente, alertas y recomendaciones. |
| `POST` | `/api/colmenas` | Registra una nueva colmena. |
| `PUT` | `/api/colmenas/:id` | Actualiza una colmena. |
| `DELETE` | `/api/colmenas/:id` | Elimina una colmena. |
| `GET` | `/api/nodos` | Inventario técnico de nodos Heltec V4 (`iot_thing_name`, `certificado_x509_fingerprint`, `consumo_reposo_ma`, `bateria_v`, `rssi_actual_dbm`, `snr_db`, sensores), pasarelas y resumen global. |
| `POST` | `/api/nodos` | Registra un nuevo nodo Heltec V4 con identidad X.509 individual y crea su registro en `instalacion` si se asocia a una colmena. |
| `PATCH` | `/api/nodos/:id/asociar` | Asocia o desasocia un nodo a una colmena cerrando automáticamente cualquier instalación previa vigente (`hasta = CURRENT_TIMESTAMP`) para impedir solapamientos temporales (`Anexo A.6 PDF`). |
| `GET` | `/api/pasarelas` | Lista las pasarelas Heltec V4 (LoRa 915 MHz → Wi-Fi MQTT/TLS). |
| `GET` | `/api/instalaciones` | Historial de asignaciones nodo ↔ colmena (`desde`, `hasta`, `factor_calibracion_hx711`). |

---

## 3. Telemetría IoT y Pipeline AWS Lambda

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/telemetria` | Series temporales, estadísticas (`min/max/prom` de temperatura, humedad, peso, tensión de batería y RSSI LoRa) y registros con triple marca temporal (`capturada_en`, `recibida_en`, `ingresada_en`). |
| `POST` | `/api/telemetria/ingesta` | Ejecuta el contrato de 5 etapas del pipeline AWS Lambda sobre una captura individual o un lote `{ "capturas": [...] }`: (1) Validación de esquema y topic `apitech/{apiario_id}/{colmena_id}/telemetria`, (2) Control de idempotencia por `id_medicion` UUID y persistencia ACID, (3) Evaluación de umbrales y episodios de alerta (`SP2.1-SP2.3`), (4) Generación de recomendaciones por periodo apícola, y (5) Derivación de errores a `cola_mensajes_sqs` (`apitech2-telemetry-dlq`). |

---

## 4. Alertas, Recomendaciones, Periodos, Reportes, Configuración e IA

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/alertas` | Lista episodios de alerta con contadores por prioridad/estado y referencias `id_medicion_inicio` / `id_medicion_ultima`. |
| `PATCH` | `/api/alertas/:id/estado` | Actualiza el estado de una alerta (`REVISADA` o `RESUELTA`). |
| `POST` | `/api/alertas/marcar-todas-revisadas` | Marca todas las alertas `ACTIVA` como `REVISADA`. |
| `GET` | `/api/recomendaciones` | Lista sugerencias operativas contextualizadas por periodo apícola. |
| `PATCH` | `/api/recomendaciones/:id/estado` | Actualiza estado (`PENDIENTE`, `EN_PROCESO`, `APLICADA`, `DESCARTADA`). |
| `GET` | `/api/periodos` | Lista los 3 periodos apícolas (`COSECHA_MIEL`, `INVERNADA`, `POLINIZACION`) y el historial de cambios. |
| `PUT` | `/api/periodos/apiario/:apiarioId` | Cambia manualmente el periodo apícola activo de un apiario. |
| `GET` | `/api/reportes` | Reporte consolidado por colmena, distribución de alertas y 7 KPIs SMART. |
| `GET` | `/api/reportes/exportar-csv` | Exportación CSV UTF-8 real (`?seccion=mediciones\|alertas`). |
| `GET` | `/api/configuracion` | Reglas de alerta (`configuracion_umbral`), parámetros del sistema y auditoría de retención. |
| `PUT` | `/api/configuracion/umbrales/:id` | Actualiza una regla de alerta validando `límite_inferior < límite_superior` (`CU09`). |
| `GET` | `/api/configuracion/simulador` | Estado actual del simulador dual (`DEMO_4S` vs `OPERATIVO_30M`, transporte `LOCAL_LAMBDA_PIPELINE` vs `AWS_IOT_MQTT_TLS`, y los 8 escenarios por colmena). |
| `PUT` | `/api/configuracion/simulador` | Modifica en vivo la frecuencia (`4s` o `30m`), el transporte o los escenarios por colmena. |
| `POST` | `/api/configuracion/retencion/ejecutar` | Ejecuta de forma controlada `aplicar_politica_retencion_telemetria`. |
| `GET` | `/api/ai/status` | Estado del asistente Google Gemini, modelos detectados y disponibilidad de fallback local. |
| `POST` | `/api/ai/chat` | Envía una consulta al asistente IA sobre datos reales de PostgreSQL. |

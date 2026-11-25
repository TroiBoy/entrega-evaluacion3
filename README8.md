# APITECH 2.0 — Plataforma de Monitoreo Apícola IoT con Arquitectura AWS Nativa, Telemetría LoRa 915 MHz, Inteligencia Artificial y Visualización Dual

**APITECH2** es la segunda implementación tecnológica independiente de la plataforma **ApiTech**, diseñada para materializar fielmente la arquitectura AWS definida en el documento técnico oficial **`Eva4ApiTechJorimCaroAndresDiaz.pdf`** (Jorim Caro Urra y Andrés Díaz Maldonado, Proyecto de Título TIHI84 — INACAP Temuco) y permitir una comparación objetiva frente a la primera implementación (`APITECH`).

---

## 1. Flujo Principal de Arquitectura (Referencia Documento Técnico PDF)

```text
[Sensores: SHT45 (I2C) + 4x Celdas 50kg / HX711 (24-bit 10 SPS) + Panel Solar 5V / Batería 18650 1S]
        │
        ▼  I2C / Digital DOUT-PD_SCK / ADC
[Nodo de Adquisición: Heltec WiFi LoRa 32 V4 (ESP32-S3R2 + SX1262, C++ Arduino, Muestreo 30 min)]
        │
        ▼  Enlace LoRa P2P Estrella 915 MHz (SF9, BW 125 kHz, CR 4/5, hasta 3 intentos con id_medicion UUID)
[Pasarela Receptora: Heltec WiFi LoRa 32 V4 (Cola persistente 256 msgs, RSSI/SNR, NTP UTC, Fuente USB 5V)]
        │
        ▼  Wi-Fi 2.4 GHz — MQTT 3.1.1 sobre TLS (Puerto TCP 8883, Certificados X.509 individuales, QoS 1)
[AWS IoT Core: Endpoint a2jvdwy68yzv30-ats.iot.us-east-1.amazonaws.com]
   Topic oficial: apitech/{apiario_id}/{colmena_id}/telemetria
        │
        ├──► (Fallo de entrega / Error Action) ──► [Amazon SQS + Dead Letter Queue: apitech2-telemetry-dlq]
        ▼  Regla IoT SQL (apitech2_telemetry_ingest_rule)
[AWS Lambda (Python 3.12 + boto3 + psycopg) — 6 Funciones Independientes por Responsabilidad]
   1. lambda_validator_normalizer  (Validación de esquema, topic, UUID y rangos físicos)
   2. lambda_telemetry_processor   (Control de idempotencia por id_medicion UUID + Persistencia ACID)
   3. lambda_threshold_evaluator   (Evaluación de reglas SP2.1, episodios SP2.2 y recuperación SP2.3)
   4. lambda_event_generator       (Recomendaciones por periodo apícola, registro_evento y CloudWatch)
   5. lambda_error_handler         (Reintentos acotados maxReceiveCount=3 y derivación a SQS DLQ)
   6. lambda_admin_catalog         (Mantenimiento administrativo de catálogos, instalaciones y reglas CU09)
        │
        ▼  SQL sobre TLS (Puerto 5432, verify-full / global-bundle.pem, Subred Privada VPC)
[Amazon RDS for PostgreSQL 16 (Single-AZ, sin acceso público, respaldos diarios RPO ≤ 24h / RTO ≤ 8h)]
        │
        ├─────────────────────────────────────────────────────────┐
        ▼  Conexión VPC Privada (2 AZs)                           ▼  Pool pg parametrizado + TLS CA
[Amazon Managed Grafana]                                 [Plataforma Web Complementaria APITECH 2.0]
  - Paneles técnicos por apiario y colmena                 - Backend API Node.js 22 + Express 4 + WebSockets
  - Vista SQL: vw_grafana_telemetria_colmenas              - Frontend SPA React 18 + Vite 6 + Recharts + Leaflet
  - Filtros temporales y estado de alertas                 - Asistente Google Gemini + Fallback Local Transparente
```

---

## 2. Estructura del Repositorio `APITECH2`

```text
APITECH2/
├── aws/
│   ├── cloudwatch/dashboard_and_alarms.json       # Dashboard de salud de infraestructura + AWS Budgets ($58.356 CLP/mes)
│   ├── grafana/apitech2_grafana_dashboard.json    # Dashboard técnico oficial para Amazon Managed Grafana
│   ├── iam/least_privilege_policies.json          # 5 políticas IAM separadas por mínimo privilegio
│   ├── iot-core/
│   │   ├── iot_policy_per_device.json             # Política X.509 por identidad individual (${iot:Connection.Thing.ThingName})
│   │   ├── thing_registry_template.json           # Registro de 4 Pasarelas y 12 Nodos Heltec V4
│   │   └── topic_rules.json                       # Regla SQL sobre apitech/+/+/telemetria + Error Action a SQS DLQ
│   ├── lambdas/
│   │   ├── common/db_client.py                    # Cliente PostgreSQL psycopg TLS + Secrets Manager boto3 + JSON Logs
│   │   ├── lambda_validator_normalizer/handler.py # Lambda #1: Validación y normalización de telemetría
│   │   ├── lambda_telemetry_processor/handler.py  # Lambda #2: Idempotencia UUID y persistencia en PostgreSQL
│   │   ├── lambda_threshold_evaluator/handler.py  # Lambda #3: Evaluación de umbrales y episodios de alerta (SP2)
│   │   ├── lambda_event_generator/handler.py      # Lambda #4: Recomendaciones por periodo apícola y CloudWatch
│   │   ├── lambda_error_handler/handler.py        # Lambda #5: Reintentos y envío a Amazon SQS / DLQ
│   │   ├── lambda_admin_catalog/handler.py        # Lambda #6: Mantenimiento de catálogos, instalaciones y reglas (CU09)
│   │   ├── pipeline_orchestrator.py               # Orquestador de ejecución encadenada del pipeline Lambda
│   │   └── tests/test_lambdas.py                  # Suite de pruebas unitarias Python unittest (CP03, CP08, CP09)
│   ├── sqs/sqs_queues_config.json                 # Cola principal + Dead Letter Queue + alarma CloudWatch
│   └── vpc/vpc_network_architecture.json          # Subredes privadas en 2 AZs y Security Groups aislados
├── backend/                                       # Capa API (Puerto 3002), WebSockets (/ws) y Asistente Google Gemini
├── database/
│   ├── certs/README.md                            # Guía de certificado raíz global-bundle.pem para RDS TLS
│   └── migrations/
│       ├── 001_schema_apitech2.sql                # 16 tablas normalizadas (incluye pasarela, instalacion, registro_evento, sqs)
│       ├── 002_politica_retencion_y_auditoria.sql # Vistas para Amazon Managed Grafana y 7 KPIs SMART del PDF
│       └── 003_seed_apitech2.sql                  # 4 apiarios, 4 pasarelas, 12 colmenas, 12 nodos, 12 instalaciones, 60 sensores
├── firmware/
│   ├── contracts/mqtt_telemetry_schema.json       # Contrato JSON Schema del mensaje MQTT
│   ├── nodo_heltec_v4/nodo_heltec_v4.ino          # Contrato C++ Nodo Heltec V4 (ESP32-S3R2 + SHT45 + HX711 + SX1262 915MHz)
│   └── pasarela_heltec_v4/pasarela_heltec_v4.ino  # Contrato C++ Pasarela Heltec V4 (LoRa -> Cola -> WiFiClientSecure MQTT/TLS)
├── frontend/                                      # SPA React 18 + Vite 6 (Puerto 5174) con las 9 vistas del mockup
├── iot-simulator/                                 # Simulador IoT dual (4s Demo / 30m Operativo | Local / AWS IoT MQTT TLS)
└── scripts/
    ├── start-local.ps1                            # Levanta PostgreSQL (5433) + Backend (3002) + Simulador + Frontend (5174)
    ├── stop-local.ps1                             # Detiene limpiamente todos los servicios de APITECH2
    └── aws-inspect.ps1                            # Auditoría en modo de solo lectura con AWS CLI
```

---

## 3. Ejecución Rápida en Modalidad Local

**APITECH2** utiliza puertos propios (`PostgreSQL: 5433`, `Backend: 3002`, `Frontend: 5174`) y su propio directorio de datos (`.pgdata2/`) para no interferir ni sobrescribir en ningún momento a `APITECH` (versión 1).

```powershell
# 1. Iniciar PostgreSQL local (5433) + Backend (3002) + Simulador IoT + Frontend (5174)
powershell -ExecutionPolicy Bypass -File .\scripts\start-local.ps1

# 2. Abrir la plataforma web en el navegador
# http://localhost:5174

# 3. Ejecutar pruebas unitarias de las funciones AWS Lambda en Python
& "$env:USERPROFILE\.local\python\tools\python.exe" -m unittest discover -s .\aws\lambdas\tests -p "test_*.py" -v

# 4. Ejecutar suite integral de pruebas (Backend + PostgreSQL + Idempotencia + SQS DLQ + WebSockets + Gemini)
& "$env:USERPROFILE\.local\node\node.exe" .\backend\scripts\testSuite.js

# 5. Detener servicios locales
powershell -ExecutionPolicy Bypass -File .\scripts\stop-local.ps1
```

---

## 4. Índice de Documentación Técnica Obligatoria

1. [ARQUITECTURA.md](./ARQUITECTURA.md) — Arquitectura general de 5 capas, procesos BPMN y separación de responsabilidades.
2. [ARQUITECTURA_AWS.md](./ARQUITECTURA_AWS.md) — Detalle de los 10 servicios AWS obligatorios, topología VPC y flujo de red.
3. [MODELO_DATOS.md](./MODELO_DATOS.md) — Modelo relacional PostgreSQL (16 entidades), diccionario de datos, índices y vistas Grafana.
4. [CONFIGURACION_LOCAL.md](./CONFIGURACION_LOCAL.md) — Guía paso a paso de ejecución local nativa y con Docker Compose.
5. [CONFIGURACION_AWS.md](./CONFIGURACION_AWS.md) — Resultado real de inspección AWS CLI, restricciones AWS Academy y costos.
6. [TELEMETRIA_IOT.md](./TELEMETRIA_IOT.md) — Convención de topics MQTT, simulador dual (4s / 30m) y los 8 escenarios operativos.
7. [FIRMWARE_HARDWARE.md](./FIRMWARE_HARDWARE.md) — Especificaciones de Heltec WiFi LoRa 32 V4, SHT45, HX711, pines GPIO y contratos C++.
8. [INTEGRACION_GEMINI.md](./INTEGRACION_GEMINI.md) — Asistente Google AI Studio (Gemini), seguridad sin SQL libre y fallback local.
9. [API_DOCUMENTACION.md](./API_DOCUMENTACION.md) — Referencia completa de endpoints REST y eventos WebSocket.
10. [SEGURIDAD.md](./SEGURIDAD.md) — TLS, certificados X.509 por dispositivo, IAM mínimo privilegio, Secrets Manager y VPC privada.
11. [PRUEBAS.md](./PRUEBAS.md) — Resultados verificados de pruebas ejecutadas (Python `unittest`, Backend, PostgreSQL, Simulador, Frontend, AWS).
12. [COMPARATIVA_APITECH1_APITECH2.md](./COMPARATIVA_APITECH1_APITECH2.md) — Comparación objetiva y detallada entre `APITECH` (v1) y `APITECH2` (v2).

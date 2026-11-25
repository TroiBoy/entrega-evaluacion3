# Arquitectura General del Sistema — APITECH 2.0

## 1. Arquitectura de Cinco Capas (Referencia Sección 3.7 del Documento Técnico PDF)

**APITECH 2.0** implementa las cinco capas de responsabilidad definidas en la Figura 13 (páginas 31–32) del documento técnico `Eva4ApiTechJorimCaroAndresDiaz.pdf`, complementadas por la plataforma web interactiva y el asistente de inteligencia artificial:

```mermaid
flowchart TD
    subgraph C1["1. Capa de Percepción y Energía (Colmena)"]
        SHT["Sensor Ambiental Sensirion SHT45 (I2C · ±0.1 °C / ±1% HR)"]
        HX["4x Sensores de Carga 50 kg + Combinador + HX711 (24-bit · 10 SPS)"]
        PWR["Panel Solar 5V 500mA + Batería Li-ion 18650 3000mAh 1S (3.0V - 4.2V)"]
    end

    subgraph C2["2. Capa de Adquisición Local (Nodo Autónomo)"]
        NODE["Heltec WiFi LoRa 32 V4 (ESP32-S3R2 + SX1262)\nFirmware C++ Arduino · Ciclo operativo 30 min · Deep Sleep <= 5 mA\nGenera id_medicion UUID único e incluye id_instalacion"]
    end

    subgraph C3["3. Capa de Pasarela y Conectividad (Zona con Internet)"]
        GW["Pasarela Heltec WiFi LoRa 32 V4 (Fuente USB 5V 1A)\nRecepción LoRa P2P 915 MHz (SF9, BW 125 kHz, CR 4/5)\nAgrega id_pasarela, recibida_en (NTP UTC), RSSI y SNR\nCola persistente acotada (256 mensajes)"]
    end

    subgraph C4["4. Capa de Ingesta y Lógica de Aplicación (AWS Cloud)"]
        IOT["AWS IoT Core (MQTT 3.1.1 sobre TLS 8883 · X.509 individual · QoS 1)\nTopic: apitech/{apiario_id}/{colmena_id}/telemetria"]
        L1["Lambda #1: Validator & Normalizer (Python 3)"]
        L2["Lambda #2: Telemetry Processor & Idempotency (Python 3 + psycopg)"]
        L3["Lambda #3: Threshold Evaluator & Alert Episodes (SP2.1-SP2.3)"]
        L4["Lambda #4: Event & Recommendation Generator + CloudWatch"]
        L5["Lambda #5: Error Handler -> Amazon SQS + Dead Letter Queue"]
        L6["Lambda #6: Admin Catalog & Rules (CU09 IAM)"]
    end

    subgraph C5["5. Capa de Persistencia y Presentación"]
        RDS[("Amazon RDS for PostgreSQL 16\nSubred Privada VPC · SSL/TLS CA Verified")]
        GRAF["Amazon Managed Grafana\nVisualización Técnica Principal (vw_grafana_telemetria_colmenas)"]
        WEB["Plataforma Web Complementaria APITECH 2.0\nBackend Node.js/Express + SPA React/Vite + Google Gemini"]
    end

    SHT --> NODE
    HX --> NODE
    PWR --> NODE
    NODE -->|"LoRa 915 MHz P2P (ACK)"| GW
    GW -->|"Wi-Fi MQTT/TLS 8883 (PUBACK QoS 1)"| IOT
    IOT --> L1
    L1 -->|"Válido"| L2
    L1 -->|"Inválido"| L5
    L2 -->|"Nuevo registro"| L3
    L3 --> L4
    L2 --> RDS
    L3 --> RDS
    L4 --> RDS
    L6 --> RDS
    RDS -->|"Conexión VPC Privada"| GRAF
    RDS -->|"Consultas Parametrizadas TLS"| WEB
```

---

## 2. Procesos de Negocio Soportados (Sección 3.1 BPMN del PDF)

### a) Monitoreo periódico de la colmena (Cada 30 minutos en operación física / 4 segundos en modo demo)
- **SP1.1. Adquirir y preparar las variables**: El nodo Heltec V4 despierta del *Deep Sleep*, energiza los sensores (`PIN_VEXT_CTRL`), lee temperatura y humedad del SHT45, peso calibrado del HX711 y tensión de batería (`bateria_v`), valida las lecturas y asigna un `id_medicion` (UUID v4).
- **SP1.2. Transportar la medición**: El nodo transmite la trama por LoRa P2P en 915 MHz hacia la pasarela central (hasta 3 intentos inmediatos conservando el mismo `id_medicion`). La pasarela envía el ACK LoRa, incorpora `id_pasarela`, `recibida_en` (UTC vía NTP), `rssi_dbm` y `snr_db`, y publica por MQTT 3.1.1 sobre TLS hacia AWS IoT Core con QoS 1. Si no hay Internet, conserva el mensaje en su cola persistente acotada.
- **SP1.3. Validar y almacenar**: AWS IoT Core invoca el pipeline AWS Lambda. `lambda_validator_normalizer` verifica el esquema y el topic; `lambda_telemetry_processor` controla duplicados mediante `id_medicion` e inserta únicamente registros nuevos en PostgreSQL.

### b) Evaluación y gestión de alertas
- **SP2.1. Evaluar las reglas de la colmena**: `lambda_threshold_evaluator` recupera las reglas activas de `configuracion_umbral` y calcula la variación de peso respecto a una lectura comparable de la misma instalación. Los mensajes duplicados o lecturas históricas atrasadas reenviadas desde la cola de la pasarela no sobrescriben el estado actual ni disparan falsas alertas (`CP09`).
- **SP2.2. Abrir o actualizar una alerta**: Si se supera un límite, se abre un episodio en `alerta` (`id_medicion_inicio`) o se actualiza el episodio activo existente (`id_medicion_ultima`, `ocurrencias + 1`), garantizando como máximo una alerta activa por regla/colmena.
- **SP2.3. Registrar la recuperación**: Cuando la variable regresa al intervalo permitido, la Lambda cierra automáticamente la alerta activa (`estado = 'RESUELTA'`, `resuelta_en = CURRENT_TIMESTAMP`, `resuelta_por_sistema = TRUE`), conservando su historial.

### c) Consulta y priorización de inspecciones
- **SP3.1 – SP3.3**: El apicultor consulta los paneles técnicos en **Amazon Managed Grafana** y en la **Plataforma Web APITECH 2.0**, examina tendencias históricas, alertas vigentes y recomendaciones contextualizadas por periodo apícola, y decide fundamentadamente si corresponde realizar una inspección presencial en terreno.

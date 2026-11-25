# Configuración, Inspección y Restricciones AWS — APITECH 2.0

## 1. Resultado Real de la Inspección en Modo de Solo Lectura (AWS CLI)

De conformidad con la **Sección 13 del Prompt Maestro**, se ejecutó una auditoría estrictamente de **solo lectura** utilizando AWS CLI (`aws-cli/2.40.1`) sobre la región `us-east-1`, sin modificar ningún recurso de `COFRIAL` ni de `APITECH` (v1), y sin almacenar credenciales AWS en ningún archivo del repositorio.

### 1.1. Identidad y Cuenta Verificada (`aws sts get-caller-identity`)
- **Account ID**: `533266982633`
- **ARN Autenticado**: `arn:aws:sts::533266982633:assumed-role/voclabs/user3996025=andres.diaz69@inacapmail.cl`
- **Entorno**: **AWS Academy Learner Lab** (`voclabs`)
- **Región**: `us-east-1`

### 1.2. Inventario Detectado por Servicio AWS (Solo Lectura)

| Servicio AWS | Comando Ejecutado | Estado / Recursos Detectados | Observación para APITECH 2.0 |
|---|---|---|---|
| **AWS IoT Core** | `aws iot describe-endpoint --endpoint-type iot:Data-ATS` | **Disponible**. Endpoint activo: `a2jvdwy68yzv30-ats.iot.us-east-1.amazonaws.com`. `things: []`, `rules: []`, `policies: []`, `certificates: []`. | Listo para registrar las 4 pasarelas y 12 nodos Heltec V4 previa autorización explícita. |
| **AWS Lambda** | `aws lambda list-functions` | **Disponible**. 5 funciones del laboratorio detectadas (`MainMonitoringFunction`, `ModLabRole`, `RedshiftOverwatch`, etc.) usando `python3.13` y `arn:aws:iam::533266982633:role/LabRole`. | Permite desplegar las 6 funciones Lambda en Python de APITECH 2.0 asociándolas a `LabRole`. |
| **Amazon RDS** | `aws rds describe-db-instances` | **Disponible**. 2 instancias privadas activas: `cofrial-db` (PostgreSQL, `db.t3.micro`, `PubliclyAccessible=false`) y `apitech-rds` (de APITECH 1, `db.t3.micro`, `PubliclyAccessible=false`). | **Intactas (no modificadas)**. APITECH 2.0 puede desplegar una instancia dedicada `apitech2-rds` o un esquema aislado previa autorización. |
| **Amazon EC2** | `aws ec2 describe-instances` | **Disponible**. 2 instancias `t3.small` en estado `running`: `EC2-Cofrial-Production` (`i-0c13099b0e3e0a684`) y `ApiTech-Production-EC2` (`i-0ca5156b718a91b23`). | **Intactas (no modificadas)**. |
| **Amazon VPC y Subredes** | `aws ec2 describe-vpcs`, `describe-subnets`, `describe-security-groups` | **Disponible**. VPC `vpc-004cc752a4d9a30c0` (`172.31.0.0/16`) con 6 subredes en `us-east-1a`..`1f` y Security Groups de COFRIAL y APITECH 1. | Preparada plantilla `aws/vpc/vpc_network_architecture.json` para Security Groups aislados de APITECH 2.0. |
| **Amazon SQS** | `aws sqs list-queues` | **Disponible** (0 colas actuales). | Preparada configuración de `apitech2-telemetry-queue` y `apitech2-telemetry-dlq` (`aws/sqs/sqs_queues_config.json`). |
| **Amazon CloudWatch** | `aws cloudwatch describe-alarms`, `aws logs describe-log-groups` | **Disponible** (3 grupos de logs de Lambda existentes, 0 alarmas activas). | Preparados dashboard `ApiTech2-Infrastructure-Health` y alarmas operativas. |
| **AWS Secrets Manager** | `aws secretsmanager list-secrets` | **Disponible en lectura** (`SecretList: []`). | Soportado en `aws/lambdas/common/db_client.py` con fallback seguro a variables de entorno. |
| **AWS IAM** | `aws iam get-role --role-name LabRole` | **Restringido a `LabRole`** (`arn:aws:iam::533266982633:role/LabRole`). | En AWS Academy Learner Lab no se permite crear roles IAM propios; todas las Lambdas deben usar `LabRole`. |
| **Amazon Managed Grafana** | `aws grafana list-workspaces` | **RESTRINGIDO POR AWS ACADEMY (`AccessDeniedException`)**: `is not authorized to perform: grafana:ListWorkspaces because no identity-based policy allows the grafana:ListWorkspaces action`. | Limitación real verificada del laboratorio `voclabs`. Se deja el dashboard JSON oficial preparado (`aws/grafana/apitech2_grafana_dashboard.json`) y la vista SQL `vw_grafana_telemetria_colmenas`. |

---

## 2. Propuesta de Despliegue y Costos Potenciales (Requiere Autorización Explícita)

> **Cumplimiento de la Sección 13 (Autorización):** No se ha creado, modificado ni eliminado ningún recurso en la cuenta AWS durante el desarrollo de **APITECH2**. Antes de ejecutar cualquier comando de creación, se presenta el detalle de recursos, costos estimados e impacto:

| Servicio AWS | Recurso Propuesto | Región | Configuración | Costo Potencial Estimado | Permisos Requeridos | Impacto |
|---|---|---|---|---|---|---|
| **AWS IoT Core** | 4 Pasarelas + 12 Nodos Thing Registry, Certificados X.509, Política `ApiTech2IoTDevicePolicy` y Regla `apitech2_telemetry_ingest_rule` | `us-east-1` | MQTT/TLS 8883, QoS 1 | ~\$0.08 USD / mes (piloto de 12 colmenas cada 30 min = 17.280 msgs/mes; ~\$1.00 por millón de mensajes) | `iot:CreateThing`, `iot:CreateKeysAndCertificate`, `iot:CreatePolicy`, `iot:CreateTopicRule` | Bajo costo; habilita ingesta MQTT nativa. |
| **AWS Lambda** | 6 funciones Python 3.12 (`apitech2-telemetry-validator`, `processor`, `threshold-evaluator`, `event-generator`, `error-handler`, `admin-catalog`) | `us-east-1` | 256 MB RAM, timeout 15s, rol `LabRole`, VPC privada | **\$0.00 USD / mes** dentro de la capa gratuita (1 millón de invocaciones gratuitas/mes) | `lambda:CreateFunction` con `arn:aws:iam::533266982633:role/LabRole` | Sin costo en volumen de piloto. |
| **Amazon SQS** | `apitech2-telemetry-queue` + `apitech2-telemetry-dlq` | `us-east-1` | Standard Queue, retención 4/14 días, `maxReceiveCount=3` | **\$0.00 USD / mes** (primer millón de solicitudes SQS gratis) | `sqs:CreateQueue` | Tolerancia a fallos y DLQ sin costo adicional. |
| **Amazon RDS PostgreSQL** | `apitech2-rds` | `us-east-1` | PostgreSQL 16, `db.t3.micro` Single-AZ, 20 GiB gp3, `PubliclyAccessible=false`, respaldos 7 días | ~\$14.50 – \$16.80 USD / mes encendida 24/7 (consume créditos de AWS Academy por hora) | `rds:CreateDBInstance`, `ec2:CreateSecurityGroup` | **Mayor impacto en créditos del laboratorio**. |
| **AWS Secrets Manager** | `apitech2/production/rds-postgres` | `us-east-1` | 1 secreto JSON con credenciales RDS | \$0.40 USD / secreto / mes + \$0.05 por 10.000 llamadas API | `secretsmanager:CreateSecret` | Bajo costo (opcional usar variables de entorno en Lambda para ahorrar en laboratorio). |
| **Amazon Managed Grafana** | Workspace `apitech2-grafana` | `us-east-1` | Conexión VPC en 2 subredes privadas | \$9.00 USD / editor activo / mes + \$5.00 USD / visor / mes (en cuentas estándar) | `grafana:CreateWorkspace` (**Bloqueado en AWS Academy `voclabs`**) | No desplegable en Learner Lab por política IAM de `voclabs`; sustituible localmente por Grafana OSS en contenedor conectado a `vw_grafana_telemetria_colmenas`. |

> **Comparación con el presupuesto del PDF (página 12):** El documento técnico reserva **\$58.356 CLP mensuales** (~60 USD/mes) para servicios AWS, cifra que cubre holgadamente la operación continua 24/7 de RDS Single-AZ + IoT Core + Lambda + SQS + Secrets Manager + CloudWatch + Grafana en una cuenta AWS estándar.

// C/C++
#include <iostream>
#include <list>
#include <string>
#include <cstring>

// Espressif
#include "WiFi.h"
#include "esp_now.h"
#include "Wire.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/timers.h"
#include "freertos/semphr.h"
#include "esp_log.h"
#include "esp_wifi.h"

// Custom
#include "PubSubClient.h"

// BraiaDataStructs
#include "C:\GitHub\LineFollower_Braia_Code\ESP-IDF\main\dataStructs.hpp"

using namespace std;
// MACs ESPs:

// Braia: 24:6F:28:B2:23:D0
// CCenter: 24:6F:28:9D:7C:44

struct sendMQTT
{
  const char *path;
  String value;

  sendMQTT(const char *_path, String _value) : path(_path), value(_value){};
  sendMQTT(){};
};

uint8_t broadcastAddress[] = {0x24, 0x6F, 0x28, 0xB2, 0x23, 0xD0};
esp_now_peer_info_t peerInfo;

const char *ssid = "TT-Server";
const char *password = "W2knaft@123";

TaskHandle_t xTaskMQTTSend;
TaskHandle_t xTaskMQTTPrepare;
TaskHandle_t xTaskESPNOW;

WiFiClient espClient;

// Listas para envio de dados ESP-NOW
list<valuesSamples> valuesToESPNOW;
list<paramsSamples> paramsToESPNOW;

// Listas de recebimento de dados ESP-NOW
list<valuesSamples> valuesFromESPNOW;
list<paramsSamples> paramsFromESPNOW;

// Objetos de recebimento de dados ESP-NOW
valuesSamples valueFromESPNOW;
paramsSamples paramFromESPNOW;

// Objetos de dados validos
valuesSamples valueValid;
paramsSamples paramValid;

list<sendMQTT> sendMQTTList;

SemaphoreHandle_t xSemaphoreCarValuesFromESPNOW = NULL;
SemaphoreHandle_t xSemaphoreCarParamsFromESPNOW = NULL;

SemaphoreHandle_t xSemaphoreValueValid = NULL;
SemaphoreHandle_t xSemaphoreParamValid = NULL;

SemaphoreHandle_t xSemaphoreSendMQTTList = NULL;

SemaphoreHandle_t xSemaphoreCarValuesToESPNOW = NULL;
SemaphoreHandle_t xSemaphoreCarParamsToESPNOW = NULL;

void takeSample(list<valuesSamples> *list, valuesCar *carVal)
{
  if (xSemaphoreTake(xSemaphoreValueValid, (TickType_t)10) == pdTRUE && xSemaphoreTake(xSemaphoreCarValuesToESPNOW, (TickType_t)10) == pdTRUE)
  {
    if (list->size() < 100)
      list->emplace_back(valuesSamples(*carVal, esp_log_timestamp()));

    xSemaphoreGive(xSemaphoreValueValid);
    xSemaphoreGive(xSemaphoreCarValuesToESPNOW);
  }
}

void takeSample(list<paramsSamples> *list, paramsCar *carParam)
{
  if (xSemaphoreTake(xSemaphoreParamValid, (TickType_t)10) == pdTRUE && xSemaphoreTake(xSemaphoreCarParamsToESPNOW, (TickType_t)10) == pdTRUE)
  {
    if (list->size() < 100)
      list->emplace_back(paramsSamples(*carParam, esp_log_timestamp()));

    xSemaphoreGive(xSemaphoreParamValid);
    xSemaphoreGive(xSemaphoreCarParamsToESPNOW);
  }
}

void OnDataSent(const uint8_t *mac_addr, esp_now_send_status_t status)
{
}

void OnDataRecv(const uint8_t *mac, const uint8_t *incomingData, int len)
{
  if (len == sizeof(enum_espNOW))
  {
    enum_espNOW cmdESPNOW;
    memcpy(&cmdESPNOW, incomingData, sizeof(cmdESPNOW));

    ESP_LOGD("ESP-NOW", "Bytes cmdESPNOW: %d", len);

    switch (cmdESPNOW)
    {
    case REQUEST_CARVALUES:
      ESP_LOGD("ESP-NOW", "Valores solicitados pelo robô, adicioando na fila");
      takeSample(&valuesToESPNOW, &valueValid.carVal);
      ESP_LOGD("ESP-NOW", "Adicionado com sucesso");

      break;

    case REQUEST_CARPARAM:
      ESP_LOGD("ESP-NOW", "Parâmetros solicitados pelo robô, adicioando na fila");
      takeSample(&paramsToESPNOW, &paramValid.carParam);
      ESP_LOGD("ESP-NOW", "Adicionado com sucesso");

      break;

    default:
      break;
    }
  }

  else if (len == sizeof(valueFromESPNOW))
  {
    ESP_LOGD("ESP-NOW", "Sample de valores recebido, bytes: %d", len);

    memcpy(&valueFromESPNOW, incomingData, sizeof(valueFromESPNOW));

    ESP_LOGD("ESP-NOW", "Tentando salvar sample na lista");
    if (xSemaphoreTake(xSemaphoreCarValuesFromESPNOW, (TickType_t)40) == pdTRUE)
    {
      valuesFromESPNOW.push_back(valueFromESPNOW);

      ESP_LOGD("ESP-NOW", "Sample salvo com sucesso!");

      xSemaphoreGive(xSemaphoreCarValuesFromESPNOW);
    }
  }

  else if (len == sizeof(paramFromESPNOW))
  {
    ESP_LOGD("ESP-NOW", "Sample de parâmetros recebido, bytes: %d", len);

    memcpy(&paramFromESPNOW, incomingData, sizeof(paramFromESPNOW));

    ESP_LOGD("ESP-NOW", "Tentando salvar sample na lista");
    if (xSemaphoreTake(xSemaphoreCarParamsFromESPNOW, (TickType_t)40) == pdTRUE)
    {
      paramsFromESPNOW.push_back(paramFromESPNOW);

      ESP_LOGD("ESP-NOW", "Sample salvo com sucesso!");

      String maxsmins = "";
      for (uint8_t i = 0; i < 8; i++)
        maxsmins += String(paramsFromESPNOW.back().carParam.sArray.minChannel[i]) + ' ';

      maxsmins += '\n';

      for (uint8_t i = 0; i < 8; i++)
        maxsmins += String(paramsFromESPNOW.back().carParam.sArray.maxChannel[i]) + ' ';

      ESP_LOGD("QTRSensors", "\n%s", maxsmins.c_str());

      maxsmins = "";
      for (uint8_t i = 0; i < 2; i++)
        maxsmins += String(paramsFromESPNOW.back().carParam.sLat.minChannel[i]) + ' ';

      maxsmins += '\n';

      for (uint8_t i = 0; i < 2; i++)
        maxsmins += String(paramsFromESPNOW.back().carParam.sLat.maxChannel[i]) + ' ';

      ESP_LOGD("PARAM-QTRSENSORS", "\n%s", maxsmins.c_str());

      ESP_LOGD("PARAM-SPEED", "Speed (Curva) -> Max: %d | Min: %d | Base: %d", paramsFromESPNOW.back().carParam.speed.curva.max, paramsFromESPNOW.back().carParam.speed.curva.min, paramsFromESPNOW.back().carParam.speed.curva.base);

      xSemaphoreGive(xSemaphoreCarParamsFromESPNOW);
    }
  }
}

void setup_wifi()
{
  delay(10);
  // We start by connecting to a WiFi network

  ESP_LOGD("Wi-Fi", "Connecting to %s", ssid);

  WiFi.persistent(false);
  WiFi.mode(WIFI_AP_STA);
  WiFi.setHostname("BraiaCentral");
  WiFi.softAPsetHostname("BraiaCentral");
  esp_wifi_set_ps(WIFI_PS_NONE);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED)
  {
    vTaskDelay(500 / portTICK_PERIOD_MS);
    ESP_LOGD("Wi-Fi", ".");
  }

  ESP_LOGD("Wi-Fi", "WiFi connected");
  ESP_LOGD("Wi-Fi", "IP address: %s", WiFi.localIP().toString().c_str());
  ESP_LOGD("Wi-Fi", "Canal: %d", WiFi.channel());
}

void callback(char *topic, byte *message, unsigned int length)
{
  string strTopic = string(topic);
  message[length] = '\0';
  string strMessage = string((char *)message);

  ESP_LOGD("MQTT", "Msg recebida %s - %d - %s", topic, length, strMessage.c_str());

  if (strTopic.find("param") != string::npos)
  {

    enum_parametros linha = strTopic.find("reta") != string::npos ? RETA : CURVA;

    if (strTopic.find("speed", 6) != string::npos)
    {
      paramSpeedVals *speed = linha == RETA ? &paramValid.carParam.speed.reta : &paramValid.carParam.speed.curva;

      if (strTopic.find("max", 12) != string::npos)
      {
        speed->max = atoi(strMessage.c_str());
        ESP_LOGD("MQTT", "Vel %s max: %d", linha == RETA ? "reta" : "curva", speed->max);
      }
      else if (strTopic.find("min", 12) != string::npos)
      {
        speed->min = atoi(strMessage.c_str());
        ESP_LOGD("MQTT", "Vel %s min: %d", linha == RETA ? "reta" : "curva", speed->min);
      }
      else if (strTopic.find("base", 12) != string::npos)
      {
        speed->base = atoi(strMessage.c_str());
        ESP_LOGD("MQTT", "Vel %s base: %d", linha == RETA ? "reta" : "curva", speed->base);
      }
    }
    else if (strTopic.find("PID", 6) != string::npos)
    {
      paramPIDVals *PID = linha == RETA ? &paramValid.carParam.PID.reta : &paramValid.carParam.PID.curva;

      if (strTopic.find("Kp", 12) != string::npos)
      {
        PID->Kp = atof(strMessage.c_str());
        ESP_LOGD("MQTT", "PID %s Kp: %f", linha == RETA ? "reta" : "curva", PID->Kp);
      }
      else if (strTopic.find("Ki", 12) != string::npos)
      {
        PID->Ki = atof(strMessage.c_str());
        ESP_LOGD("MQTT", "PID %s Ki: %f", linha == RETA ? "reta" : "curva", PID->Ki);
      }
      else if (strTopic.find("Kd", 12) != string::npos)
      {
        PID->Kd = atof(strMessage.c_str());
        ESP_LOGD("MQTT", "PID %s Kd: %f", linha == RETA ? "reta" : "curva", PID->Kd);
      }
      else if (strTopic.find("setpoint", 12) != string::npos)
      {
        PID->setpoint = atoi(strMessage.c_str());
        ESP_LOGD("MQTT", "PID %s setpoint: %d", linha == RETA ? "reta" : "curva", PID->setpoint);
      }
    }
  }
  else if (strTopic.find("value") >= 0)
  {
  }
}

void reconnectMQTT(PubSubClient *client)
{
  while (!client->connected())
  {
    //ESP_LOGD("MQTT", "Attempting MQTT connection...");

    if (client->connect("ESP8266Client"))
    {
      //ESP_LOGD("MQTT", "connected");
      client->subscribe("toC/param/#");
    }
    else
    {
      ESP_LOGE("MQTT", "failed, rc=%d try again in 5 seconds", client->state());
      vTaskDelay(5000 / portTICK_PERIOD_MS);
    }
  }
}

void vTaskMQTTPrepare(void *pvParameters)
{
  valuesSamples tempdataCar;

  for (;;)
  {
    // Valores
    if (xSemaphoreTake(xSemaphoreCarValuesFromESPNOW, (TickType_t)10) == pdTRUE)
    {
      if (valuesFromESPNOW.size() > 1)
      {
        tempdataCar = valuesFromESPNOW.front();

        xSemaphoreGive(xSemaphoreCarValuesFromESPNOW);

        if (xSemaphoreTake(xSemaphoreSendMQTTList, (TickType_t)10) == pdTRUE)
        {
          sendMQTTList.emplace_back("runtime", String(tempdataCar.time));

          sendMQTTList.emplace_back("sensor/array/line", String(tempdataCar.carVal.sArray.line));
          sendMQTTList.emplace_back("sensor/encoder/esq", String(tempdataCar.carVal.motEncs.encEsq));
          sendMQTTList.emplace_back("sensor/encoder/dir", String(tempdataCar.carVal.motEncs.encDir));

          sendMQTTList.emplace_back("values/latMarks/leftPassed", String(tempdataCar.carVal.latMarks.leftPassed));
          sendMQTTList.emplace_back("values/latMarks/rightPassed", String(tempdataCar.carVal.latMarks.rightPassed));
          sendMQTTList.emplace_back("values/latMarks/sLatDir", String(tempdataCar.carVal.latMarks.sLatDir));
          sendMQTTList.emplace_back("values/latMarks/sLatEsq", String(tempdataCar.carVal.latMarks.sLatEsq));

          sendMQTTList.emplace_back("values/speed/left", String(tempdataCar.carVal.speed.left));
          sendMQTTList.emplace_back("values/speed/right", String(tempdataCar.carVal.speed.right));

          String arrayChannel = "";
          arrayChannel += tempdataCar.carVal.sArray.channel[0];
          for (uint8_t i = 1; i < 8; i++)
          {
            arrayChannel += ",";
            arrayChannel += String(tempdataCar.carVal.sArray.channel[i]);
          }

          sendMQTTList.emplace_back("sensor/array/channel", arrayChannel);

          xSemaphoreGive(xSemaphoreSendMQTTList);
        }

        if (xSemaphoreTake(xSemaphoreCarValuesFromESPNOW, (TickType_t)10) == pdTRUE)
        {
          valuesFromESPNOW.pop_front();

          xSemaphoreGive(xSemaphoreCarValuesFromESPNOW);
        }
      }
      else
      {
        xSemaphoreGive(xSemaphoreCarValuesFromESPNOW);
      }
    }

    vTaskDelay(1);

    // Parâmetros
    if (xSemaphoreTake(xSemaphoreCarParamsFromESPNOW, (TickType_t)10) == pdTRUE)
    {
      if (paramsFromESPNOW.size() > 0)
      {
        ESP_LOGD("PARAMS Manager", "Existem samples de parâmetro na lista");
        if (paramsFromESPNOW.front().carParam.validParams & (PID_VALID | SPEED_VALID | SARRAY_VALID | SLAT_VALID))
        {
          if (xSemaphoreTake(xSemaphoreParamValid, (TickType_t)10) == pdTRUE)
          {
            ESP_LOGD("PARAMS Manager", "Sample válido, quardando e enviando via MQTT");
            memcpy(&paramValid, &paramsFromESPNOW.front(), sizeof(paramValid));
            paramsFromESPNOW.pop_front();
            xSemaphoreGive(xSemaphoreCarParamsFromESPNOW);
            ESP_LOGD("PARAMS Manager", "Sample guardado");

            if (xSemaphoreTake(xSemaphoreSendMQTTList, (TickType_t)10) == pdTRUE)
            {
              //PID
              sendMQTTList.emplace_back("params/PID/curva/setpoint", String(paramValid.carParam.PID.curva.setpoint));
              sendMQTTList.emplace_back("params/PID/curva/Kp", String(paramValid.carParam.PID.curva.Kp));
              sendMQTTList.emplace_back("params/PID/curva/Ki", String(paramValid.carParam.PID.curva.Ki));
              sendMQTTList.emplace_back("params/PID/curva/Kd", String(paramValid.carParam.PID.curva.Kd));

              sendMQTTList.emplace_back("params/PID/reta/setpoint", String(paramValid.carParam.PID.reta.setpoint));
              sendMQTTList.emplace_back("params/PID/reta/Kp", String(paramValid.carParam.PID.reta.Kp));
              sendMQTTList.emplace_back("params/PID/reta/Ki", String(paramValid.carParam.PID.reta.Ki));
              sendMQTTList.emplace_back("params/PID/reta/Kd", String(paramValid.carParam.PID.reta.Kd));

              //Speed
              sendMQTTList.emplace_back("params/speed/curva/max", String(paramValid.carParam.speed.curva.max));
              sendMQTTList.emplace_back("params/speed/curva/min", String(paramValid.carParam.speed.curva.min));
              sendMQTTList.emplace_back("params/speed/curva/base", String(paramValid.carParam.speed.curva.base));

              sendMQTTList.emplace_back("params/speed/reta/max", String(paramValid.carParam.speed.reta.max));
              sendMQTTList.emplace_back("params/speed/reta/min", String(paramValid.carParam.speed.reta.min));
              sendMQTTList.emplace_back("params/speed/reta/base", String(paramValid.carParam.speed.reta.base));

              xSemaphoreGive(xSemaphoreSendMQTTList);
              ESP_LOGD("PARAMS Manager", "Sample inserido na fila para envio ao MQTT");
            }
            xSemaphoreGive(xSemaphoreParamValid);
          }
          else
          {
            xSemaphoreGive(xSemaphoreCarParamsFromESPNOW);
          }
        }
        else
        {
          ESP_LOGD("PARAMS Manager", "Sample inválido, descartando");
          paramsFromESPNOW.pop_front();
          xSemaphoreGive(xSemaphoreCarParamsFromESPNOW);
        }
      }
      else
      {
        xSemaphoreGive(xSemaphoreCarParamsFromESPNOW);
      }
    }

    vTaskDelay(1);
  }
}

void vTaskMQTTSend(void *pvParameters)
{
  const char *mqtt_server = WiFi.gatewayIP().toString().c_str();
  PubSubClient client(espClient);

  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);

  for (;;)
  {
    if (!client.connected())
      reconnectMQTT(&client);

    client.loop();

    if (xSemaphoreTake(xSemaphoreSendMQTTList, (TickType_t)10) == pdTRUE)
    {
      for (uint16_t i = 0; i < sendMQTTList.size(); i++)
      {
        if (client.publish(sendMQTTList.front().path, sendMQTTList.front().value.c_str()))
        {
          //ESP_LOGD("MQTT", "%s | %s", sendMQTTList.front().path, sendMQTTList.front().value.c_str());
          sendMQTTList.pop_front();
        }
      }
      xSemaphoreGive(xSemaphoreSendMQTTList);
    }

    vTaskDelay(50 / portTICK_PERIOD_MS);
  }
}

void vTaskESPNOW(void *pvParameters)
{
  //valuesCar *carVal = &((dataCar *)pvParameters)->values;

  enum_espNOW cmdESPNOW;

  if (esp_now_init() != 0)
    ESP_LOGD("ESP-NOW", "Falha ao iniciar");

  // Once ESPNow is successfully Init, we will register for Send CB to
  // get the status of Trasnmitted packet
  esp_now_register_send_cb(OnDataSent);

  // Register peer
  memcpy(peerInfo.peer_addr, broadcastAddress, 6);
  peerInfo.channel = 11;
  peerInfo.encrypt = false;
  peerInfo.ifidx = ESP_IF_WIFI_STA;

  // Add peer
  if (esp_now_add_peer(&peerInfo) != ESP_OK)
  {
    ESP_LOGD("ESP-NOW", "Failed to add peer");
    return;
  }

  esp_now_register_recv_cb(OnDataRecv);

  // Requisita os parametros para o robô
  ESP_LOGD("ESP-NOW", "Solicitando parâmetros para o Robô");
  cmdESPNOW = REQUEST_CARPARAM;
  esp_now_send(broadcastAddress, (uint8_t *)&cmdESPNOW, sizeof(cmdESPNOW));

  ESP_LOGD("ESP-NOW", "Aguardando 3s");
  vTaskDelay(3000 / portTICK_PERIOD_MS);

  TickType_t xLastWakeTime = xTaskGetTickCount();
  for (;;)
  {
    // Envio de valores
    if (xSemaphoreTake(xSemaphoreCarValuesToESPNOW, (TickType_t)5) == pdTRUE)
    {
      if (valuesToESPNOW.size() > 0)
        if (esp_now_send(broadcastAddress, (uint8_t *)&valuesToESPNOW.front(), sizeof(valuesToESPNOW.front())) == ESP_OK)
        {
          ESP_LOGD("ESP-NOW", "Sample de valores enviado para o robô, bytes: %d", sizeof(valuesToESPNOW.front()));
          valuesToESPNOW.pop_front();
        }

      xSemaphoreGive(xSemaphoreCarValuesToESPNOW);
    }

    vTaskDelayUntil(&xLastWakeTime, 100 / portTICK_PERIOD_MS);

    // Envio de parâmetros
    if (xSemaphoreTake(xSemaphoreCarParamsToESPNOW, (TickType_t)1) == pdTRUE)
    {
      if (paramsToESPNOW.size() > 0)
        if (esp_now_send(broadcastAddress, (uint8_t *)&paramsToESPNOW.front(), sizeof(paramsToESPNOW.front())) == ESP_OK)
        {
          ESP_LOGD("ESP-NOW", "Sample de parâmetros enviado para o robô, bytes: %d", sizeof(paramsToESPNOW.front()));
          paramsToESPNOW.pop_front();
        }
      xSemaphoreGive(xSemaphoreCarParamsToESPNOW);
    }

    vTaskDelayUntil(&xLastWakeTime, 100 / portTICK_PERIOD_MS);
  }
}

void setup()
{
  setup_wifi();

  vSemaphoreCreateBinary(xSemaphoreSendMQTTList);
  vSemaphoreCreateBinary(xSemaphoreCarValuesFromESPNOW);
  vSemaphoreCreateBinary(xSemaphoreCarParamsFromESPNOW);
  vSemaphoreCreateBinary(xSemaphoreValueValid);
  vSemaphoreCreateBinary(xSemaphoreParamValid);
  vSemaphoreCreateBinary(xSemaphoreCarValuesToESPNOW);
  vSemaphoreCreateBinary(xSemaphoreCarParamsToESPNOW);

  xTaskCreate(vTaskESPNOW, "TaskESPNOW", 10000, NULL, 10, &xTaskESPNOW);
  xTaskCreate(vTaskMQTTPrepare, "TaskMQTTPrepare", 10000, NULL, 8, &xTaskMQTTPrepare);
  xTaskCreate(vTaskMQTTSend, "TaskMQTTSend", 10000, NULL, 9, &xTaskMQTTSend);
}

void loop()
{
  vTaskDelay(1);
}
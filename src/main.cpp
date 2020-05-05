#include <EasyButton.h>
#include <LinkedList.h>
#include <LiquidCrystal_I2C.h>
#include <Wire.h>
#include <WiFi.h>
#include <esp_now.h>
#include <list>
#include <PubSubClient.h>

//#define DEBUG ;

using namespace std;
// MACs ESPs:

// Braia: 24:6F:28:B2:23:D0
// CCenter: 24:6F:28:9D:7C:44

uint8_t broadcastAddress[] = {0x24, 0x6F, 0x28, 0xB2, 0x23, 0xD0};
esp_now_peer_info_t peerInfo;

// Replace the next variables with your SSID/Password combination
const char *ssid = "RFREITAS";
const char *password = "941138872";

const char *mqtt_server = "192.168.15.84";

// Initializes the espClient. You should change the espClient name if you have multiple ESPs running in your home automation system
WiFiClient espClient;
PubSubClient client(espClient);

enum defaultChars
{
  lcd_setaEsq = B0111111,
  lcd_setaDir = B01111110,
  lcd_pontoCentro = B10100101,
};

enum Buttons
{
  BTN_NONE = 0,
  BTN_UP = 17,
  BTN_DOWN = 18,
  BTN_LEFT = 23,
  BTN_RIGHT = 5,
  BTN_CANCEL = 4,
  BTN_ACCEPT = 15
};

byte customChar[] = {B00000, B00000, B00000, B01110,
                     B01110, B00000, B00000, B00000};

class Menu
{
public:
  String name = "";
  void *function = NULL;
  LinkedList<Menu *> MenuItens = LinkedList<Menu *>();

  Menu(String _name) { name = _name; }
};

enum CarStatus
{
  IN_CURVE = 0,
  IN_LINE = 1
};

struct valuesS
{
  uint16_t *channel;
  int16_t line;
};

struct valuesEnc
{
  int32_t encDir = 0;
  int32_t encEsq = 0;
};

struct valuesMarks
{
  int16_t leftPassed = 0;
  int16_t rightPassed = 0;
  bool sLatEsq;
  bool sLatDir;
};

struct valuesPID
{
  // Parâmetros
  int16_t *input = NULL;
  float output = 0;
};

struct valuesSpeed
{
  int8_t right = 0;
  int8_t left = 0;
};

struct paramSpeed
{
  int8_t max = 80;
  int8_t min = 5;
  int8_t base = 40;
};

struct paramPID
{
  int16_t setpoint = 3500;
  float Kp = 0.01;
  float Ki = 0.00;
  float Kd = 0.10;
};

struct valuesCar
{
  int8_t state = 1; // 0: parado, 1: linha, 2: curva
  valuesSpeed speed;
  valuesPID PID;
  valuesMarks latMarks;
  valuesEnc motEncs;
  valuesS sLat;
  valuesS sArray;
};

struct paramsCar
{
  paramSpeed speed;
  paramPID PID;
};

struct dataCar
{
  valuesCar values;
  paramsCar params;
};

struct valuesSamples
{
  valuesCar carVal;
  uint32_t time;

  valuesSamples(valuesCar carVal) : carVal(carVal)
  {
    time = esp_log_timestamp();
  };

  valuesSamples(){};
};

valuesSamples incomingdataCar;
valuesSamples tempdataCar;
list<valuesSamples> dataCarList;

// Inicializa o display no endereco 0x27
LiquidCrystal_I2C lcd(0x3F, 2, 1, 0, 4, 5, 6, 7, 3, POSITIVE);

EasyButton upBtn(BTN_UP, 40, true, false);
EasyButton downBtn(BTN_DOWN, 40, true, true);
EasyButton leftBtn(BTN_LEFT, 40, true, true);
EasyButton rightBtn(BTN_RIGHT, 40, true, false);
EasyButton cancelBtn(BTN_CANCEL, 40, true, true);
EasyButton acceptBtn(BTN_ACCEPT, 40, true, false);

Buttons get_pressed_button()
{
  while (1)
  {
    upBtn.read();
    downBtn.read();
    leftBtn.read();
    rightBtn.read();
    cancelBtn.read();
    acceptBtn.read();

    if (upBtn.wasPressed())
      return BTN_UP;
    else if (downBtn.wasPressed())
      return BTN_DOWN;
    else if (leftBtn.wasPressed())
      return BTN_LEFT;
    else if (rightBtn.wasPressed())
      return BTN_RIGHT;
    else if (cancelBtn.wasPressed())
      return BTN_CANCEL;
    else if (acceptBtn.wasPressed())
      return BTN_ACCEPT;
  }
}

void draw_menu_itens(Menu *actualMenu)
{
  lcd.clear();

  short itens = 0, actItem = 0, firstItem = 0, pssBtn = BTN_NONE;

  // Guarda a quantidade de itens do menu
  itens = actualMenu->MenuItens.size();
#ifdef DEBUG
  Serial.printf("Quantidade de itens no menu: %d\n", itens);
#endif

  // Desenha o Titulo
  lcd.setCursor(0, 0);
  lcd.printf("Menu: %s", actualMenu->name.c_str());
  lcd.setCursor(0, 1);
  lcd.print("--------------------");

  do
  {
    // Limpa os espaços
    lcd.setCursor(0, 2);
    lcd.print("            ");
    lcd.setCursor(0, 3);
    lcd.print("            ");

    // Escreve o primeiro item
    lcd.setCursor(0, 2);
    lcd.print(actItem == 0 ? (char)lcd_setaDir : (char)lcd_pontoCentro);
    lcd.print(actualMenu->MenuItens.get(firstItem)->name.c_str());

    // Escreve o segundo item
    lcd.setCursor(0, 3);
    lcd.print(actItem == 1 ? (char)lcd_setaDir : (char)lcd_pontoCentro);
    lcd.print(actualMenu->MenuItens.get(firstItem + 1)->name.c_str());

    // Chama função para verificar botões
    pssBtn = get_pressed_button();

    switch (pssBtn)
    {
    case BTN_UP:
      if (actItem == 1)
        actItem--;
      else
        firstItem = firstItem == 0 ? firstItem : firstItem - 1;
      break;
    case BTN_DOWN:
      if (actItem == 0)
        actItem++;
      else
        firstItem = (firstItem + 1) == (itens - 1) ? firstItem : firstItem + 1;
      break;

    default:
      break;
    }

  } while (pssBtn != BTN_CANCEL);
}

void draw_menu_insert_mac(Menu *actualMenu)
{
  lcd.clear();

  short itens = 0, actItem = 0, firstItem = 0, pssBtn = BTN_NONE;
  char macAddress[12] = {'0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0'};

  // Guarda a quantidade de itens do menu
  itens = actualMenu->MenuItens.size();
#ifdef DEBUG
  Serial.printf("Quantidade de itens no menu: %d\n", itens);
#endif

  // Desenha o Titulo
  lcd.setCursor(0, 0);
  lcd.printf("Robo: MAC");
  lcd.setCursor(0, 1);
  lcd.print("--------------------");

  do
  {
    lcd.noBlink();

    lcd.setCursor(0, 3);
    lcd.print("            ");

    // Escreve o primeiro item
    lcd.setCursor(0, 2);
    lcd.print(actItem == 0 ? (char)lcd_setaDir : (char)lcd_pontoCentro);
    lcd.print(actualMenu->MenuItens.get(firstItem)->name.c_str());

    // Escreve o segundo item
    lcd.setCursor(0, 3);
    lcd.print(actItem == 1 ? (char)lcd_setaDir : (char)lcd_pontoCentro);
    lcd.print(actualMenu->MenuItens.get(firstItem + 1)->name.c_str());

    lcd.setCursor(1, 2);
    lcd.printf("%c%c:%c%c:%c%c:%c%c%c%c:%c%c", macAddress[0], macAddress[1], macAddress[2], macAddress[3], macAddress[4], macAddress[5], macAddress[6], macAddress[7], macAddress[8], macAddress[9], macAddress[10], macAddress[11]);

    lcd.blink();

    // Chama função para verificar botões
    pssBtn = get_pressed_button();

    switch (pssBtn)
    {
    case BTN_UP:
      if (actItem == 1)
        actItem--;
      else
        firstItem = firstItem == 0 ? firstItem : firstItem - 1;
      break;
    case BTN_DOWN:
      if (actItem == 0)
        actItem++;
      else
        firstItem = (firstItem + 1) == (itens - 1) ? firstItem : firstItem + 1;
      break;

    default:
      break;
    }

  } while (pssBtn != BTN_CANCEL);
}

// Callback when data is sent
void OnDataSent(const uint8_t *mac_addr, esp_now_send_status_t status)
{
#ifdef DEBUG
  Serial.print("\r\nLast Packet Send Status:\t");
  Serial.println(status == ESP_NOW_SEND_SUCCESS ? "Delivery Success" : "Delivery Fail");
#endif
}

// Callback when data is received
void OnDataRecv(const uint8_t *mac, const uint8_t *incomingData, int len)
{
  if (len == sizeof(incomingdataCar))
  {
    memcpy(&incomingdataCar, incomingData, sizeof(incomingdataCar));
#ifdef DEBUG
    Serial.print("Bytes calVal: ");
    Serial.println(len);
#endif
    dataCarList.push_back(incomingdataCar);
  }
}

void setup_wifi()
{
  delay(10);
// We start by connecting to a WiFi network
#ifdef DEBUG
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);
#endif

  WiFi.persistent(false);
  WiFi.mode(WIFI_AP_STA);
  WiFi.begin(ssid, password);
  WiFi.setSleep(false);

  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
#ifdef DEBUG
    Serial.print(".");
#endif
  }
#ifdef DEBUG
  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.printf("Canal: %d\n", WiFi.channel());
  Serial.println(WiFi.localIP());
#endif
}

void callback(char *topic, byte *message, unsigned int length)
{
#ifdef DEBUG
  Serial.print("Message arrived on topic: ");
  Serial.print(topic);
  Serial.print(". Message: ");

  String messageTemp;

  for (int i = 0; i < length; i++)
  {
    Serial.print((char)message[i]);
    messageTemp += (char)message[i];
  }
  Serial.println();
#endif
}

void reconnect()
{
  // Loop until we're reconnected
  while (!client.connected())
  {
#ifdef DEBUG
    Serial.print("Attempting MQTT connection...");
#endif
    // Attempt to connect
    if (client.connect("ESP8266Client"))
    {
#ifdef DEBUG
      Serial.println("connected");
#endif
      // Subscribe
      client.subscribe("esp32/output");
    }
    else
    {
#ifdef DEBUG
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
#endif
      // Wait 5 seconds before retrying
      delay(5000);
    }
  }
}

void setup()
{
#ifdef DEBUG
  Serial.begin(115200);
#endif

  upBtn.begin();
  downBtn.begin();
  leftBtn.begin();
  rightBtn.begin();
  cancelBtn.begin();
  acceptBtn.begin();

  lcd.begin(20, 4);
  lcd.setBacklight(HIGH);

  lcd.clear();

  lcd.setCursor(1, 0);
  lcd.print("TT - LineFollower");

  lcd.setCursor(3, 1);
  lcd.print("Control Unit");

  lcd.setCursor(1, 3);
  lcd.print("V0.1 Raphera@2020");

  Menu mPrincipal("Inicio");

  Menu mDados("Dados");
  Menu mConfigs("Ajustes");
  Menu mInfo("Info");

  mPrincipal.MenuItens.add(&mDados);
  mPrincipal.MenuItens.add(&mConfigs);
  mPrincipal.MenuItens.add(&mInfo);

  setup_wifi();

  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);

  // Init ESP-NOW
  if (esp_now_init() != ESP_OK)
  {
#ifdef DEBUG
    Serial.println("Error initializing ESP-NOW");
#endif
    return;
  }

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
#ifdef DEBUG
    Serial.println("Failed to add peer");
#endif
    return;
  }
  // Register for a callback function that will be called when data is received
  esp_now_register_recv_cb(OnDataRecv);

#ifdef DEBUG
  Serial.printf("MAC: %s\n", WiFi.macAddress().c_str());
#endif
}

void loop()
{
  if (!client.connected())
  {
    reconnect();
  }
  client.loop();

  if (dataCarList.size() > 0)
  {
    tempdataCar = dataCarList.front();
    
    client.publish("runtime", String(tempdataCar.time).c_str());

    client.publish("sensor/array/line", String(tempdataCar.carVal.sArray.line).c_str());
    client.publish("sensor/encoder/esq", String(tempdataCar.carVal.motEncs.encEsq).c_str());
    client.publish("sensor/encoder/dir", String(tempdataCar.carVal.motEncs.encDir).c_str());

    client.publish("values/latMarks/leftPassed", String(tempdataCar.carVal.latMarks.leftPassed).c_str());
    client.publish("values/latMarks/rightPassed", String(tempdataCar.carVal.latMarks.rightPassed).c_str());
    client.publish("values/latMarks/sLatDir", String(tempdataCar.carVal.latMarks.sLatDir).c_str());
    client.publish("values/latMarks/sLatEsq", String(tempdataCar.carVal.latMarks.sLatEsq).c_str());
    client.publish("values/speed/left", String(tempdataCar.carVal.speed.left).c_str());
    client.publish("values/speed/right", String(tempdataCar.carVal.speed.right).c_str());

    client.publish("values/speed/right", String(tempdataCar.carVal.speed.right).c_str());


    dataCarList.pop_front();
  }
}
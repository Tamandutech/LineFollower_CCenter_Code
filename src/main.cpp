#include <EasyButton.h>
#include <LinkedList.h>
#include <LiquidCrystal_I2C.h>
#include <Wire.h>
#include <WiFi.h>
#include <esp_now.h>
#include <list>

using namespace std;
// MACs ESPs:

// Braia: 24:6F:28:B2:23:D0
// CCenter: 24:6F:28:9D:7C:44

uint8_t broadcastAddress[] = {0x24, 0x6F, 0x28, 0xB2, 0x23, 0xD0};
esp_now_peer_info_t peerInfo;

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

struct valuesEnc
{
  uint32_t encDir = 0;
  uint32_t encEsq = 0;
  uint32_t media = 0;
};

struct valuesSamples
{
  valuesEnc motEncs;
  int sLat;
  int sArray;
  unsigned long time;

  valuesSamples(valuesEnc motEncs, int sLat, int sArray) : motEncs(motEncs), sLat(sLat), sArray(sArray)
  {
    time = millis();
  };

  valuesSamples(){};
};

// Create a struct_message to hold incoming sensor readings
valuesSamples incomingSample;
valuesSamples tempSample;
list<valuesSamples> samplesList;

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
  Serial.printf("Quantidade de itens no menu: %d\n", itens);

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
  Serial.printf("Quantidade de itens no menu: %d\n", itens);

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
  Serial.print("\r\nLast Packet Send Status:\t");
  Serial.println(status == ESP_NOW_SEND_SUCCESS ? "Delivery Success" : "Delivery Fail");
}

// Callback when data is received
void OnDataRecv(const uint8_t *mac, const uint8_t *incomingData, int len)
{
  memcpy(&incomingSample, incomingData, sizeof(incomingSample));
  Serial.print("Bytes received: ");
  Serial.println(len);

  samplesList.push_back(incomingSample);
}

void setup()
{
  Serial.begin(9600);

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

  // Set device as a Wi-Fi Station
  WiFi.mode(WIFI_STA);

  // Init ESP-NOW
  if (esp_now_init() != ESP_OK)
  {
    Serial.println("Error initializing ESP-NOW");
    return;
  }

  // Once ESPNow is successfully Init, we will register for Send CB to
  // get the status of Trasnmitted packet
  esp_now_register_send_cb(OnDataSent);

  // Register peer
  memcpy(peerInfo.peer_addr, broadcastAddress, 6);
  peerInfo.channel = 0;
  peerInfo.encrypt = false;

  // Add peer
  if (esp_now_add_peer(&peerInfo) != ESP_OK)
  {
    Serial.println("Failed to add peer");
    return;
  }
  // Register for a callback function that will be called when data is received
  esp_now_register_recv_cb(OnDataRecv);

  Serial.printf("MAC: %s\n", WiFi.macAddress().c_str());
}

void loop()
{
  while (samplesList.size() > 0)
  {
    tempSample = samplesList.front();
    printf("Tempo: %ld | tencEsq: %d | encDir: %d | encMedia: %d | sLat: %d | sArray: %d\n", tempSample.time, tempSample.motEncs.encEsq, tempSample.motEncs.encDir,
           tempSample.motEncs.media, tempSample.sLat, tempSample.sArray);
    samplesList.pop_front();
  }
}